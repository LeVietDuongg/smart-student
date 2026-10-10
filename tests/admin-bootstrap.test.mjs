import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = resolve(process.env.TEST_WORK_DIR || resolve(project, "../..", "work"));
mkdirSync(scratch, { recursive: true });

async function start(extra, keepDir) {
  const dataDir = keepDir || mkdtempSync(resolve(scratch, "smart-student-admin-"));
  const port = 39000 + Math.floor(Math.random() * 1000), origin = `http://127.0.0.1:${port}`;
  const proc = spawn(process.execPath, ["server.mjs"], {
    cwd: project,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", APP_ORIGIN: origin, DATA_DIR: dataDir,
      SEED_DEMO: "0", NODE_ENV: "test", COOKIE_SECURE: "0", AI_PROVIDER: "library", ADMIN_EMAIL: "", ADMIN_PASSWORD: "", TURSO_DATABASE_URL: "", TURSO_AUTH_TOKEN: "", ...extra },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  proc.stdout.on("data", (x) => (logs += x));
  proc.stderr.on("data", (x) => (logs += x));
  const exited = new Promise((r) => proc.on("exit", r));
  for (let i = 0; i < 80 && !logs.includes("chạy tại") && proc.exitCode === null; i++) await delay(100);
  return { proc, origin, dataDir, logs: () => logs, exited,
    stop: async () => { if (proc.exitCode === null) { proc.kill("SIGTERM"); await exited; } if (!keepDir) rmSync(dataDir, { recursive: true, force: true }); } };
}

async function login(origin, email, password) {
  let res = await fetch(origin + "/api/session");
  let cookie = (res.headers.get("set-cookie") || "").split(";")[0];
  const { csrf } = await res.json();
  res = await fetch(origin + "/api/login", { method: "POST",
    headers: { Cookie: cookie, Origin: origin, "Content-Type": "application/json", "X-CSRF-Token": csrf },
    body: JSON.stringify({ email, password }) });
  return { status: res.status, data: await res.json() };
}

test("ADMIN_EMAIL/ADMIN_PASSWORD tạo quản trị viên đầu tiên, không ghi mật khẩu ra file", async () => {
  const password = "Demo-Admin-Pass-2026!";
  const s = await start({ ADMIN_EMAIL: "Owner@Example.edu.vn", ADMIN_PASSWORD: password });
  try {
    assert.match(s.logs(), /chạy tại/, s.logs());
    assert.doesNotMatch(s.logs(), new RegExp(password));
    const file = readFileSync(resolve(s.dataDir, "initial-credentials.json"), "utf8");
    assert.ok(!file.includes(password));
    const ok = await login(s.origin, "owner@example.edu.vn", password);
    assert.equal(ok.status, 200, JSON.stringify(ok.data));
    assert.equal(ok.data.user.role, "admin");
    assert.equal((await login(s.origin, "admin@smart.edu.vn", password)).status, 401);
  } finally { await s.stop(); }
});

test("ADMIN_PASSWORD quá ngắn làm máy chủ dừng thay vì tạo admin yếu", async () => {
  const s = await start({ ADMIN_PASSWORD: "short" });
  try {
    await Promise.race([s.exited, delay(8000)]);
    assert.notEqual(s.proc.exitCode, null, "server phải dừng");
    assert.notEqual(s.proc.exitCode, 0);
  } finally { await s.stop(); }
});

test("đổi ADMIN_PASSWORD rồi khởi động lại sẽ cập nhật mật khẩu admin dù database đã tồn tại", async () => {
  const dir = mkdtempSync(resolve(scratch, "smart-student-admin-keep-"));
  const first = "Mat-khau-cu-2026!!", second = "Mat-khau-moi-2026!!";
  try {
    let s = await start({ ADMIN_EMAIL: "chu@example.edu.vn", ADMIN_PASSWORD: first }, dir);
    assert.equal((await login(s.origin, "chu@example.edu.vn", first)).status, 200);
    await s.stop();
    s = await start({ ADMIN_EMAIL: "chu@example.edu.vn", ADMIN_PASSWORD: second }, dir);
    assert.equal((await login(s.origin, "chu@example.edu.vn", second)).status, 200, s.logs());
    assert.equal((await login(s.origin, "chu@example.edu.vn", first)).status, 401);
    await s.stop();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
