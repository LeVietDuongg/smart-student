// Lớp truy cập database dùng chung cho cả hai chế độ:
// - Cục bộ: file SQLite qua node:sqlite (máy cá nhân, test).
// - Turso: SQLite trên đám mây qua giao thức Hrana HTTP (dữ liệu không mất khi Render Free ngủ/deploy).
// Mọi hàm đều trả Promise. Giao dịch được xếp hàng trong tiến trình; trong lúc một giao dịch
// đang mở, các truy vấn khác phải chờ, còn truy vấn bên trong giao dịch tự đi qua kết nối của nó.
import { DatabaseSync } from "node:sqlite";
import { AsyncLocalStorage } from "node:async_hooks";

const txContext = new AsyncLocalStorage();

export function openDatabase({ file, url, authToken }) {
  const backend = url ? remoteBackend(url, authToken) : localBackend(file);
  let active = null; // Promise của giao dịch đang chạy

  async function gate() {
    while (active) await active;
  }
  async function exec(kind, sql, args) {
    const tx = txContext.getStore();
    if (tx) return tx[kind](sql, args);
    await gate();
    return backend[kind](sql, args);
  }
  return {
    kind: url ? "turso" : "sqlite",
    q: (sql, ...args) => exec("all", sql, args),
    one: (sql, ...args) => exec("get", sql, args),
    run: (sql, ...args) => exec("run", sql, args),
    exec: async (sql) => {
      await gate();
      return backend.script(sql);
    },
    async transaction(fn) {
      check(!txContext.getStore(), "Không hỗ trợ giao dịch lồng nhau.");
      while (active) await active;
      let release;
      active = new Promise((r) => (release = r));
      try {
        const tx = await backend.begin();
        try {
          const result = await txContext.run(tx, fn);
          await tx.commit();
          return result;
        } catch (e) {
          await tx.rollback().catch(() => {});
          throw e;
        }
      } finally {
        active = null;
        release();
      }
    },
    close: () => backend.close(),
  };
}

function check(ok, message) {
  if (!ok) throw new Error(message);
}

function localBackend(file) {
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
  const ops = {
    all: async (sql, args) => db.prepare(sql).all(...args),
    get: async (sql, args) => db.prepare(sql).get(...args),
    run: async (sql, args) => {
      const r = db.prepare(sql).run(...args);
      return { changes: Number(r.changes), lastInsertRowid: r.lastInsertRowid };
    },
  };
  return {
    ...ops,
    script: async (sql) => db.exec(sql),
    async begin() {
      db.exec("BEGIN IMMEDIATE");
      return {
        ...ops,
        commit: async () => db.exec("COMMIT"),
        rollback: async () => db.exec("ROLLBACK"),
      };
    },
    close: () => db.close(),
  };
}

// --- Turso / libSQL qua Hrana-over-HTTP (v2 pipeline, JSON) ---------------------------
export function hranaUrl(url) {
  const u = new URL(url.replace(/^libsql:/, "https:"));
  check(["https:", "http:"].includes(u.protocol), "TURSO_DATABASE_URL phải bắt đầu bằng libsql:// hoặc https://");
  return u.origin;
}

function encodeValue(v) {
  if (v === null || v === undefined) return { type: "null" };
  if (typeof v === "bigint") return { type: "integer", value: String(v) };
  if (typeof v === "number")
    return Number.isInteger(v) ? { type: "integer", value: String(v) } : { type: "float", value: v };
  if (typeof v === "boolean") return { type: "integer", value: v ? "1" : "0" };
  if (typeof v === "string") return { type: "text", value: v };
  if (v instanceof Uint8Array) return { type: "blob", base64: Buffer.from(v).toString("base64") };
  throw new Error("Kiểu dữ liệu SQL không hỗ trợ: " + typeof v);
}
function decodeValue(v) {
  switch (v.type) {
    case "null":
      return null;
    case "integer": {
      const n = Number(v.value);
      return Number.isSafeInteger(n) ? n : BigInt(v.value);
    }
    case "float":
      return Number(v.value);
    case "text":
      return v.value;
    case "blob":
      return new Uint8Array(Buffer.from(v.base64, "base64"));
    default:
      throw new Error("Turso trả về kiểu dữ liệu lạ: " + v.type);
  }
}
function sqlError(error) {
  const e = new Error(error.message || "Lỗi database");
  e.code = error.code;
  return e;
}
const stmt = (sql, args) => ({
  type: "execute",
  stmt: { sql, args: args.map(encodeValue), want_rows: true },
});
// Kết nối mới của libSQL tắt khóa ngoại giống SQLite; bật lại để ON DELETE CASCADE hoạt động.
const foreignKeys = stmt("PRAGMA foreign_keys=ON", []);

function remoteBackend(url, authToken) {
  const origin = hranaUrl(url);
  check(authToken, "Thiếu TURSO_AUTH_TOKEN.");

  async function pipeline(requests, baton = null, baseUrl = origin) {
    const res = await fetch(new URL("/v2/pipeline", baseUrl), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ baton, requests }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Turso HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    const body = await res.json();
    check(Array.isArray(body.results) && body.results.length === requests.length, "Turso trả về kết quả không hợp lệ.");
    return body;
  }
  function result(r) {
    if (r.type === "error") throw sqlError(r.error);
    return r.response?.result;
  }
  function rows(res) {
    const cols = res.cols.map((c) => c.name);
    return res.rows.map((row) => Object.fromEntries(cols.map((c, i) => [c, decodeValue(row[i])])));
  }
  const shape = {
    all: (res) => rows(res),
    get: (res) => rows(res)[0],
    run: (res) => ({
      changes: res.affected_row_count,
      lastInsertRowid: res.last_insert_rowid == null ? undefined : BigInt(res.last_insert_rowid),
    }),
  };
  async function once(kind, sql, args) {
    const body = await pipeline([foreignKeys, stmt(sql, args), { type: "close" }]);
    return shape[kind](result(body.results[1]));
  }
  return {
    all: (sql, args) => once("all", sql, args),
    get: (sql, args) => once("get", sql, args),
    run: (sql, args) => once("run", sql, args),
    async script(sql) {
      const body = await pipeline([{ type: "sequence", sql }, { type: "close" }]);
      result(body.results[0]);
    },
    async begin() {
      let body = await pipeline([foreignKeys, stmt("BEGIN IMMEDIATE", [])]);
      result(body.results[1]);
      let baton = body.baton,
        base = body.base_url || origin,
        closed = false;
      check(baton, "Turso không mở được giao dịch.");
      async function send(requests) {
        check(!closed, "Giao dịch đã kết thúc.");
        const b = await pipeline(requests, baton, base);
        baton = b.baton;
        base = b.base_url || base;
        return b;
      }
      const op = (kind) => async (sql, args) => shape[kind](result((await send([stmt(sql, args)])).results[0]));
      async function finish(sql) {
        try {
          const b = await send([stmt(sql, []), { type: "close" }]);
          result(b.results[0]);
        } finally {
          closed = true;
        }
      }
      return {
        all: op("all"),
        get: op("get"),
        run: op("run"),
        commit: () => finish("COMMIT"),
        rollback: () => finish("ROLLBACK"),
      };
    },
    close: () => {},
  };
}
