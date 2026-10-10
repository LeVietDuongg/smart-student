import http from "node:http";
import { gzipSync } from "node:zlib";
import { openDatabase } from "./db.mjs";
import {
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
  createHash,
  createPublicKey,
  verify as verifySignature,
} from "node:crypto";
import { promisify } from "node:util";
import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { resolve, dirname, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { materials, questionBank, gameModes, rewardSeed } from "./seed.mjs";
import { aiConfig, generateAnswer } from "./ai-provider.mjs";
import { deploymentConfig } from "./deployment.mjs";

const root = dirname(fileURLToPath(import.meta.url));
if (Number(process.versions.node.split(".")[0]) < 24)
  throw new Error(
    "Smart Student cần Node.js 24 trở lên. Hãy dùng START.cmd hoặc cài Node.js 24 từ nodejs.org.",
  );
if (existsSync(resolve(root, ".env")))
  for (const line of readFileSync(resolve(root, ".env"), "utf8").split(
    /\r?\n/,
  )) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]])
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
const production = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3000),
  host = process.env.HOST || (production ? "0.0.0.0" : "127.0.0.1");
// Render terminates HTTPS at its load balancer and provides the public URL.
// Production defaults are secure so manual Web Service setup does not need to
// copy Blueprint-only environment values to avoid silently unsafe cookies/data.
const runtimeEnv = {
  ...process.env,
  APP_ORIGIN: process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL,
  COOKIE_SECURE: process.env.COOKIE_SECURE ?? (production ? "1" : "0"),
};
const { origin, origins: allowedOrigins, hosts: allowedHosts } = deploymentConfig(runtimeEnv, host, port);
const ai = aiConfig();
const secure = runtimeEnv.COOKIE_SECURE === "1";
const seedDemo = process.env.SEED_DEMO === undefined
  ? !production
  : process.env.SEED_DEMO === "1";
if (
  production &&
  (!secure || !origin.startsWith("https://") || seedDemo)
)
  throw new Error(
    "Cấu hình production không an toàn. Trên Render: xóa APP_ORIGIN sai/localhost để dùng RENDER_EXTERNAL_URL, đặt COOKIE_SECURE=1 và SEED_DEMO=0.",
  );
const cookieName = secure ? "__Host-smart_session" : "smart_session";
// Đăng nhập Google (tùy chọn). Chỉ cần Client ID công khai, không cần client secret.
const googleClientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
if (googleClientId && !/^[\w-]+(\.[\w-]+)*\.apps\.googleusercontent\.com$/.test(googleClientId))
  throw new Error("GOOGLE_CLIENT_ID không hợp lệ (phải kết thúc bằng .apps.googleusercontent.com).");
const googleCertsUrl =
  process.env.GOOGLE_CERTS_URL || "https://www.googleapis.com/oauth2/v3/certs";
// Sau proxy của Render mọi yêu cầu đều đến từ cùng một IP nội bộ, nên cần lấy IP thật.
const trustProxy = (process.env.TRUST_PROXY ?? (production ? "1" : "0")) === "1";
const dataDir = resolve(process.env.DATA_DIR || resolve(root, "data"));
mkdirSync(dataDir, { recursive: true });
// Có TURSO_DATABASE_URL thì dữ liệu nằm trên Turso (bền vững); không có thì dùng file SQLite trong DATA_DIR.
const db = openDatabase({
  file: resolve(dataDir, "smart-student.sqlite"),
  url: (process.env.TURSO_DATABASE_URL || "").trim() || null,
  authToken: (process.env.TURSO_AUTH_TOKEN || "").trim() || null,
});
await db.exec(`
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('student','teacher','admin')),active INTEGER NOT NULL DEFAULT 1,coins INTEGER NOT NULL DEFAULT 0 CHECK(coins>=0),xp INTEGER NOT NULL DEFAULT 0,settings TEXT NOT NULL DEFAULT '{}',created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,csrf TEXT NOT NULL,created INTEGER NOT NULL,touched INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,done INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS schedules(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,kind TEXT NOT NULL,start TEXT NOT NULL,end TEXT NOT NULL,location TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS grades(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,subject TEXT NOT NULL,values_json TEXT NOT NULL,result REAL NOT NULL,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,section TEXT NOT NULL,owner TEXT NOT NULL REFERENCES users(id),payload TEXT NOT NULL,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS memberships(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,group_id TEXT REFERENCES records(id) ON DELETE CASCADE,PRIMARY KEY(user_id,group_id));
CREATE TABLE IF NOT EXISTS registrations(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,event_id TEXT REFERENCES records(id) ON DELETE CASCADE,PRIMARY KEY(user_id,event_id));
CREATE TABLE IF NOT EXISTS posts(id TEXT PRIMARY KEY,group_id TEXT REFERENCES records(id) ON DELETE CASCADE,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS progress(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,material_id TEXT REFERENCES records(id) ON DELETE CASCADE,done INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,material_id));
CREATE TABLE IF NOT EXISTS ratings(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,teacher_id TEXT REFERENCES users(id) ON DELETE CASCADE,value INTEGER NOT NULL CHECK(value BETWEEN 1 AND 5),PRIMARY KEY(user_id,teacher_id));
CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,mode TEXT NOT NULL,questions TEXT NOT NULL,started INTEGER NOT NULL,finished INTEGER,score INTEGER,reward INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS game_rewards(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,mode TEXT NOT NULL,day TEXT NOT NULL,PRIMARY KEY(user_id,mode,day));
CREATE TABLE IF NOT EXISTS rewards(id TEXT PRIMARY KEY,title TEXT NOT NULL,icon TEXT NOT NULL,cost INTEGER NOT NULL CHECK(cost>0),category TEXT NOT NULL,stock INTEGER NOT NULL CHECK(stock>=0));
CREATE TABLE IF NOT EXISTS redemptions(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,reward_id TEXT REFERENCES rewards(id),cost INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,amount INTEGER NOT NULL,reason TEXT NOT NULL,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS activity(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,day TEXT NOT NULL,seconds INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,day));
CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,seen INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,actor TEXT,action TEXT NOT NULL,target TEXT,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS task_owner ON tasks(user_id); CREATE INDEX IF NOT EXISTS record_section ON records(section);
CREATE INDEX IF NOT EXISTS attempt_owner ON attempts(user_id,started); CREATE INDEX IF NOT EXISTS session_user ON sessions(user_id);
`);
const { q, one, run, transaction } = db;
const each = async (list, fn) => {
  for (let i = 0; i < list.length; i++) await fn(list[i], i);
};
const now = () => Date.now(),
  id = () => randomUUID(),
  hash = (t) => createHash("sha256").update(t).digest("hex");
const day = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const normalize = (t) =>
  String(t)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
const passwordHash = async (p) => {
  const salt = randomBytes(16).toString("hex");
  const key = await promisify(scrypt)(p, salt, 64);
  return `${salt}:${key.toString("hex")}`;
};
const passwordOK = async (p, h) => {
  const [salt, key] = h.split(":");
  const actual = await promisify(scrypt)(p, salt, 64);
  return timingSafeEqual(actual, Buffer.from(key, "hex"));
};
const dummyHash = await passwordHash(randomBytes(24).toString("base64url"));
const safeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  active: !!u.active,
  coins: u.coins,
  xp: u.xp,
  level: Math.floor(u.xp / 1000) + 1,
  settings: JSON.parse(u.settings),
});
const audit = async (actor, action, target = "") =>
  await run(
    "INSERT INTO audit VALUES(?,?,?,?,?)",
    id(),
    actor || null,
    action,
    target,
    now(),
  );
const notify = async (user, title) =>
  await run(
    "INSERT INTO notifications VALUES(?,?,?,?,?)",
    id(),
    user,
    title,
    0,
    now(),
  );
const problem = (status, message) =>
  Object.assign(new Error(message), { status });
const check = (condition, status, message) => {
  if (!condition) throw problem(status, message);
};
function textField(value, label, max = 200, min = 1) {
  check(typeof value === "string", 400, `${label} không hợp lệ.`);
  const s = value.trim();
  check(
    s.length >= min && s.length <= max,
    400,
    `${label} cần ${min}–${max} ký tự.`,
  );
  return s;
}
function enumField(value, allowed, label) {
  check(allowed.includes(value), 400, `${label} không hợp lệ.`);
  return value;
}
function emailField(value) {
  const s = textField(value, "Email", 254).toLowerCase();
  check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), 400, "Email không hợp lệ.");
  return s;
}
function validatePassword(value) {
  return passwordInput(value, 12);
}
function passwordInput(value, min = 1) {
  check(
    typeof value === "string" &&
      value.length >= min &&
      value.length <= 128 &&
      value.trim().length > 0,
    400,
    `Mật khẩu cần ${min}–128 ký tự.`,
  );
  return value;
}
function integer(value, min, max, label) {
  check(
    Number.isInteger(value) && value >= min && value <= max,
    400,
    `${label} không hợp lệ.`,
  );
  return value;
}
function dateTimeField(value) {
  check(
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value),
    400,
    "Ngày giờ không hợp lệ.",
  );
  const [y, m, d, h, minute] = value.split(/[-T:]/).map(Number),
    v = new Date(Date.UTC(y, m - 1, d, h, minute));
  check(
    y >= 2000 &&
      y <= 2100 &&
      v.getUTCFullYear() === y &&
      v.getUTCMonth() === m - 1 &&
      v.getUTCDate() === d &&
      v.getUTCHours() === h &&
      v.getUTCMinutes() === minute,
    400,
    "Ngày giờ không hợp lệ.",
  );
  return value;
}
const addUser = async (email, name, role, password) => {
  const uid = id(),
    encoded = await passwordHash(password);
  check(
    !await one("SELECT id FROM users WHERE email=?", email),
    409,
    "Email này đã được sử dụng.",
  );
  await run(
    "INSERT INTO users(id,email,name,password,role,created) VALUES(?,?,?,?,?,?)",
    uid,
    email,
    name,
    encoded,
    role,
    now(),
  );
  return uid;
};
function videoId(value) {
  if (!value) return "";
  const urlText = textField(value, "Liên kết video", 300);
  let url;
  try {
    url = new URL(urlText);
  } catch {
    throw problem(400, "Liên kết video không hợp lệ.");
  }
  check(
    url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      ["www.youtube.com", "youtube.com", "youtu.be"].includes(url.hostname) &&
      !url.port,
    400,
    "Chỉ hỗ trợ liên kết YouTube HTTPS.",
  );
  const vid =
    url.hostname === "youtu.be"
      ? url.pathname.slice(1)
      : url.pathname === "/watch"
        ? url.searchParams.get("v")
        : "";
  check(
    typeof vid === "string" && /^[a-zA-Z0-9_-]{11}$/.test(vid),
    400,
    "Mã video YouTube không hợp lệ.",
  );
  return vid;
}

// Hosting without a shell (e.g. Render Free) cannot read initial-credentials.json,
// so the first admin may be provisioned from secret env vars instead.
const envAdminEmail = process.env.ADMIN_EMAIL
  ? emailField(process.env.ADMIN_EMAIL)
  : "admin@smart.edu.vn";
const envAdminPassword = process.env.ADMIN_PASSWORD
  ? validatePassword(process.env.ADMIN_PASSWORD)
  : null;
if (!await one("SELECT id FROM users LIMIT 1")) {
  const credentials = [];
  const demo = seedDemo;
  for (const [email, name, role] of demo
    ? [
        [envAdminEmail, "Quản trị Smart Student", "admin"],
        ["giangvien@smart.edu.vn", "TS. Trần Minh Đức", "teacher"],
        ["minhanh@smart.edu.vn", "Nguyễn Minh Anh", "student"],
      ]
    : [[envAdminEmail, "Quản trị Smart Student", "admin"]]) {
    const fromEnv = role === "admin" && envAdminPassword;
    const password = fromEnv || randomBytes(15).toString("base64url");
    const uid = await addUser(email, name, role, password);
    credentials.push(
      fromEnv
        ? { email, password: "(đặt qua biến môi trường ADMIN_PASSWORD)", role }
        : { email, password, role },
    );
    if (role === "student") {
      await run("UPDATE users SET coins=2350,xp=450 WHERE id=?", uid);
      await run(
        "INSERT INTO ledger VALUES(?,?,?,?,?)",
        id(),
        uid,
        2350,
        "Xu khởi tạo dữ liệu minh họa",
        now(),
      );
    }
  }
  writeFileSync(
    resolve(dataDir, "initial-credentials.json"),
    JSON.stringify(credentials, null, 2),
    { mode: 0o600 },
  );
  console.log(
    "Tài khoản ban đầu: " +
      resolve(dataDir, "initial-credentials.json") +
      ". Mật khẩu không in ra log.",
  );
  if (demo) {
    const teacher = (await one("SELECT id FROM users WHERE role='teacher'")).id,
      student = (await one("SELECT id FROM users WHERE role='student'")).id;
    await each(materials, async (m) =>
      await run(
        "INSERT INTO records VALUES(?,?,?,?,?)",
        id(),
        "materials",
        teacher,
        JSON.stringify({ ...m, published: true }),
        now(),
      ),
    );
    await each([
      [
        "Kinh tế vi mô – K64",
        "Kinh tế vi mô",
        "Cùng giải bài tập, trao đổi kiến thức và ôn thi.",
        "👩‍🎓",
      ],
      [
        "Marketing căn bản",
        "Marketing căn bản",
        "Góc chia sẻ ý tưởng và dự án marketing.",
        "💡",
      ],
      [
        "Học cùng AI",
        "Tin học",
        "Khám phá cách học hiệu quả với công nghệ.",
        "🤖",
      ],
      [
        "Nhóm ôn thi giữa kỳ",
        "Tổng hợp",
        "Cùng nhau vượt qua mùa thi thật tự tin.",
        "📖",
      ],
    ], async ([title, subject, description, icon]) => {
      const gid = id();
      await run(
        "INSERT INTO records VALUES(?,?,?,?,?)",
        gid,
        "groups",
        teacher,
        JSON.stringify({ title, subject, description, icon }),
        now(),
      );
      await run("INSERT INTO memberships VALUES(?,?)", teacher, gid);
    });
    await each([
      [
        "Workshop: Kỹ năng thuyết trình",
        "Kỹ năng",
        "Hội trường A",
        "Thực hành trình bày ý tưởng rõ ràng, tự tin.",
        "🎤",
      ],
      [
        "Ngày hội việc làm sinh viên",
        "Học thuật",
        "Sân trường",
        "Gặp gỡ doanh nghiệp và khám phá cơ hội nghề nghiệp.",
        "💼",
      ],
      [
        "Talkshow: Hành trình khởi nghiệp",
        "Học thuật",
        "Phòng B203",
        "Lắng nghe kinh nghiệm xây dựng dự án đầu tiên.",
        "🚀",
      ],
    ], async ([title, category, location, description, icon], i) => {
      const date =
        new Date(now() + (i + 3) * 86400000).toISOString().slice(0, 10) +
        "T09:00";
      await run(
        "INSERT INTO records VALUES(?,?,?,?,?)",
        id(),
        "events",
        teacher,
        JSON.stringify({
          title,
          category,
          location,
          description,
          icon,
          date,
          capacity: 100,
        }),
        now(),
      );
    });
    await each([
      "Làm bài tập Marketing",
      "Đọc tài liệu Quản trị học",
      "Chuẩn bị thuyết trình nhóm",
      "Ôn tập Quiz Kinh tế vi mô",
      "Xem lại bài giảng buổi 5",
    ], async (title, i) =>
      await run(
        "INSERT INTO tasks VALUES(?,?,?,?,?)",
        id(),
        student,
        title,
        i < 2 ? 1 : 0,
        now() + i,
      ),
    );
    const monday = new Date(day() + "T00:00:00+07:00");
    const d = monday.getDay();
    monday.setDate(monday.getDate() - ((d + 6) % 7) + (d === 0 ? 7 : 0));
    await each([
      ["Kinh tế vi mô", "class", 0, "09:00", "11:00", "P.101"],
      ["Marketing căn bản", "class", 2, "07:30", "09:00", "P.203"],
      ["Tin học ứng dụng", "class", 1, "13:00", "14:30", "Lab 2"],
      ["Quản trị học", "class", 0, "15:00", "16:30", "P.202"],
      ["Tiếng Anh", "class", 4, "10:00", "11:30", "P.301"],
      ["Thảo luận nhóm", "deadline", 3, "15:00", "16:00", "Thư viện"],
      ["Ôn thi giữa kỳ", "exam", 4, "17:00", "18:30", "P.105"],
    ], async ([title, kind, offset, s, e, location]) => {
      const date = new Date(monday);
      date.setDate(date.getDate() + offset);
      const dateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date);
      await run(
        "INSERT INTO schedules VALUES(?,?,?,?,?,?,?)",
        id(),
        student,
        title,
        kind,
        dateStr + "T" + s,
        dateStr + "T" + e,
        location,
      );
    });
    await notify(student, "Chào mừng bạn đến với Smart Student!");
    await notify(student, "Bộ câu hỏi ôn tập mới đã sẵn sàng.");
  }
  await each(rewardSeed, async (r) =>
    await run("INSERT INTO rewards VALUES(?,?,?,?,?,?)", id(), ...r),
  );
}
if (
  seedDemo &&
  !await one("SELECT value FROM metadata WHERE key='demo-v2'")
) {
  const main = await one("SELECT id FROM users WHERE email='minhanh@smart.edu.vn'");
  if (main) {
    const demoStudents = [];
    for (const [i, name, xp] of [
      [1, "Trần Hoàng Nam", 5230],
      [2, "Lê Bảo Ngọc", 4200],
      [3, "Phạm Quang Huy", 3950],
      [4, "Đỗ Khánh Linh", 3720],
    ]) {
      const email = `student${i}@demo.smart.local`;
      let u = await one("SELECT id FROM users WHERE email=?", email);
      const uid =
        u?.id ||
        (await addUser(
          email,
          name,
          "student",
          randomBytes(24).toString("base64url"),
        ));
      await run("UPDATE users SET xp=? WHERE id=?", xp, uid);
      demoStudents.push(uid);
    }
    for (const [i, name, subject] of [
      [2, "ThS. Lê Mai Anh", "Marketing căn bản"],
      [3, "PGS. Nguyễn Văn Nam", "Quản trị học"],
    ]) {
      const email = `teacher${i}@demo.smart.local`;
      const u = await one("SELECT id FROM users WHERE email=?", email);
      const uid =
        u?.id ||
        (await addUser(
          email,
          name,
          "teacher",
          randomBytes(24).toString("base64url"),
        ));
      await run(
        "UPDATE users SET settings=? WHERE id=?",
        JSON.stringify({
          subject,
          bio: "Hồ sơ giảng viên minh họa, đồng hành trong học tập và nghiên cứu.",
        }),
        uid,
      );
    }
    await each(await q("SELECT id FROM users WHERE role='teacher'"), async (t) =>
      await each(demoStudents, async (s, i) =>
        await run(
          "INSERT OR IGNORE INTO ratings VALUES(?,?,?)",
          s,
          t.id,
          i === 2 ? 4 : 5,
        ),
      ),
    );
    await run("UPDATE users SET xp=xp+4000 WHERE id=?", main.id);
    await audit(
      null,
      "demo.seed",
      "Dữ liệu minh họa cho bảng xếp hạng và giảng viên",
    );
  }
  await run("INSERT INTO metadata VALUES('demo-v2','1')");
}

// ADMIN_PASSWORD luôn là nguồn đúng cho tài khoản ADMIN_EMAIL: mỗi lần khởi động,
// nếu tài khoản thiếu, bị khóa, sai quyền hoặc sai mật khẩu thì khôi phục lại.
// Nhờ đó chủ dự án đổi biến môi trường trên Render là đăng nhập được, không cần Shell.
if (envAdminPassword) {
  const existing = await one("SELECT * FROM users WHERE email=?", envAdminEmail);
  if (!existing) {
    await addUser(envAdminEmail, "Quản trị Smart Student", "admin", envAdminPassword);
  } else if (
    !(await passwordOK(envAdminPassword, existing.password)) ||
    existing.role !== "admin" ||
    !existing.active
  ) {
    await run(
      "UPDATE users SET password=?,role='admin',active=1 WHERE id=?",
      await passwordHash(envAdminPassword),
      existing.id,
    );
    await run("DELETE FROM sessions WHERE user_id=?", existing.id);
    await audit(existing.id, "admin.env-reset", existing.id);
  }
}

let googleKeys = { at: 0, keys: [] };
async function googleKey(kid) {
  const find = () => googleKeys.keys.find((k) => k.kid === kid);
  if (!find() && now() - googleKeys.at > 60000) {
    let r;
    try {
      r = await fetch(googleCertsUrl, { signal: AbortSignal.timeout(5000) });
    } catch {
      throw problem(502, "Không kết nối được tới Google. Vui lòng thử lại.");
    }
    check(r.ok, 502, "Không kết nối được tới Google. Vui lòng thử lại.");
    googleKeys = { at: now(), keys: (await r.json()).keys || [] };
  }
  return find();
}
async function verifyGoogleToken(token) {
  const fail = () => problem(401, "Không xác minh được tài khoản Google.");
  check(googleClientId, 404, "Đăng nhập Google chưa được bật.");
  if (typeof token !== "string" || token.length > 4096) throw fail();
  const parts = token.split(".");
  if (parts.length !== 3) throw fail();
  let header, claims;
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  } catch {
    throw fail();
  }
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw fail();
  const jwk = await googleKey(header.kid);
  if (!jwk) throw fail();
  const valid = verifySignature(
    "RSA-SHA256",
    Buffer.from(parts[0] + "." + parts[1]),
    createPublicKey({ key: jwk, format: "jwk" }),
    Buffer.from(parts[2], "base64url"),
  );
  if (
    !valid ||
    !["https://accounts.google.com", "accounts.google.com"].includes(claims.iss) ||
    claims.aud !== googleClientId ||
    !(Number(claims.exp) * 1000 > now()) ||
    !(claims.email_verified === true || claims.email_verified === "true") ||
    typeof claims.email !== "string"
  )
    throw fail();
  return claims;
}

const limits = new Map();
function rate(key, max, windowMs) {
  const time = now();
  let entry = limits.get(key);
  if (!entry || time - entry.start >= windowMs) {
    entry = { start: time, count: 0 };
    limits.set(key, entry);
  }
  entry.count++;
  check(
    entry.count <= max,
    429,
    "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
  );
}
setInterval(async () => {
  const time = now();
  for (const [k, v] of limits) if (time - v.start > 3600000) limits.delete(k);
  await run(
    "DELETE FROM sessions WHERE created<? OR touched<?",
    time - 8 * 3600000,
    time - 30 * 60000,
  ).catch((e) => console.error("Dọn phiên thất bại:", e.message));
}, 60000).unref();
function headers(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  res.setHeader(
    "Content-Security-Policy",
    googleClientId
      ? "default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; img-src 'self' data:; connect-src 'self' https://accounts.google.com/gsi/; media-src 'self'; frame-src https://www.youtube-nocookie.com https://accounts.google.com/gsi/; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; media-src 'self'; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  );
  if (secure)
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
}
const json = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
};
async function session(req) {
  const cookies = Object.fromEntries(
    (req.headers.cookie || "").split(";").map((x) => x.trim().split("=")),
  );
  const raw = cookies[cookieName];
  if (!raw || !/^[a-zA-Z0-9_-]{43}$/.test(raw)) return null;
  const row = await one("SELECT * FROM sessions WHERE token=?", hash(raw));
  if (
    !row ||
    now() - row.created > 8 * 3600000 ||
    now() - row.touched > 30 * 60000
  )
    return null;
  await run("UPDATE sessions SET touched=? WHERE token=?", now(), row.token);
  return row;
}
async function newSession(res, user = null, previous = null) {
  if (previous) await run("DELETE FROM sessions WHERE token=?", previous.token);
  const raw = randomBytes(32).toString("base64url"),
    csrf = randomBytes(32).toString("base64url");
  await run(
    "INSERT INTO sessions VALUES(?,?,?,?,?)",
    hash(raw),
    user,
    csrf,
    now(),
    now(),
  );
  res.setHeader(
    "Set-Cookie",
    `${cookieName}=${raw}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure ? "; Secure" : ""}`,
  );
  return { csrf };
}
async function body(req) {
  check(
    req.headers["content-type"]?.split(";")[0] === "application/json",
    415,
    "Yêu cầu cần ở định dạng JSON.",
  );
  let size = 0,
    buffers = [];
  for await (const chunk of req) {
    size += chunk.length;
    check(size <= 65536, 413, "Nội dung quá lớn.");
    buffers.push(chunk);
  }
  let value;
  try {
    value = JSON.parse(Buffer.concat(buffers).toString());
  } catch {
    throw problem(400, "JSON không hợp lệ.");
  }
  check(
    value && typeof value === "object" && !Array.isArray(value),
    400,
    "Dữ liệu không hợp lệ.",
  );
  return value;
}
function permissions(user, roles) {
  check(
    roles.includes(user.role),
    403,
    "Tài khoản của bạn không có quyền thực hiện thao tác này.",
  );
}
function record(r) {
  return {
    id: r.id,
    owner: r.owner,
    ...JSON.parse(r.payload),
    created: r.created,
  };
}
async function records(section, user) {
  return (await q(
    "SELECT * FROM records WHERE section=? ORDER BY created DESC",
    section,
  ))
    .map(record)
    .filter(
      (r) =>
        section !== "materials" ||
        r.published ||
        r.owner === user.id ||
        user.role === "admin",
    );
}
async function notifyAll(title) {
  await each(await q("SELECT id FROM users WHERE active=1"), async (u) => await notify(u.id, title));
}
async function bootstrap(user) {
  const stats = await one(
    "SELECT count(*) as plays,COALESCE(sum(score),0) as correct,COALESCE(sum(reward),0) as earned FROM attempts WHERE user_id=? AND finished IS NOT NULL",
    user.id,
  );
  const activity = await q(
    "SELECT day,seconds FROM activity WHERE user_id=? AND day>=? ORDER BY day DESC LIMIT 7",
    user.id,
    new Date(now() - 6 * 86400000).toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    }),
  );
  const gameDays = (await q(
    "SELECT DISTINCT strftime('%Y-%m-%d',finished/1000,'unixepoch','+7 hours') AS day FROM attempts WHERE user_id=? AND finished IS NOT NULL AND score>0 AND finished>? ORDER BY day DESC",
    user.id,
    now() - 90 * 86400000,
  )).map((r) => r.day);
  return {
    user: safeUser(user),
    today: day(),
    tasks: await q("SELECT * FROM tasks WHERE user_id=? ORDER BY created", user.id),
    schedules: await q(
      "SELECT * FROM schedules WHERE user_id=? ORDER BY start",
      user.id,
    ),
    grades: (await q(
      "SELECT * FROM grades WHERE user_id=? ORDER BY created DESC",
      user.id,
    )).map((g) => ({ ...g, values: JSON.parse(g.values_json) })),
    materials: await records("materials", user),
    groups: (await Promise.all((await records("groups", user)).map(async (g) => ({
      ...g,
      members: (await one(
        "SELECT count(*) as n FROM memberships WHERE group_id=?",
        g.id,
      )).n,
      joined: !!await one(
        "SELECT 1 FROM memberships WHERE user_id=? AND group_id=?",
        user.id,
        g.id,
      ),
    })))),
    events: (await Promise.all((await records("events", user)).map(async (e) => ({
      ...e,
      registered: !!await one(
        "SELECT 1 FROM registrations WHERE user_id=? AND event_id=?",
        user.id,
        e.id,
      ),
      attendees: (await one(
        "SELECT count(*) as n FROM registrations WHERE event_id=?",
        e.id,
      )).n,
    })))),
    teachers: (await Promise.all((await q("SELECT * FROM users WHERE role='teacher' AND active=1")).map(
      async (t) => ({
        id: t.id,
        name: t.name,
        subject: JSON.parse(t.settings).subject || "Kinh tế vi mô",
        bio:
          JSON.parse(t.settings).bio ||
          "Giảng viên đồng hành cùng sinh viên trong học tập và nghiên cứu.",
        rating: await one(
          "SELECT round(avg(value),1) as avg,count(*) as n FROM ratings WHERE teacher_id=?",
          t.id,
        ),
        myRating:
          (await one(
            "SELECT value FROM ratings WHERE user_id=? AND teacher_id=?",
            user.id,
            t.id,
          ))?.value || 0,
      }),
    ))),
    games: gameModes,
    rewards: await q("SELECT * FROM rewards ORDER BY rowid"),
    redemptions: await q(
      "SELECT r.*,w.title,w.icon FROM redemptions r JOIN rewards w ON w.id=r.reward_id WHERE user_id=? ORDER BY created DESC",
      user.id,
    ),
    leaderboard: await q(
      "SELECT id,name,xp FROM users WHERE role='student' AND active=1 ORDER BY xp DESC LIMIT 10",
    ),
    progress: await q(
      "SELECT material_id,done FROM progress WHERE user_id=?",
      user.id,
    ),
    notifications: await q(
      "SELECT * FROM notifications WHERE user_id=? ORDER BY created DESC LIMIT 30",
      user.id,
    ),
    stats: {
      ...stats,
      activity,
      gameDays,
      ledger: await q(
        "SELECT amount,reason,created FROM ledger WHERE user_id=? ORDER BY created DESC LIMIT 20",
        user.id,
      ),
      attempts: await q(
        "SELECT mode,score,reward,finished FROM attempts WHERE user_id=? AND finished IS NOT NULL ORDER BY finished DESC LIMIT 20",
        user.id,
      ),
    },
    aiMode: ai.enabled ? "online" : "library",
    aiProvider: ai.enabled ? ai.provider : "library",
  };
}

async function api(req, res, path) {
  if (req.method === "GET" && path === "/api/health") {
    await one("SELECT 1 as ok");
    return json(res, 200, { ok: true });
  }
  const method = req.method,
    ip =
      (trustProxy &&
        String(req.headers["x-forwarded-for"] || "")
          .split(",")
          .pop()
          .trim()) ||
      req.socket.remoteAddress;
  rate("http:" + ip, 300, 60000);
  let sess = await session(req),
    user = sess?.user_id
      ? await one("SELECT * FROM users WHERE id=? AND active=1", sess.user_id)
      : null;
  if (method === "GET" && path === "/api/session") {
    if (!sess || (sess.user_id && !user)) {
      sess = await newSession(res, null, sess);
    }
    return json(res, 200, {
      user: user ? safeUser(user) : null,
      csrf: sess.csrf,
      googleClientId: googleClientId || null,
    });
  }
  if (method !== "GET") {
    check(allowedOrigins.has(req.headers.origin), 403, "Nguồn yêu cầu không được phép.");
    check(
      sess &&
        typeof req.headers["x-csrf-token"] === "string" &&
        req.headers["x-csrf-token"] === sess.csrf,
      403,
      "Phiên bảo mật không hợp lệ. Hãy tải lại trang.",
    );
  }
  if (method === "POST" && ["/api/login", "/api/register"].includes(path)) {
    rate("auth:" + ip, 10, 15 * 60000);
    const b = await body(req),
      email = emailField(b.email);
    rate("email:" + email, 10, 15 * 60000);
    if (path === "/api/register") {
      const name = textField(b.name, "Họ tên", 80, 2),
        password = validatePassword(b.password);
      check(
        !await one("SELECT id FROM users WHERE email=?", email),
        409,
        "Email này đã được sử dụng.",
      );
      const uid = await addUser(email, name, "student", password);
      const token = await newSession(res, uid, sess);
      await notify(uid, "Chào mừng bạn đến với Smart Student!");
      await audit(uid, "account.register", uid);
      return json(res, 201, {
        user: safeUser(await one("SELECT * FROM users WHERE id=?", uid)),
        ...token,
      });
    }
    const p = passwordInput(b.password),
      u = await one("SELECT * FROM users WHERE email=?", email),
      ok = await passwordOK(p, u?.password || dummyHash);
    check(ok && u?.active, 401, "Email hoặc mật khẩu không đúng.");
    const token = await newSession(res, u.id, sess);
    await audit(u.id, "account.login", u.id);
    return json(res, 200, { user: safeUser(u), ...token });
  }
  if (method === "POST" && path === "/api/google") {
    rate("auth:" + ip, 10, 15 * 60000);
    const b = await body(req),
      claims = await verifyGoogleToken(b.credential),
      email = emailField(claims.email);
    rate("email:" + email, 10, 15 * 60000);
    const isOwner = !!process.env.ADMIN_EMAIL && email === envAdminEmail;
    let u = await one("SELECT * FROM users WHERE email=?", email);
    if (!u) {
      const rawName = typeof claims.name === "string" ? claims.name.trim() : "";
      const name = (rawName.length >= 2 ? rawName : email.split("@")[0]).slice(0, 80);
      const uid = await addUser(
        email,
        name.length >= 2 ? name : "Sinh viên",
        isOwner ? "admin" : "student",
        randomBytes(24).toString("base64url"),
      );
      await notify(uid, "Chào mừng bạn đến với Smart Student!");
      await audit(uid, "account.google-register", uid);
      u = await one("SELECT * FROM users WHERE id=?", uid);
    } else {
      check(u.active, 401, "Tài khoản này đã bị khóa.");
      if (isOwner && u.role !== "admin") {
        await run("UPDATE users SET role='admin' WHERE id=?", u.id);
        u = await one("SELECT * FROM users WHERE id=?", u.id);
      }
      await audit(u.id, "account.google-login", u.id);
    }
    const token = await newSession(res, u.id, sess);
    return json(res, 200, { user: safeUser(u), ...token });
  }
  check(user, 401, "Vui lòng đăng nhập để tiếp tục.");
  if (method === "POST" && path === "/api/logout") {
    await run("DELETE FROM sessions WHERE token=?", sess.token);
    res.setHeader(
      "Set-Cookie",
      `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`,
    );
    return json(res, 200, { ok: true });
  }
  if (method === "GET" && path === "/api/bootstrap")
    return json(res, 200, await bootstrap(user));
  if (method === "POST" && path === "/api/profile") {
    const b = await body(req),
      name = textField(b.name, "Họ tên", 80, 2);
    const settings = {
      year: integer(Number(b.year || 2), 1, 6, "Năm học"),
      subject: textField(b.subject || "Kinh tế vi mô", "Môn học", 100),
      bio: textField(b.bio || "", "Giới thiệu", 1000, 0),
      notifications: b.notifications !== false,
    };
    await run(
      "UPDATE users SET name=?,settings=? WHERE id=?",
      name,
      JSON.stringify(settings),
      user.id,
    );
    return json(res, 200, { ok: true });
  }
  if (method === "POST" && path === "/api/password") {
    const b = await body(req);
    validatePassword(b.password);
    check(
      await passwordOK(passwordInput(b.current), user.password),
      400,
      "Mật khẩu hiện tại không đúng.",
    );
    await run(
      "UPDATE users SET password=? WHERE id=?",
      await passwordHash(b.password),
      user.id,
    );
    await run("DELETE FROM sessions WHERE user_id=?", user.id);
    const token = await newSession(res, user.id);
    await audit(user.id, "account.password", user.id);
    return json(res, 200, token);
  }
  if (method === "POST" && path === "/api/notifications/read") {
    await run("UPDATE notifications SET seen=1 WHERE user_id=?", user.id);
    return json(res, 200, { ok: true });
  }
  if (path === "/api/tasks" && method === "POST") {
    const b = await body(req);
    const tid = id();
    await run(
      "INSERT INTO tasks VALUES(?,?,?,?,?)",
      tid,
      user.id,
      textField(b.title, "Công việc"),
      0,
      now(),
    );
    return json(res, 201, { id: tid });
  }
  const taskMatch = path.match(/^\/api\/tasks\/([a-f0-9-]+)$/);
  if (taskMatch && ["PATCH", "DELETE"].includes(method)) {
    const t = await one(
      "SELECT * FROM tasks WHERE id=? AND user_id=?",
      taskMatch[1],
      user.id,
    );
    check(t, 404, "Không tìm thấy công việc.");
    if (method === "DELETE") await run("DELETE FROM tasks WHERE id=?", t.id);
    else {
      const b = await body(req);
      check(typeof b.done === "boolean", 400, "Trạng thái không hợp lệ.");
      await run(
        "UPDATE tasks SET done=?,title=? WHERE id=?",
        b.done ? 1 : 0,
        b.title === undefined ? t.title : textField(b.title, "Công việc"),
        t.id,
      );
    }
    return json(res, 200, { ok: true });
  }
  const scheduleEdit = path.match(/^\/api\/schedules\/([a-f0-9-]+)$/);
  if (
    (path === "/api/schedules" && method === "POST") ||
    (scheduleEdit && method === "PATCH")
  ) {
    const b = await body(req),
      title = textField(b.title, "Tiêu đề"),
      kind = enumField(b.kind, ["class", "exam", "deadline"], "Loại lịch");
    dateTimeField(b.start);
    dateTimeField(b.end);
    check(
      Date.parse(b.end) > Date.parse(b.start),
      400,
      "Thời gian kết thúc phải sau thời gian bắt đầu.",
    );
    const sid = scheduleEdit?.[1] || id(),
      location = textField(b.location || "", "Địa điểm", 100, 0);
    if (method === "PATCH") {
      check(
        await one("SELECT id FROM schedules WHERE id=? AND user_id=?", sid, user.id),
        404,
        "Không tìm thấy lịch.",
      );
      await run(
        "UPDATE schedules SET title=?,kind=?,start=?,end=?,location=? WHERE id=? AND user_id=?",
        title,
        kind,
        b.start,
        b.end,
        location,
        sid,
        user.id,
      );
    } else
      await run(
        "INSERT INTO schedules VALUES(?,?,?,?,?,?,?)",
        sid,
        user.id,
        title,
        kind,
        b.start,
        b.end,
        location,
      );
    return json(res, method === "POST" ? 201 : 200, { id: sid });
  }
  const scheduleMatch = path.match(/^\/api\/schedules\/([a-f0-9-]+)$/);
  if (scheduleMatch && method === "DELETE") {
    const r = await run(
      "DELETE FROM schedules WHERE id=? AND user_id=?",
      scheduleMatch[1],
      user.id,
    );
    check(r.changes, 404, "Không tìm thấy lịch.");
    return json(res, 200, { ok: true });
  }
  if (path === "/api/grades" && method === "POST") {
    const b = await body(req),
      subject = textField(b.subject, "Môn học", 100);
    check(
      Array.isArray(b.scores) &&
        b.scores.length === 3 &&
        Array.isArray(b.weights) &&
        b.weights.length === 3,
      400,
      "Cần đủ 3 điểm và 3 trọng số.",
    );
    check(
      b.scores.every(
        (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 10,
      ) &&
        b.weights.every(
          (v) =>
            typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100,
        ) &&
        Math.abs(b.weights.reduce((a, v) => a + v, 0) - 100) < 0.001,
      400,
      "Điểm từ 0–10 và tổng trọng số phải bằng 100%.",
    );
    const result =
      Math.round(
        b.scores.reduce((a, v, i) => a + (v * b.weights[i]) / 100, 0) * 100,
      ) / 100;
    await run(
      "INSERT INTO grades VALUES(?,?,?,?,?,?)",
      id(),
      user.id,
      subject,
      JSON.stringify({ scores: b.scores, weights: b.weights }),
      result,
      now(),
    );
    return json(res, 201, { result });
  }
  const gradeMatch = path.match(/^\/api\/grades\/([a-f0-9-]+)$/);
  if (gradeMatch && method === "DELETE") {
    check(
      (await run("DELETE FROM grades WHERE id=? AND user_id=?", gradeMatch[1], user.id))
        .changes,
      404,
      "Không tìm thấy kết quả.",
    );
    return json(res, 200, { ok: true });
  }
  const recordEdit = path.match(/^\/api\/records\/([a-f0-9-]+)$/);
  if (
    (method === "POST" && path === "/api/records") ||
    (method === "PATCH" && recordEdit)
  ) {
    const b = await body(req),
      existing = recordEdit
        ? await one("SELECT * FROM records WHERE id=?", recordEdit[1])
        : null;
    if (recordEdit) {
      check(existing, 404, "Không tìm thấy nội dung.");
      check(
        existing.owner === user.id || user.role === "admin",
        403,
        "Bạn chỉ có thể sửa nội dung do mình tạo.",
      );
    }
    const section =
      existing?.section ||
      enumField(b.section, ["materials", "events", "groups"], "Mục");
    if (section !== "groups") permissions(user, ["teacher", "admin"]);
    const payload = {
      title: textField(b.title, "Tiêu đề", 200),
      description: textField(b.description, "Mô tả", 1000),
      subject: textField(b.subject || "Tổng hợp", "Môn học", 100),
    };
    if (section === "materials") {
      Object.assign(payload, {
        type: enumField(
          b.type,
          ["lesson", "document", "exam"],
          "Loại tài liệu",
        ),
        body: textField(b.body, "Nội dung", 30000),
        duration: integer(Number(b.duration || 0), 0, 240, "Thời lượng"),
        published: b.published !== false,
        videoId: videoId(b.videoUrl),
      });
      check(
        !payload.videoId || payload.type === "lesson",
        400,
        "Video chỉ dành cho bài học.",
      );
    }
    if (section === "events") {
      dateTimeField(b.date);
      Object.assign(payload, {
        date: b.date,
        location: textField(b.location, "Địa điểm", 100),
        category: enumField(
          b.category,
          ["Học thuật", "Kỹ năng", "Tình nguyện", "Văn hóa"],
          "Danh mục",
        ),
        capacity: integer(Number(b.capacity), 1, 10000, "Sức chứa"),
        icon: "🎉",
      });
    }
    if (section === "groups")
      payload.icon = existing ? record(existing).icon : "📚";
    const rid = existing?.id || id();
    if (existing) {
      if (section === "events")
        check(
          payload.capacity >=
            (await one("SELECT count(*) as n FROM registrations WHERE event_id=?", rid))
              .n,
          400,
          "Sức chứa không được nhỏ hơn số người đã đăng ký.",
        );
      await run(
        "UPDATE records SET payload=? WHERE id=?",
        JSON.stringify(payload),
        rid,
      );
    } else {
      await run(
        "INSERT INTO records VALUES(?,?,?,?,?)",
        rid,
        section,
        user.id,
        JSON.stringify(payload),
        now(),
      );
      if (section === "groups")
        await run("INSERT INTO memberships VALUES(?,?)", user.id, rid);
    }
    await audit(user.id, section + (existing ? ".update" : ".create"), rid);
    return json(res, existing ? 200 : 201, { id: rid });
  }
  const recordMatch = path.match(/^\/api\/records\/([a-f0-9-]+)$/);
  if (recordMatch && method === "DELETE") {
    const r = await one("SELECT * FROM records WHERE id=?", recordMatch[1]);
    check(r, 404, "Không tìm thấy nội dung.");
    check(
      r.owner === user.id || user.role === "admin",
      403,
      "Bạn chỉ có thể xóa nội dung do mình tạo.",
    );
    if (r.section !== "groups") permissions(user, ["teacher", "admin"]);
    await run("DELETE FROM records WHERE id=?", r.id);
    await audit(user.id, r.section + ".delete", r.id);
    return json(res, 200, { ok: true });
  }
  const materialMatch = path.match(
    /^\/api\/materials\/([a-f0-9-]+)\/(complete|download)$/,
  );
  if (materialMatch) {
    const r = await one(
      "SELECT * FROM records WHERE id=? AND section='materials'",
      materialMatch[1],
    );
    check(r, 404, "Không tìm thấy tài liệu.");
    const m = record(r);
    check(
      m.published || m.owner === user.id || user.role === "admin",
      404,
      "Không tìm thấy tài liệu.",
    );
    if (materialMatch[2] === "complete" && method === "POST") {
      await run(
        "INSERT INTO progress VALUES(?,?,1) ON CONFLICT(user_id,material_id) DO UPDATE SET done=1",
        user.id,
        m.id,
      );
      return json(res, 200, { ok: true });
    }
    if (materialMatch[2] === "download" && method === "GET") {
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="smart-student-material.txt"`,
        "Cache-Control": "no-store",
      });
      return res.end("\uFEFF" + m.title + "\n\n" + m.body);
    }
  }
  const groupMatch = path.match(
    /^\/api\/groups\/([a-f0-9-]+)\/(membership|posts)$/,
  );
  if (groupMatch) {
    const gid = groupMatch[1],
      r = await one("SELECT * FROM records WHERE id=? AND section='groups'", gid);
    check(r, 404, "Không tìm thấy nhóm.");
    const joined = await one(
      "SELECT 1 FROM memberships WHERE user_id=? AND group_id=?",
      user.id,
      gid,
    );
    if (groupMatch[2] === "membership" && method === "POST") {
      const b = await body(req);
      check(typeof b.join === "boolean", 400, "Thao tác không hợp lệ.");
      if (b.join)
        await run("INSERT OR IGNORE INTO memberships VALUES(?,?)", user.id, gid);
      else {
        check(r.owner !== user.id, 400, "Chủ nhóm cần giữ tư cách thành viên.");
        await run(
          "DELETE FROM memberships WHERE user_id=? AND group_id=?",
          user.id,
          gid,
        );
      }
      return json(res, 200, { ok: true });
    }
    check(
      joined || user.role === "admin",
      403,
      "Hãy tham gia nhóm để đọc và gửi thảo luận.",
    );
    if (groupMatch[2] === "posts" && method === "GET")
      return json(res, 200, {
        posts: await q(
          "SELECT p.*,u.name FROM posts p JOIN users u ON u.id=p.user_id WHERE group_id=? ORDER BY created LIMIT 100",
          gid,
        ),
      });
    if (groupMatch[2] === "posts" && method === "POST") {
      const b = await body(req);
      await run(
        "INSERT INTO posts VALUES(?,?,?,?,?)",
        id(),
        gid,
        user.id,
        textField(b.body, "Nội dung", 2000),
        now(),
      );
      return json(res, 201, { ok: true });
    }
  }
  const postMatch = path.match(/^\/api\/posts\/([a-f0-9-]+)$/);
  if (postMatch && method === "DELETE") {
    const p = await one("SELECT * FROM posts WHERE id=?", postMatch[1]);
    check(p, 404, "Không tìm thấy bài viết.");
    check(
      p.user_id === user.id || user.role === "admin",
      403,
      "Không có quyền xóa bài viết này.",
    );
    await run("DELETE FROM posts WHERE id=?", p.id);
    await audit(user.id, "post.delete", p.id);
    return json(res, 200, { ok: true });
  }
  const eventMatch = path.match(/^\/api\/events\/([a-f0-9-]+)\/registration$/);
  if (eventMatch && method === "POST") {
    const b = await body(req);
    check(typeof b.register === "boolean", 400, "Thao tác không hợp lệ.");
    const r = await one(
      "SELECT * FROM records WHERE id=? AND section='events'",
      eventMatch[1],
    );
    check(r, 404, "Không tìm thấy sự kiện.");
    const e = record(r);
    await transaction(async () => {
      if (b.register) {
        check(
          Date.parse(e.date + "+07:00") > now(),
          400,
          "Sự kiện đã bắt đầu.",
        );
        const existing = await one(
          "SELECT 1 FROM registrations WHERE user_id=? AND event_id=?",
          user.id,
          e.id,
        );
        check(
          existing ||
            (await one(
              "SELECT count(*) as n FROM registrations WHERE event_id=?",
              e.id,
            )).n < e.capacity,
          409,
          "Sự kiện đã đủ người đăng ký.",
        );
        await run("INSERT OR IGNORE INTO registrations VALUES(?,?)", user.id, e.id);
      } else
        await run(
          "DELETE FROM registrations WHERE user_id=? AND event_id=?",
          user.id,
          e.id,
        );
    });
    return json(res, 200, { ok: true });
  }
  const ratingMatch = path.match(/^\/api\/teachers\/([a-f0-9-]+)\/rating$/);
  if (ratingMatch && method === "POST") {
    permissions(user, ["student"]);
    const b = await body(req);
    check(
      await one(
        "SELECT id FROM users WHERE id=? AND role='teacher' AND active=1",
        ratingMatch[1],
      ),
      404,
      "Không tìm thấy giảng viên.",
    );
    await run(
      "INSERT INTO ratings VALUES(?,?,?) ON CONFLICT(user_id,teacher_id) DO UPDATE SET value=excluded.value",
      user.id,
      ratingMatch[1],
      integer(b.value, 1, 5, "Đánh giá"),
    );
    return json(res, 200, { ok: true });
  }
  if (path === "/api/games/start" && method === "POST") {
    const b = await body(req),
      mode = enumField(
        b.mode,
        gameModes.map((g) => g.id),
        "Trò chơi",
      ),
      subject = b.subject
        ? enumField(
            b.subject,
            ["Kinh tế vi mô", "Marketing căn bản", "Quản trị học", "Tiếng Anh"],
            "Môn học",
          )
        : null;
    rate("game:" + user.id, 30, 3600000);
    check(
      (await one(
        "SELECT count(*) as n FROM attempts WHERE user_id=? AND finished IS NULL AND started>?",
        user.id,
        now() - 30 * 60000,
      )).n < 4,
      409,
      "Bạn đang có nhiều lượt chơi. Hãy hoàn thành một lượt trước.",
    );
    const pool = questionBank
      .map((x, index) => ({
        index,
        sort:
          mode === "daily"
            ? Number.parseInt(hash(day() + ":" + index).slice(0, 8), 16)
            : randomBytes(4).readUInt32BE(),
      }))
      .filter((x) => !subject || questionBank[x.index][0] === subject)
      .sort((a, b) => a.sort - b.sort)
      .slice(0, 5)
      .map((x) => {
        const original = questionBank[x.index];
        const options = original[2]
          .map((text, index) => ({
            text,
            index,
            sort: randomBytes(4).readUInt32BE(),
          }))
          .sort((a, b) => a.sort - b.sort);
        return {
          bank: x.index,
          options: options.map((o) => o.text),
          answer: options.findIndex((o) => o.index === original[3]),
        };
      });
    const aid = id();
    await run(
      "INSERT INTO attempts(id,user_id,mode,questions,started) VALUES(?,?,?,?,?)",
      aid,
      user.id,
      mode,
      JSON.stringify(pool),
      now(),
    );
    const crosswordClues = {
      CUNG: "Lượng hàng hóa người bán sẵn lòng và có khả năng bán.",
      "CAN BANG": "Trạng thái thị trường khi lượng cung bằng lượng cầu.",
      GIA: "Giá trị bằng tiền của một hàng hóa.",
      "DU CUNG": "Tình trạng lượng hàng bán ra lớn hơn lượng người mua cần.",
      CAU: "Lượng hàng hóa người tiêu dùng sẵn lòng và có khả năng mua.",
      "CHI PHI": "Khoản tiền phải bỏ ra để sản xuất hàng hóa.",
      MARKETING:
        "Hoạt động tạo ra, truyền đạt và trao đổi giá trị cho khách hàng.",
      "PHAN KHUC":
        "Chia thị trường thành các nhóm khách hàng có đặc điểm tương đồng.",
      "DINH VI": "Xác lập vị trí khác biệt trong tâm trí khách hàng.",
      PLACE: "Thành phần phân phối trong 4P (tiếng Anh).",
      TARGET: "Từ tiếng Anh chỉ mục tiêu.",
      "KE HOACH": "Chức năng xác định mục tiêu và hành động trong quản trị.",
      SMART: "Tên viết tắt của bộ tiêu chí đặt mục tiêu hiệu quả.",
      "KIEM SOAT":
        "Chức năng đo kết quả và điều chỉnh sai lệch trong quản trị.",
      "TO CHUC": "Chức năng phân bổ con người và nguồn lực.",
      "THOI HAN": "Mốc cần hoàn thành một công việc.",
      DEADLINE: "Hạn chót (tiếng Anh).",
      SCHOLARSHIP: "Học bổng (tiếng Anh).",
      ASSIGNMENT: "Bài tập được giao (tiếng Anh).",
      SEMESTER: "Học kỳ (tiếng Anh).",
      LECTURE: "Bài giảng (tiếng Anh).",
    };
    return json(res, 201, {
      id: aid,
      mode,
      started: now(),
      limit: mode === "speed" ? 90000 : mode === "race" ? 180000 : 1800000,
      questions: pool.map((x, i) => ({
        id: i,
        subject: questionBank[x.bank][0],
        prompt:
          mode === "crossword"
            ? crosswordClues[questionBank[x.bank][5]]
            : questionBank[x.bank][1],
        options: x.options,
        hint:
          mode === "crossword"
            ? questionBank[x.bank][5].replace(/ /g, "").length
            : undefined,
        card: mode === "flashcard" ? questionBank[x.bank][4] : undefined,
      })),
    });
  }
  if (path === "/api/games/abandon" && method === "POST") {
    const b = await body(req);
    check(typeof b.id === "string", 400, "Lượt chơi không hợp lệ.");
    await run(
      "UPDATE attempts SET finished=?,score=0 WHERE id=? AND user_id=? AND finished IS NULL",
      now(),
      b.id,
      user.id,
    );
    return json(res, 200, { ok: true });
  }
  if (path === "/api/games/submit" && method === "POST") {
    const b = await body(req);
    check(typeof b.id === "string", 400, "Lượt chơi không hợp lệ.");
    const a = await one(
      "SELECT * FROM attempts WHERE id=? AND user_id=?",
      b.id,
      user.id,
    );
    check(a, 404, "Không tìm thấy lượt chơi.");
    check(!a.finished, 409, "Lượt chơi đã được chấm.");
    check(
      now() - a.started >= 1500,
      400,
      "Hãy dành thời gian trả lời câu hỏi.",
    );
    const items = JSON.parse(a.questions);
    check(
      Array.isArray(b.answers) && b.answers.length === items.length,
      400,
      "Cần trả lời đủ câu hỏi.",
    );
    check(
      b.answers.every((x) =>
        a.mode === "crossword"
          ? typeof x === "string" && x.length <= 100
          : Number.isInteger(x) && x >= -1 && x < 4,
      ),
      400,
      "Đáp án không hợp lệ.",
    );
    const limit =
      a.mode === "speed" ? 90000 : a.mode === "race" ? 180000 : 1800000;
    const expired = now() - a.started > limit + 5000;
    const results = items.map((x, i) => {
      const original = questionBank[x.bank];
      return {
        correct:
          !expired &&
          (a.mode === "crossword"
            ? normalize(b.answers[i]) === normalize(original[5])
            : b.answers[i] === x.answer),
        answer: a.mode === "crossword" ? original[5] : x.options[x.answer],
        explanation: original[4],
      };
    });
    const score = results.filter((x) => x.correct).length;
    const reward = await transaction(async () => {
      check(
        !(await one("SELECT finished FROM attempts WHERE id=?", a.id)).finished,
        409,
        "Lượt chơi đã được chấm.",
      );
      let amount = 0;
      if (
        score > 0 &&
        !await one(
          "SELECT 1 FROM game_rewards WHERE user_id=? AND mode=? AND day=?",
          user.id,
          a.mode,
          day(),
        )
      ) {
        amount = score * 10;
        await run("INSERT INTO game_rewards VALUES(?,?,?)", user.id, a.mode, day());
        await run(
          "UPDATE users SET coins=coins+?,xp=xp+? WHERE id=?",
          amount,
          score * 20,
          user.id,
        );
        await run(
          "INSERT INTO ledger VALUES(?,?,?,?,?)",
          id(),
          user.id,
          amount,
          "Hoàn thành " + gameModes.find((g) => g.id === a.mode).name,
          now(),
        );
        await notify(user.id, `Bạn vừa nhận ${amount} xu từ trò chơi!`);
      }
      await run(
        "UPDATE attempts SET finished=?,score=?,reward=? WHERE id=?",
        now(),
        score,
        amount,
        a.id,
      );
      return amount;
    });
    return json(res, 200, {
      score,
      total: items.length,
      reward,
      expired,
      results,
      user: safeUser(await one("SELECT * FROM users WHERE id=?", user.id)),
    });
  }
  if (path === "/api/redeem" && method === "POST") {
    const b = await body(req);
    check(typeof b.rewardId === "string", 400, "Quà không hợp lệ.");
    const receipt = await transaction(async () => {
      const r = await one("SELECT * FROM rewards WHERE id=?", b.rewardId);
      check(r, 404, "Không tìm thấy quà.");
      check(r.stock > 0, 409, "Quà đã hết.");
      const change = await run(
        "UPDATE users SET coins=coins-? WHERE id=? AND coins>=?",
        r.cost,
        user.id,
        r.cost,
      );
      check(change.changes, 400, "Bạn chưa đủ xu để đổi món quà này.");
      await run("UPDATE rewards SET stock=stock-1 WHERE id=?", r.id);
      const rid = id();
      await run(
        "INSERT INTO redemptions(id,user_id,reward_id,cost,created) VALUES(?,?,?,?,?)",
        rid,
        user.id,
        r.id,
        r.cost,
        now(),
      );
      await run(
        "INSERT INTO ledger VALUES(?,?,?,?,?)",
        id(),
        user.id,
        -r.cost,
        "Đổi " + r.title,
        now(),
      );
      await notify(
        user.id,
        "Đã tạo yêu cầu đổi " + r.title + ". Theo dõi trong lịch sử đổi quà.",
      );
      await audit(user.id, "reward.redeem", rid);
      return { id: rid, title: r.title };
    });
    return json(res, 201, receipt);
  }
  if (path === "/api/activity" && method === "POST") {
    const b = await body(req);
    integer(b.seconds, 1, 120, "Thời gian");
    rate("activity:" + user.id, 2, 60000);
    await run(
      "INSERT INTO activity VALUES(?,?,?) ON CONFLICT(user_id,day) DO UPDATE SET seconds=seconds+excluded.seconds",
      user.id,
      day(),
      b.seconds,
    );
    return json(res, 200, { ok: true });
  }
  if (path === "/api/assistant" && method === "POST") {
    rate("ai:" + user.id, 20, 3600000);
    const b = await body(req),
      message = textField(b.message, "Câu hỏi", 2000),
      mode = enumField(
        b.mode || "summary",
        ["summary", "solve", "plan", "analysis"],
        "Chế độ",
      );
    const corpus = (await records("materials", user)).filter((m) => m.published);
    const terms = message
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);
    const ranked = corpus
      .map((m) => ({
        m,
        n: terms.filter((t) =>
          (m.title + " " + m.body).toLowerCase().includes(t),
        ).length,
      }))
      .sort((a, b) => b.n - a.n);
    const sources = ranked
      .filter((r) => r.n > 0)
      .slice(0, 2)
      .map((r) => r.m);
    let answer;
    if (mode === "plan") {
      const tasks = await q(
        "SELECT title FROM tasks WHERE user_id=? AND done=0 LIMIT 5",
        user.id,
      );
      answer =
        "Kế hoạch học tập gợi ý cho hôm nay:\n\n1. Dành 25 phút ôn kiến thức nền tảng của môn bạn chọn.\n2. Nghỉ 5 phút và ghi lại phần còn chưa hiểu.\n3. Làm 5 câu Quiz để tự kiểm tra.\n4. Dành 25 phút xử lý công việc ưu tiên" +
        (tasks.length ? ": " + tasks.map((t) => t.title).join("; ") : ".") +
        "\n5. Cuối ngày, đánh dấu công việc hoàn thành và điều chỉnh lịch ngày mai.";
    } else if (mode === "analysis") {
      const s = await one(
          "SELECT count(*) as total,COALESCE(sum(done),0) as done FROM tasks WHERE user_id=?",
          user.id,
        ),
        g = await one(
          "SELECT avg(result) as avg FROM grades WHERE user_id=?",
          user.id,
        );
      answer = `Bạn đã hoàn thành ${s.done}/${s.total} công việc. ${g.avg !== null ? "Điểm trung bình các kết quả đã lưu: " + g.avg.toFixed(2) + "." : "Hãy lưu điểm môn học để có thêm dữ liệu theo dõi."}\n\nGợi ý: chọn một công việc chưa hoàn thành, chia thành các phiên 25 phút, sau đó tự kiểm tra bằng quiz. Thống kê này dựa trên dữ liệu bạn đã nhập, chưa phải đánh giá toàn diện năng lực.`;
    } else if (sources.length) {
      answer =
        (mode === "summary"
          ? "Tóm tắt từ thư viện học tập:\n\n"
          : "Kiến thức liên quan để giải bài:\n\n") +
        sources
          .map(
            (m) =>
              m.title +
              "\n" +
              m.body
                .split("\n\n")
                .slice(0, mode === "summary" ? 2 : 4)
                .join("\n\n"),
          )
          .join("\n\n——\n\n");
    } else
      answer =
        "Mình chưa tìm thấy nội dung phù hợp trong thư viện. Bạn có thể hỏi về cung – cầu, cân bằng thị trường, marketing 4P, STP, mục tiêu SMART hoặc từ vựng đại học. Chọn “Lập kế hoạch” để nhận gợi ý dựa trên công việc của bạn.";
    let engine = "library", aiError = null;
    if (ai.enabled) {
      const context = sources.map((m) => m.title + "\n" + m.body).join("\n\n");
      try {
        const output = await generateAnswer({ message, mode, context });
        answer = output.answer;
        engine = "online";
      } catch (error) {
        engine = "library-fallback";
        aiError = error.code || "unavailable";
        console.warn("AI provider unavailable:", ai.provider, aiError);
      }
    }
    return json(res, 200, {
      answer,
      engine,
      provider: ai.enabled ? ai.provider : null,
      aiError,
      sources: sources.map((m) => ({ id: m.id, title: m.title })),
    });
  }
  if (path.startsWith("/api/admin")) {
    permissions(user, ["admin"]);
    if (path === "/api/admin/rewards" && method === "POST") {
      const b = await body(req),
        title = textField(b.title, "Tên quà", 100),
        emoji = textField(b.icon, "Biểu tượng", 8),
        cost = integer(Number(b.cost), 1, 100000, "Giá xu"),
        stock = integer(Number(b.stock), 0, 100000, "Tồn kho"),
        category = enumField(b.category, ["souvenir", "study"], "Danh mục");
      if (b.id) {
        check(
          typeof b.id === "string" &&
            await one("SELECT id FROM rewards WHERE id=?", b.id),
          404,
          "Không tìm thấy quà.",
        );
        await run(
          "UPDATE rewards SET title=?,icon=?,cost=?,category=?,stock=? WHERE id=?",
          title,
          emoji,
          cost,
          category,
          stock,
          b.id,
        );
      } else
        await run(
          "INSERT INTO rewards VALUES(?,?,?,?,?,?)",
          id(),
          title,
          emoji,
          cost,
          category,
          stock,
        );
      await audit(user.id, "reward.manage", b.id || title);
      return json(res, 200, { ok: true });
    }
    if (path === "/api/admin" && method === "GET")
      return json(res, 200, {
        users: (await q("SELECT * FROM users ORDER BY created")).map(safeUser),
        audit: await q(
          "SELECT a.*,u.name FROM audit a LEFT JOIN users u ON u.id=a.actor ORDER BY a.created DESC LIMIT 100",
        ),
        redemptions: await q(
          "SELECT r.*,u.name,w.title FROM redemptions r JOIN users u ON u.id=r.user_id JOIN rewards w ON w.id=r.reward_id ORDER BY created DESC",
        ),
        counts: {
          users: (await one("SELECT count(*) as n FROM users")).n,
          materials: (await one(
            "SELECT count(*) as n FROM records WHERE section='materials'",
          )).n,
          plays: (await one(
            "SELECT count(*) as n FROM attempts WHERE finished IS NOT NULL",
          )).n,
        },
      });
    const userMatch = path.match(/^\/api\/admin\/users\/([a-f0-9-]+)$/);
    if (userMatch && method === "PATCH") {
      const b = await body(req),
        target = await one("SELECT * FROM users WHERE id=?", userMatch[1]);
      check(target, 404, "Không tìm thấy tài khoản.");
      check(
        target.id !== user.id,
        400,
        "Không thể đổi quyền hoặc khóa chính tài khoản đang dùng.",
      );
      const role = enumField(
        b.role,
        ["student", "teacher", "admin"],
        "Vai trò",
      );
      check(typeof b.active === "boolean", 400, "Trạng thái không hợp lệ.");
      await transaction(async () => {
        if (target.role === "admin" && (role !== "admin" || !b.active))
          check(
            (await one(
              "SELECT count(*) as n FROM users WHERE role='admin' AND active=1",
            )).n > 1,
            400,
            "Phải giữ ít nhất một quản trị viên hoạt động.",
          );
        await run(
          "UPDATE users SET role=?,active=? WHERE id=?",
          role,
          b.active ? 1 : 0,
          target.id,
        );
        await run("DELETE FROM sessions WHERE user_id=?", target.id);
        await audit(user.id, "user.permission", target.id);
      });
      return json(res, 200, { ok: true });
    }
    const redemptionMatch = path.match(
      /^\/api\/admin\/redemptions\/([a-f0-9-]+)$/,
    );
    if (redemptionMatch && method === "PATCH") {
      const b = await body(req),
        status = enumField(b.status, ["completed", "cancelled"], "Trạng thái");
      await transaction(async () => {
        const r = await one(
          "SELECT * FROM redemptions WHERE id=?",
          redemptionMatch[1],
        );
        check(r && r.status === "pending", 409, "Yêu cầu không còn chờ xử lý.");
        await run("UPDATE redemptions SET status=? WHERE id=?", status, r.id);
        if (status === "cancelled") {
          await run("UPDATE users SET coins=coins+? WHERE id=?", r.cost, r.user_id);
          await run("UPDATE rewards SET stock=stock+1 WHERE id=?", r.reward_id);
          await run(
            "INSERT INTO ledger VALUES(?,?,?,?,?)",
            id(),
            r.user_id,
            r.cost,
            "Hoàn xu yêu cầu đổi quà bị hủy",
            now(),
          );
        }
        await notify(
          r.user_id,
          status === "completed"
            ? "Quà đã được xác nhận trao."
            : "Yêu cầu đổi quà đã hủy và hoàn xu.",
        );
        await audit(user.id, "redemption." + status, r.id);
      });
      return json(res, 200, { ok: true });
    }
    if (path === "/api/admin/announcement" && method === "POST") {
      const b = await body(req);
      const title = textField(b.title, "Thông báo", 300);
      await notifyAll(title);
      await audit(user.id, "announcement.create");
      return json(res, 201, { ok: true });
    }
  }
  throw problem(404, "Không tìm thấy chức năng.");
}

const publicRoot = resolve(root, "public"),
  mime = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".woff2": "font/woff2",
  };
const gzipCache = new Map();
function gzipped(file, raw) {
  const mtime = statSync(file).mtimeMs;
  const hit = gzipCache.get(file);
  if (hit && hit.mtime === mtime) return hit.body;
  const body = gzipSync(raw);
  gzipCache.set(file, { mtime, body });
  return body;
}
const server = http.createServer(async (req, res) => {
  headers(res);
  try {
    check(
      allowedHosts.has(req.headers.host) ||
        req.headers.host === `${host}:${port}`,
      400,
      "Host không hợp lệ.",
    );
    const url = new URL(req.url, origin);
    if (url.pathname.startsWith("/api/"))
      return await api(req, res, url.pathname);
    check(
      ["GET", "HEAD"].includes(req.method),
      405,
      "Phương thức không được phép.",
    );
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      throw problem(400, "Đường dẫn không hợp lệ.");
    }
    check(
      !pathname.includes("\0") && !pathname.includes("\\"),
      400,
      "Đường dẫn không hợp lệ.",
    );
    let target = resolve(
      publicRoot,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    check(target.startsWith(publicRoot + sep), 403, "Không được truy cập.");
    if (!existsSync(target) && !extname(pathname))
      target = resolve(publicRoot, "index.html");
    check(
      existsSync(target) && statSync(target).isFile() && mime[extname(target)],
      404,
      "Không tìm thấy tệp.",
    );
    const ext = extname(target);
    // Versioned third-party files (three.js, fonts) never change in place.
    const immutable = /^\/(vendor|fonts)\//.test(pathname);
    const compress =
      [".js", ".css", ".svg", ".html"].includes(ext) &&
      /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    const responseHeaders = {
      "Content-Type": mime[ext],
      "Cache-Control": immutable
        ? "public, max-age=31536000, immutable"
        : [".html", ".js", ".css"].includes(ext)
          ? "no-store"
          : "public, max-age=3600",
      Vary: "Accept-Encoding",
    };
    let payload = readFileSync(target);
    if (compress) {
      payload = gzipped(target, payload);
      responseHeaders["Content-Encoding"] = "gzip";
    }
    res.writeHead(200, responseHeaders);
    res.end(req.method === "HEAD" ? undefined : payload);
  } catch (e) {
    if (!e.status) console.error("Server error:", e.message);
    if (!res.headersSent)
      json(res, e.status || 500, {
        error: e.status ? e.message : "Có lỗi máy chủ. Vui lòng thử lại.",
      });
    else res.end();
  }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.keepAliveTimeout = 5000;
server.maxHeadersCount = 32;
server.listen(port, host, () =>
  console.log(
    `Smart Student chạy tại ${origin} (database: ${db.kind === "turso" ? "Turso, dữ liệu bền vững" : "SQLite cục bộ " + dataDir})`,
  ),
);
process.on("SIGTERM", () =>
  server.close(() => {
    db.close();
    process.exit(0);
  }),
);
process.on("SIGINT", () =>
  server.close(() => {
    db.close();
    process.exit(0);
  }),
);
