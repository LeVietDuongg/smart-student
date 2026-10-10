// Máy chủ giả lập Turso (Hrana-over-HTTP v2, JSON) dùng node:sqlite, chỉ dùng cho test.
// Mỗi yêu cầu không có baton mở một kết nối mới; baton giữ kết nối cho giao dịch tương tác.
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

function decode(v) {
  if (v.type === "null") return null;
  if (v.type === "integer") return BigInt(v.value);
  if (v.type === "float") return Number(v.value);
  if (v.type === "text") return v.value;
  if (v.type === "blob") return new Uint8Array(Buffer.from(v.base64, "base64"));
  throw new Error("bad value type " + v.type);
}
function encode(v) {
  if (v === null || v === undefined) return { type: "null" };
  if (typeof v === "bigint") return { type: "integer", value: String(v) };
  if (typeof v === "number")
    return Number.isInteger(v) ? { type: "integer", value: String(v) } : { type: "float", value: v };
  if (typeof v === "string") return { type: "text", value: v };
  return { type: "blob", base64: Buffer.from(v).toString("base64") };
}

export async function startFakeTurso(file, token) {
  const streams = new Map();
  const stats = { requests: 0, transactions: 0 };
  const server = createServer(async (req, res) => {
    const reply = (status, body) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (req.method !== "POST" || req.url !== "/v2/pipeline") return reply(404, { message: "not found" });
    if (req.headers.authorization !== `Bearer ${token}`) return reply(401, { message: "unauthorized" });
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw);
    stats.requests++;
    let conn;
    if (body.baton) {
      conn = streams.get(body.baton);
      streams.delete(body.baton);
      if (!conn) return reply(400, { message: "invalid baton" });
    } else {
      conn = new DatabaseSync(file);
      conn.exec("PRAGMA busy_timeout=5000");
    }
    let closed = false;
    const results = body.requests.map((r) => {
      try {
        if (r.type === "close") {
          conn.close();
          closed = true;
          return { type: "ok", response: { type: "close" } };
        }
        if (r.type === "sequence") {
          conn.exec(r.sql);
          return { type: "ok", response: { type: "sequence" } };
        }
        if (r.type === "execute") {
          if (/^\s*BEGIN/i.test(r.stmt.sql)) stats.transactions++;
          const stmt = conn.prepare(r.stmt.sql);
          stmt.setReadBigInts(true);
          const args = (r.stmt.args || []).map(decode);
          const cols = stmt.columns().map((c) => ({ name: c.name, decltype: c.type }));
          let rows = [],
            affected = 0,
            lastId = null;
          if (cols.length) rows = stmt.all(...args).map((o) => cols.map((c) => encode(o[c.name])));
          else {
            const x = stmt.run(...args);
            affected = Number(x.changes);
            lastId = String(x.lastInsertRowid);
          }
          return {
            type: "ok",
            response: {
              type: "execute",
              result: { cols, rows, affected_row_count: affected, last_insert_rowid: lastId },
            },
          };
        }
        return { type: "error", error: { message: "unsupported request " + r.type } };
      } catch (e) {
        return { type: "error", error: { message: e.message, code: e.code || "SQLITE_ERROR" } };
      }
    });
    let baton = null;
    if (!closed) {
      baton = randomBytes(12).toString("hex");
      streams.set(baton, conn);
    }
    reply(200, { baton, base_url: null, results });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    stats,
    close: () =>
      new Promise((r) => {
        for (const c of streams.values()) c.close();
        server.close(r);
      }),
  };
}
