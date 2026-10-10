import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { startFakeTurso } from "./fake-turso.mjs";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = resolve(process.env.TEST_WORK_DIR || resolve(project, "../..", "work"));
mkdirSync(scratch, { recursive: true });

async function start(turso) {
  // Mỗi lần khởi động dùng DATA_DIR mới, giống Render Free xóa sạch ổ đĩa sau mỗi lần deploy.
  const dataDir = mkdtempSync(resolve(scratch, "smart-student-turso-"));
  const port = 41000 + Math.floor(Math.random() * 1000), origin = `http://127.0.0.1:${port}`;
  const proc = spawn(process.execPath, ["server.mjs"], {
    cwd: project,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", APP_ORIGIN: origin, DATA_DIR: dataDir,
      SEED_DEMO: "0", NODE_ENV: "test", COOKIE_SECURE: "0", AI_PROVIDER: "library", ADMIN_EMAIL: "", ADMIN_PASSWORD: "",
      GOOGLE_CLIENT_ID: "", TURSO_DATABASE_URL: turso.url, TURSO_AUTH_TOKEN: "tok" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  proc.stdout.on("data", (x) => (logs += x));
  proc.stderr.on("data", (x) => (logs += x));
  const exited = new Promise((r) => proc.on("exit", r));
  for (let i = 0; i < 100 && !logs.includes("chạy tại") && proc.exitCode === null; i++) await delay(100);
  return { origin, logs: () => logs,
    stop: async () => { if (proc.exitCode === null) { proc.kill("SIGTERM"); await exited; } rmSync(dataDir, { recursive: true, force: true }); } };
}

async function call(origin, path, body) {
  const s = await fetch(origin + "/api/session");
  const cookie = (s.headers.get("set-cookie") || "").split(";")[0];
  const { csrf } = await s.json();
  const r = await fetch(origin + path, { method: "POST",
    headers: { Cookie: cookie, Origin: origin, "Content-Type": "application/json", "X-CSRF-Token": csrf },
    body: JSON.stringify(body) });
  return { status: r.status, data: await r.json() };
}

test("tài khoản đăng ký còn nguyên sau khi máy chủ khởi động lại với ổ đĩa trống (Turso)", async () => {
  const dir = mkdtempSync(resolve(scratch, "smart-student-turso-db-"));
  const turso = await startFakeTurso(resolve(dir, "remote.sqlite"), "tok");
  const account = { name: "Sinh Viên Bền", email: "ben@gmail.com", password: "Mat-khau-ben-2026!" };
  try {
    let s = await start(turso);
    assert.match(s.logs(), /database: Turso/, s.logs());
    assert.equal((await call(s.origin, "/api/register", account)).status, 201);
    await s.stop();

    s = await start(turso);
    assert.match(s.logs(), /chạy tại/, s.logs());
    assert.doesNotMatch(s.logs(), /Tài khoản ban đầu/, "Không được khởi tạo lại database đã có dữ liệu");
    const login = await call(s.origin, "/api/login", { email: account.email, password: account.password });
    assert.equal(login.status, 200, JSON.stringify(login.data));
    assert.equal(login.data.user.name, account.name);
    await s.stop();
  } finally {
    await turso.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("sai TURSO_AUTH_TOKEN làm máy chủ dừng rõ ràng thay vì chạy với database rỗng", async () => {
  const dir = mkdtempSync(resolve(scratch, "smart-student-turso-db-"));
  const turso = await startFakeTurso(resolve(dir, "remote.sqlite"), "khac");
  try {
    const s = await start(turso);
    await delay(500);
    assert.doesNotMatch(s.logs(), /chạy tại/);
    assert.match(s.logs(), /Turso HTTP 401/);
    await s.stop();
  } finally {
    await turso.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
