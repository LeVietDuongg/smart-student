import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { generateKeyPairSync, createSign } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = resolve(process.env.TEST_WORK_DIR || resolve(project, "../..", "work"));
mkdirSync(scratch, { recursive: true });

const clientId = "123456-test.apps.googleusercontent.com";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const other = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "k1", alg: "RS256", use: "sig" };

const certs = createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ keys: [jwk] }));
});
await new Promise((r) => certs.listen(0, "127.0.0.1", r));
const certsUrl = `http://127.0.0.1:${certs.address().port}/certs`;

const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
function idToken(claims = {}, { key = privateKey, kid = "k1" } = {}) {
  const head = b64({ alg: "RS256", typ: "JWT", kid });
  const body = b64({
    iss: "https://accounts.google.com",
    aud: clientId,
    exp: Math.floor(Date.now() / 1000) + 3600,
    email: "sv.google@gmail.com",
    email_verified: true,
    name: "Nguyễn Google",
    ...claims,
  });
  const sig = createSign("RSA-SHA256").update(`${head}.${body}`).sign(key).toString("base64url");
  return `${head}.${body}.${sig}`;
}

async function start(extra = {}) {
  const dataDir = mkdtempSync(resolve(scratch, "smart-student-google-"));
  const port = 40000 + Math.floor(Math.random() * 1000), origin = `http://127.0.0.1:${port}`;
  const proc = spawn(process.execPath, ["server.mjs"], {
    cwd: project,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", APP_ORIGIN: origin, DATA_DIR: dataDir,
      SEED_DEMO: "0", NODE_ENV: "test", COOKIE_SECURE: "0", AI_PROVIDER: "library",
      ADMIN_EMAIL: "", ADMIN_PASSWORD: "", TURSO_DATABASE_URL: "", TURSO_AUTH_TOKEN: "", GOOGLE_CLIENT_ID: clientId, GOOGLE_CERTS_URL: certsUrl, ...extra },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  proc.stdout.on("data", (x) => (logs += x));
  proc.stderr.on("data", (x) => (logs += x));
  const exited = new Promise((r) => proc.on("exit", r));
  for (let i = 0; i < 80 && !logs.includes("chạy tại") && proc.exitCode === null; i++) await delay(100);
  return { origin, logs: () => logs,
    stop: async () => { if (proc.exitCode === null) { proc.kill("SIGTERM"); await exited; } rmSync(dataDir, { recursive: true, force: true }); } };
}

async function google(origin, credential) {
  const res = await fetch(origin + "/api/session");
  const cookie = (res.headers.get("set-cookie") || "").split(";")[0];
  const { csrf, googleClientId } = await res.json();
  const r = await fetch(origin + "/api/google", { method: "POST",
    headers: { Cookie: cookie, Origin: origin, "Content-Type": "application/json", "X-CSRF-Token": csrf },
    body: JSON.stringify({ credential }) });
  return { status: r.status, data: await r.json(), googleClientId, headers: res.headers };
}

test("đăng nhập Google tạo sinh viên mới rồi đăng nhập lại cùng tài khoản", async () => {
  const s = await start();
  try {
    assert.match(s.logs(), /chạy tại/, s.logs());
    const first = await google(s.origin, idToken());
    assert.equal(first.googleClientId, clientId);
    assert.match(first.headers.get("content-security-policy"), /accounts\.google\.com\/gsi\/client/);
    assert.equal(first.status, 200, JSON.stringify(first.data));
    assert.equal(first.data.user.email, "sv.google@gmail.com");
    assert.equal(first.data.user.role, "student");
    const again = await google(s.origin, idToken());
    assert.equal(again.status, 200);
    assert.equal(again.data.user.id, first.data.user.id);
  } finally {
    await s.stop();
  }
});

test("token Google sai chữ ký, sai client, hết hạn hoặc email chưa xác minh bị từ chối", async () => {
  const s = await start();
  try {
    const bad = [
      idToken({}, { key: other.privateKey }),
      idToken({ aud: "khac.apps.googleusercontent.com" }),
      idToken({ exp: Math.floor(Date.now() / 1000) - 10 }),
      idToken({ email_verified: false }),
      idToken({ iss: "https://evil.example" }),
      idToken({}, { kid: "unknown" }),
      "khong.phai.token",
      "",
    ];
    for (const t of bad) {
      const r = await google(s.origin, t);
      assert.equal(r.status, 401, JSON.stringify(r.data));
    }
  } finally {
    await s.stop();
  }
});

test("email trùng ADMIN_EMAIL đăng nhập Google được quyền quản trị, tài khoản khóa thì bị chặn", async () => {
  const s = await start({ ADMIN_EMAIL: "chu@gmail.com", ADMIN_PASSWORD: "Mat-khau-admin-2026!" });
  try {
    const owner = await google(s.origin, idToken({ email: "chu@gmail.com", name: "Chủ dự án" }));
    assert.equal(owner.status, 200, JSON.stringify(owner.data));
    assert.equal(owner.data.user.role, "admin");
    const stranger = await google(s.origin, idToken({ email: "nguoi.la@gmail.com" }));
    assert.equal(stranger.data.user.role, "student");
  } finally {
    await s.stop();
  }
});

test("không bật Google khi thiếu GOOGLE_CLIENT_ID", async () => {
  const s = await start({ GOOGLE_CLIENT_ID: "" });
  try {
    const r = await google(s.origin, idToken());
    assert.equal(r.googleClientId, null);
    assert.equal(r.status, 404);
  } finally {
    await s.stop();
  }
});

test.after(() => certs.close());
