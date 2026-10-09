import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { request } from "node:http";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = resolve(process.env.TEST_WORK_DIR || resolve(project, "../..", "work"));
mkdirSync(scratch, { recursive: true });

// Raw HTTP so the test sees the encoding the server chose (fetch would decompress).
const get = (port, path, headers = {}) =>
  new Promise((ok, fail) =>
    request({ host: "127.0.0.1", port, path, headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => ok({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    }).on("error", fail).end(),
  );

test("Three.js và font được phục vụ cục bộ, nén gzip và cache dài hạn", async () => {
  const dataDir = mkdtempSync(resolve(scratch, "smart-student-static-"));
  const port = 40000 + Math.floor(Math.random() * 1000);
  const proc = spawn(process.execPath, ["server.mjs"], {
    cwd: project,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", APP_ORIGIN: `http://127.0.0.1:${port}`, DATA_DIR: dataDir,
      SEED_DEMO: "0", NODE_ENV: "test", COOKIE_SECURE: "0", AI_PROVIDER: "library", ADMIN_EMAIL: "", ADMIN_PASSWORD: "" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  proc.stdout.on("data", (x) => (logs += x));
  try {
    for (let i = 0; i < 80 && !logs.includes("chạy tại"); i++) await delay(100);
    const host = { Host: `127.0.0.1:${port}` };
    const three = await get(port, "/vendor/three/three.module.min.js", { ...host, "Accept-Encoding": "gzip, br" });
    assert.equal(three.status, 200);
    assert.equal(three.headers["content-encoding"], "gzip");
    assert.match(three.headers["cache-control"], /immutable/);
    const plain = await get(port, "/scene3d.js", host);
    assert.equal(plain.status, 200);
    assert.equal(plain.headers["content-encoding"], undefined);
    assert.equal(plain.headers["cache-control"], "no-store");
    assert.match(plain.body.toString(), /from "\.\/vendor\/three\/three\.module\.min\.js"/);
    const font = await get(port, "/fonts/be-vietnam-pro-vietnamese-400-normal.woff2", host);
    assert.equal(font.status, 200);
    assert.equal(font.headers["content-type"], "font/woff2");
    const csp = (await get(port, "/", host)).headers["content-security-policy"];
    assert.match(csp, /script-src 'self';/, "Không cần mở CSP cho CDN");
  } finally {
    proc.kill("SIGTERM");
    await new Promise((r) => proc.on("exit", r));
    rmSync(dataDir, { recursive: true, force: true });
  }
});
