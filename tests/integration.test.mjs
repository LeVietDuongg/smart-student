import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { request as httpRequest } from "node:http";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { setTimeout as delay } from "node:timers/promises";
import { questionBank } from "../seed.mjs";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = resolve(
  process.env.TEST_WORK_DIR || resolve(project, "../..", "work"),
);
mkdirSync(scratch, { recursive: true });
const dataDir = mkdtempSync(resolve(scratch, "smart-student-test-"));
const port = 38000 + Math.floor(Math.random() * 1000),
  origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["server.mjs"], {
  cwd: project,
  env: {
    ...process.env,
    PORT: String(port),
    HOST: "127.0.0.1",
    APP_ORIGIN: origin,
    DATA_DIR: dataDir,
    SEED_DEMO: "1",
    NODE_ENV: "test",
    COOKIE_SECURE: "0",
    OPENAI_API_KEY: "",
    AI_PROVIDER: "library",
    ADDITIONAL_ORIGINS: "https://smart-test.vercel.app",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
server.stdout.on("data", (x) => (logs += x));
server.stderr.on("data", (x) => (logs += x));
class Client {
  cookie = "";
  csrf = "";
  user = null;
  async request(path, method = "GET", body, headers = {}) {
    const res = await fetch(origin + path, {
      method,
      headers: {
        Cookie: this.cookie,
        ...(method === "GET"
          ? {}
          : {
              Origin: origin,
              "Content-Type": "application/json",
              "X-CSRF-Token": this.csrf,
            }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) this.cookie = setCookie.split(";")[0];
    const text = await res.text();
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      value = text;
    }
    if (value?.csrf) this.csrf = value.csrf;
    if (value?.user) this.user = value.user;
    return { status: res.status, data: value, headers: res.headers };
  }
  async login(credential) {
    await this.request("/api/session");
    const r = await this.request("/api/login", "POST", credential);
    assert.equal(r.status, 200, JSON.stringify(r.data));
    return r;
  }
  async bootstrap() {
    const r = await this.request("/api/bootstrap");
    assert.equal(r.status, 200);
    return r.data;
  }
}
await test("Smart Student: chức năng và bảo mật đầu cuối", async (t) => {
  let inspect;
  try {
    for (let i = 0; i < 80 && !logs.includes("chạy tại"); i++) await delay(100);
    assert.match(logs, /chạy tại/, "Máy chủ không khởi động: " + logs);
    const creds = JSON.parse(
      readFileSync(resolve(dataDir, "initial-credentials.json"), "utf8"),
    );
    const student = new Client(),
      teacher = new Client(),
      admin = new Client(),
      guest = new Client(),
      second = new Client();
    await student.login(creds.find((c) => c.role === "student"));
    await teacher.login(creds.find((c) => c.role === "teacher"));
    await admin.login(creds.find((c) => c.role === "admin"));
    inspect = new DatabaseSync(resolve(dataDir, "smart-student.sqlite"));
    let first = await student.bootstrap(),
      taskId,
      groupId,
      recordId,
      redemptionId;
    await t.test("Health check không tạo phiên; Origin Vercel đúng được nhận, tên miền khác bị chặn", async () => {
      const health = await guest.request('/api/health');
      assert.equal(health.status, 200);
      assert.deepEqual(health.data, { ok: true });
      assert.equal(health.headers.get('set-cookie'), null);
      const accepted = await student.request('/api/activity', 'POST', { seconds: 60 }, { Origin: 'https://smart-test.vercel.app' });
      assert.equal(accepted.status, 200);
      const rejected = await student.request('/api/activity', 'POST', { seconds: 60 }, { Origin: 'https://other.vercel.app' });
      assert.equal(rejected.status, 403);
    });
    await t.test("Ẩn dữ liệu riêng khi chưa đăng nhập", async () => {
      assert.equal((await guest.request("/api/bootstrap")).status, 401);
      assert.equal((await guest.request("/api/admin")).status, 401);
    });
    await t.test(
      "Cookie HttpOnly và SameSite; mã phiên quay vòng khi đăng nhập",
      async () => {
        const c = new Client(),
          before = await c.request("/api/session"),
          old = c.cookie;
        const res = await c.request(
          "/api/login",
          "POST",
          creds.find((c) => c.role === "student"),
        );
        assert.notEqual(c.cookie, old);
        assert.notEqual(c.csrf, before.data.csrf);
        assert.match(res.headers.get("set-cookie"), /HttpOnly/);
        assert.match(res.headers.get("set-cookie"), /SameSite=Strict/);
        const stale = new Client();
        stale.cookie = old;
        assert.equal((await stale.request("/api/bootstrap")).status, 401);
      },
    );
    await t.test(
      "Mật khẩu có salt + scrypt; chỉ lưu băm token phiên",
      async () => {
        const rows = inspect.prepare("SELECT password FROM users").all();
        for (const r of rows) {
          assert.match(r.password, /^[a-f0-9]{32}:[a-f0-9]{128}$/);
          assert.ok(!creds.some((c) => r.password.includes(c.password)));
        }
        const sessions = inspect.prepare("SELECT token FROM sessions").all();
        assert.ok(sessions.every((s) => /^[a-f0-9]{64}$/.test(s.token)));
      },
    );
    await t.test("Có CSP, chống nhúng trang và nosniff", async () => {
      const r = await guest.request("/");
      assert.match(
        r.headers.get("content-security-policy"),
        /script-src 'self'/,
      );
      assert.match(
        r.headers.get("content-security-policy"),
        /frame-ancestors 'none'/,
      );
      assert.equal(r.headers.get("x-content-type-options"), "nosniff");
      assert.equal(r.headers.get("x-frame-options"), "DENY");
    });
    await t.test(
      "Chặn CSRF thiếu token, sai token và Origin ngoài",
      async () => {
        for (const h of [
          { "X-CSRF-Token": "" },
          { "X-CSRF-Token": "bad" },
          { Origin: "https://evil.example" },
        ])
          assert.equal(
            (await student.request("/api/tasks", "POST", { title: "CSRF" }, h))
              .status,
            403,
          );
      },
    );
    await t.test("Chặn payload quá lớn và Content-Type khác JSON", async () => {
      assert.equal(
        (
          await student.request("/api/tasks", "POST", {
            title: "x".repeat(70000),
          })
        ).status,
        413,
      );
      assert.equal(
        (
          await student.request(
            "/api/tasks",
            "POST",
            { title: "x" },
            { "Content-Type": "text/plain" },
          )
        ).status,
        415,
      );
    });
    await t.test(
      "Đăng ký luôn là sinh viên, bỏ qua role/coins gửi từ client",
      async () => {
        await second.request("/api/session");
        const r = await second.request("/api/register", "POST", {
          email: "second@example.com",
          name: "Sinh viên thứ hai",
          password: "MatKhauKiemThu!2026",
          role: "admin",
          coins: 999999,
        });
        assert.equal(r.status, 201);
        assert.equal(r.data.user.role, "student");
        assert.equal(r.data.user.coins, 0);
      },
    );
    await t.test(
      "Sinh viên không được đọc quản trị hoặc tạo học liệu",
      async () => {
        assert.equal((await student.request("/api/admin")).status, 403);
        assert.equal(
          (
            await student.request("/api/records", "POST", {
              section: "materials",
              title: "bad",
              description: "bad",
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await student.request("/api/admin/announcement", "POST", {
              title: "bad",
            })
          ).status,
          403,
        );
      },
    );
    await t.test("Thêm/sửa/hoàn thành công việc lưu thật", async () => {
      const r = await student.request("/api/tasks", "POST", {
        title: "Ôn tập kiểm thử",
      });
      assert.equal(r.status, 201);
      taskId = r.data.id;
      assert.equal(
        (
          await student.request("/api/tasks/" + taskId, "PATCH", {
            done: true,
            title: "Ôn tập đã cập nhật",
          })
        ).status,
        200,
      );
      assert.ok(
        (await student.bootstrap()).tasks.some(
          (t) => t.id === taskId && t.done && t.title === "Ôn tập đã cập nhật",
        ),
      );
    });
    await t.test(
      "Chặn IDOR giữa sinh viên; quản trị cũng không đọc dữ liệu học riêng",
      async () => {
        assert.equal(
          (
            await second.request("/api/tasks/" + taskId, "PATCH", {
              done: false,
            })
          ).status,
          404,
        );
        assert.equal(
          (await second.request("/api/tasks/" + taskId, "DELETE")).status,
          404,
        );
        const other = await second.bootstrap();
        assert.ok(!other.tasks.some((t) => t.id === taskId));
        assert.ok(
          !(await admin.bootstrap()).tasks.some((t) => t.id === taskId),
        );
      },
    );
    await t.test("Tính điểm đúng và từ chối trọng số/điểm sai", async () => {
      const good = await student.request("/api/grades", "POST", {
        subject: "Kinh tế vi mô",
        scores: [8.5, 7, 9],
        weights: [30, 30, 40],
      });
      assert.equal(good.status, 201);
      assert.equal(good.data.result, 8.25);
      assert.equal(
        (
          await student.request("/api/grades", "POST", {
            subject: "x",
            scores: [8, 7, 9],
            weights: [30, 30, 30],
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await student.request("/api/grades", "POST", {
            subject: "x",
            scores: [11, 7, 9],
            weights: [30, 30, 40],
          })
        ).status,
        400,
      );
    });
    await t.test(
      "Lịch học thêm/sửa/xóa, chặn thời gian ngược và IDOR",
      async () => {
        const payload = {
          title: "Lịch kiểm thử",
          kind: "class",
          start: "2026-10-12T09:00",
          end: "2026-10-12T10:30",
          location: "P.101",
        };
        const r = await student.request("/api/schedules", "POST", payload);
        assert.equal(r.status, 201);
        assert.equal(
          (
            await student.request("/api/schedules/" + r.data.id, "PATCH", {
              ...payload,
              title: "Lịch đã sửa",
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await second.request(
              "/api/schedules/" + r.data.id,
              "PATCH",
              payload,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await student.request("/api/schedules", "POST", {
              ...payload,
              end: payload.start,
            })
          ).status,
          400,
        );
        assert.equal(
          (await student.request("/api/schedules/" + r.data.id, "DELETE"))
            .status,
          200,
        );
      },
    );
    await t.test(
      "Giảng viên thêm/sửa nội dung; bản nháp không lộ cho sinh viên",
      async () => {
        const payload = {
          section: "materials",
          title: "Nội dung thử",
          subject: "Quản trị học",
          description: "Tài liệu kiểm thử",
          type: "document",
          body: "Nội dung cần bảo vệ",
          published: false,
        };
        const r = await teacher.request("/api/records", "POST", payload);
        assert.equal(r.status, 201);
        recordId = r.data.id;
        assert.ok(
          (await teacher.bootstrap()).materials.some((m) => m.id === recordId),
        );
        assert.ok(
          !(await student.bootstrap()).materials.some((m) => m.id === recordId),
        );
        assert.equal(
          (await student.request("/api/materials/" + recordId + "/download"))
            .status,
          404,
        );
        assert.equal(
          (await second.request("/api/records/" + recordId, "PATCH", payload))
            .status,
          403,
        );
        assert.equal(
          (
            await teacher.request("/api/records/" + recordId, "PATCH", {
              ...payload,
              published: true,
            })
          ).status,
          200,
        );
        assert.ok(
          (await student.bootstrap()).materials.some((m) => m.id === recordId),
        );
      },
    );
    await t.test("Đọc/tải tài liệu và lưu tiến độ", async () => {
      const r = await student.request(
        "/api/materials/" + recordId + "/download",
      );
      assert.equal(r.status, 200);
      assert.match(r.data, /Nội dung cần bảo vệ/);
      assert.match(r.headers.get("content-disposition"), /attachment/);
      assert.equal(
        (
          await student.request(
            "/api/materials/" + recordId + "/complete",
            "POST",
            {},
          )
        ).status,
        200,
      );
      assert.ok(
        (await student.bootstrap()).progress.some(
          (p) => p.material_id === recordId && p.done,
        ),
      );
    });
    await t.test(
      "Tham gia nhóm, gửi thảo luận; chặn người ngoài và xóa bài người khác",
      async () => {
        groupId = first.groups[0].id;
        assert.equal(
          (await student.request("/api/groups/" + groupId + "/posts")).status,
          403,
        );
        assert.equal(
          (
            await student.request(
              "/api/groups/" + groupId + "/membership",
              "POST",
              { join: true },
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await student.request("/api/groups/" + groupId + "/posts", "POST", {
              body: "Cùng ôn tập nhé!",
            })
          ).status,
          201,
        );
        const r = await student.request("/api/groups/" + groupId + "/posts");
        assert.equal(r.data.posts.length, 1);
        assert.equal(
          (await second.request("/api/posts/" + r.data.posts[0].id, "DELETE"))
            .status,
          403,
        );
      },
    );
    await t.test(
      "Đăng ký/hủy sự kiện là idempotent và kiểm tra sức chứa",
      async () => {
        const event = first.events[0];
        for (let i = 0; i < 2; i++)
          assert.equal(
            (
              await student.request(
                "/api/events/" + event.id + "/registration",
                "POST",
                { register: true },
              )
            ).status,
            200,
          );
        assert.equal(
          (await student.bootstrap()).events.find((e) => e.id === event.id)
            .attendees,
          1,
        );
        assert.equal(
          (
            await student.request(
              "/api/events/" + event.id + "/registration",
              "POST",
              { register: false },
            )
          ).status,
          200,
        );
      },
    );
    await t.test(
      "Đánh giá giảng viên chỉ cho sinh viên và mỗi người một đánh giá",
      async () => {
        const tid = first.teachers[0].id;
        assert.equal(
          (
            await student.request("/api/teachers/" + tid + "/rating", "POST", {
              value: 5,
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await student.request("/api/teachers/" + tid + "/rating", "POST", {
              value: 4,
            })
          ).status,
          200,
        );
        assert.equal(
          (await student.bootstrap()).teachers[0].rating.n,
          first.teachers[0].rating.n + 1,
        );
        assert.equal(
          (
            await teacher.request("/api/teachers/" + tid + "/rating", "POST", {
              value: 5,
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await student.request("/api/teachers/" + tid + "/rating", "POST", {
              value: 6,
            })
          ).status,
          400,
        );
      },
    );
    await t.test(
      "Quiz chấm tại server, không gửi đáp án đúng; không thưởng hai lần",
      async () => {
        const before = (await student.bootstrap()).user.coins;
        const r = await student.request("/api/games/start", "POST", {
          mode: "quiz",
          subject: "Kinh tế vi mô",
        });
        assert.equal(r.status, 201);
        assert.ok(
          r.data.questions.every(
            (q) => !("answer" in q) && !("explanation" in q),
          ),
        );
        const answers = r.data.questions.map((q) =>
          q.options.indexOf(questionBank.find((b) => b[1] === q.prompt)[2][0]),
        );
        assert.equal(
          (
            await second.request("/api/games/submit", "POST", {
              id: r.data.id,
              answers,
            })
          ).status,
          404,
        );
        await delay(1600);
        const result = await student.request("/api/games/submit", "POST", {
          id: r.data.id,
          answers,
          coins: 999999,
          score: 999,
        });
        assert.equal(result.status, 200);
        assert.equal(result.data.score, 5);
        assert.equal(result.data.reward, 50);
        assert.equal(result.data.user.coins, before + 50);
        assert.equal(
          (
            await student.request("/api/games/submit", "POST", {
              id: r.data.id,
              answers,
            })
          ).status,
          409,
        );
        const next = await student.request("/api/games/start", "POST", {
          mode: "quiz",
          subject: "Kinh tế vi mô",
        });
        await delay(1600);
        const again = await student.request("/api/games/submit", "POST", {
          id: next.data.id,
          answers: next.data.questions.map((q) =>
            q.options.indexOf(
              questionBank.find((b) => b[1] === q.prompt)[2][0],
            ),
          ),
        });
        assert.equal(again.data.reward, 0);
      },
    );
    await t.test("Cả 8 chế độ chấm được điểm đầy đủ, gồm ô chữ", async () => {
      for (const mode of first.games.map((g) => g.id)) {
        const r = await student.request("/api/games/start", "POST", {
          mode,
          subject: "Tiếng Anh",
        });
        assert.equal(r.status, 201, mode);
        assert.equal(r.data.questions.length, 5);
        inspect
          .prepare("UPDATE attempts SET started=? WHERE id=?")
          .run(Date.now() - 2000, r.data.id);
        const answers = r.data.questions.map((q) =>
          mode === "crossword"
            ? {
                "Hạn chót (tiếng Anh).": "DEADLINE",
                "Học bổng (tiếng Anh).": "SCHOLARSHIP",
                "Bài tập được giao (tiếng Anh).": "ASSIGNMENT",
                "Học kỳ (tiếng Anh).": "SEMESTER",
                "Bài giảng (tiếng Anh).": "LECTURE",
              }[q.prompt]
            : q.options.indexOf(
                questionBank.find((b) => b[1] === q.prompt)[2][0],
              ),
        );
        const result = await student.request("/api/games/submit", "POST", {
          id: r.data.id,
          answers,
        });
        assert.equal(result.status, 200, mode);
        assert.equal(result.data.score, 5, mode);
      }
    });
    await t.test("Lượt tốc độ hết hạn không được điểm", async () => {
      const r = await student.request("/api/games/start", "POST", {
        mode: "speed",
        subject: "Tiếng Anh",
      });
      inspect
        .prepare("UPDATE attempts SET started=? WHERE id=?")
        .run(Date.now() - 100000, r.data.id);
      const result = await student.request("/api/games/submit", "POST", {
        id: r.data.id,
        answers: [0, 0, 0, 0, 0],
      });
      assert.equal(result.data.expired, true);
      assert.equal(result.data.score, 0);
    });
    await t.test(
      "Đổi quà trừ xu/tồn kho thật; từ chối thiếu xu và bảo vệ API",
      async () => {
        const reward = first.rewards.find((r) => r.cost === 300),
          before = (await student.bootstrap()).user.coins;
        assert.equal(
          (await second.request("/api/redeem", "POST", { rewardId: reward.id }))
            .status,
          400,
        );
        const result = await student.request("/api/redeem", "POST", {
          rewardId: reward.id,
          cost: 1,
        });
        assert.equal(result.status, 201);
        redemptionId = result.data.id;
        const after = await student.bootstrap();
        assert.equal(after.user.coins, before - 300);
        assert.equal(
          after.rewards.find((r) => r.id === reward.id).stock,
          reward.stock - 1,
        );
        assert.equal(
          (
            await student.request(
              "/api/admin/redemptions/" + redemptionId,
              "PATCH",
              { status: "completed" },
            )
          ).status,
          403,
        );
      },
    );
    await t.test("Quản trị hủy đổi quà hoàn xu một lần", async () => {
      const before = (await student.bootstrap()).user.coins;
      assert.equal(
        (
          await admin.request(
            "/api/admin/redemptions/" + redemptionId,
            "PATCH",
            { status: "cancelled" },
          )
        ).status,
        200,
      );
      assert.equal((await student.bootstrap()).user.coins, before + 300);
      assert.equal(
        (
          await admin.request(
            "/api/admin/redemptions/" + redemptionId,
            "PATCH",
            { status: "cancelled" },
          )
        ).status,
        409,
      );
    });
    await t.test(
      "Hai yêu cầu đổi quà đồng thời không lấy quá tồn kho",
      async () => {
        assert.equal(
          (
            await admin.request("/api/admin/rewards", "POST", {
              title: "Quà kiểm thử duy nhất",
              icon: "🎁",
              cost: 10,
              stock: 1,
              category: "study",
            })
          ).status,
          200,
        );
        const reward = (await student.bootstrap()).rewards.find(
          (r) => r.title === "Quà kiểm thử duy nhất",
        );
        const responses = await Promise.all([
          student.request("/api/redeem", "POST", { rewardId: reward.id }),
          student.request("/api/redeem", "POST", { rewardId: reward.id }),
        ]);
        assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
        assert.equal(
          (await student.bootstrap()).rewards.find((r) => r.id === reward.id)
            .stock,
          0,
        );
        assert.equal(
          (
            await teacher.request("/api/admin/rewards", "POST", {
              title: "bad",
            })
          ).status,
          403,
        );
      },
    );
    await t.test(
      "Chặn link video nguy hiểm và chỉ nhận YouTube HTTPS",
      async () => {
        const payload = {
          section: "materials",
          title: "Video kiểm thử",
          description: "Bài giảng",
          subject: "Quản trị học",
          type: "lesson",
          body: "Nội dung",
          videoUrl: "javascript:alert(1)",
        };
        assert.equal(
          (await teacher.request("/api/records", "POST", payload)).status,
          400,
        );
        assert.equal(
          (
            await teacher.request("/api/records", "POST", {
              ...payload,
              videoUrl: "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
            })
          ).status,
          400,
        );
        const r = await teacher.request("/api/records", "POST", {
          ...payload,
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        });
        assert.equal(r.status, 201, JSON.stringify(r.data));
        assert.equal(
          (await teacher.bootstrap()).materials.find((m) => m.id === r.data.id)
            .videoId,
          "dQw4w9WgXcQ",
        );
      },
    );
    await t.test("Chặn ngày không tồn tại và Host giả mạo", async () => {
      assert.equal(
        (
          await student.request("/api/schedules", "POST", {
            title: "bad",
            kind: "class",
            start: "2026-02-31T09:00",
            end: "2026-03-01T10:00",
          })
        ).status,
        400,
      );
      const status = await new Promise((resolve, reject) => {
        const r = httpRequest(
          origin + "/api/session",
          { headers: { Host: "evil.example" } },
          (res) => {
            res.resume();
            resolve(res.statusCode);
          },
        );
        r.on("error", reject);
        r.end();
      });
      assert.equal(status, 400);
    });
    await t.test(
      "Tra cứu có nguồn, lập kế hoạch và báo cáo cá nhân hoạt động",
      async () => {
        const r = await student.request("/api/assistant", "POST", {
          message: "Giải thích cung cầu",
          mode: "summary",
        });
        assert.equal(r.status, 200);
        assert.equal(r.data.engine, "library");
        assert.ok(r.data.sources.length > 0);
        assert.match(r.data.answer, /Cầu/);
        const plan = await student.request("/api/assistant", "POST", {
          message: "Lập kế hoạch",
          mode: "plan",
        });
        assert.match(plan.data.answer, /25 phút/);
      },
    );
    await t.test(
      "Chống SQL injection; văn bản XSS được lưu như dữ liệu",
      async () => {
        const xss = "<img src=x onerror=alert(1)>";
        const r = await student.request("/api/tasks", "POST", { title: xss });
        assert.equal(r.status, 201);
        assert.equal(
          (await student.request("/api/tasks/1'%20OR%201=1", "DELETE")).status,
          404,
        );
        assert.ok(
          (await student.bootstrap()).tasks.some((t) => t.title === xss),
        );
        assert.equal(
          (await student.request("/data/initial-credentials.json")).status,
          404,
        );
        assert.equal((await student.request("/server.mjs")).status, 404);
      },
    );
    await t.test(
      "Đổi quyền/khóa tài khoản thu hồi các phiên ngay; không tự sửa quyền",
      async () => {
        assert.equal(
          (
            await admin.request("/api/admin/users/" + admin.user.id, "PATCH", {
              role: "student",
              active: true,
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await student.request("/api/profile", "POST", {
              name: student.user.name,
              year: 2,
              subject: "Kinh tế vi mô",
              role: "admin",
              coins: 999999,
            })
          ).status,
          200,
        );
        assert.equal((await student.bootstrap()).user.role, "student");
        assert.equal(
          (
            await admin.request("/api/admin/users/" + second.user.id, "PATCH", {
              role: "teacher",
              active: true,
            })
          ).status,
          200,
        );
        assert.equal((await second.request("/api/bootstrap")).status, 401);
        await second.login({
          email: "second@example.com",
          password: "MatKhauKiemThu!2026",
        });
        assert.equal(second.user.role, "teacher");
        assert.equal(
          (
            await admin.request("/api/admin/users/" + second.user.id, "PATCH", {
              role: "teacher",
              active: false,
            })
          ).status,
          200,
        );
        assert.equal((await second.request("/api/bootstrap")).status, 401);
      },
    );
    await t.test(
      "Đổi mật khẩu kiểm tra mật khẩu cũ và thu hồi phiên",
      async () => {
        assert.equal(
          (
            await student.request("/api/password", "POST", {
              current: "SaiMatKhau",
              password: "NewPasswordTest!2026",
            })
          ).status,
          400,
        );
        const c = new Client();
        await c.login(creds.find((c) => c.role === "student"));
        const r = await student.request("/api/password", "POST", {
          current: creds.find((c) => c.role === "student").password,
          password: "  NewPasswordTest!2026  ",
        });
        assert.equal(r.status, 200);
        assert.equal((await c.request("/api/bootstrap")).status, 401);
        assert.equal((await student.request("/api/bootstrap")).status, 200);
        const withSpaces = new Client();
        await withSpaces.login({
          email: creds.find((c) => c.role === "student").email,
          password: "  NewPasswordTest!2026  ",
        });
      },
    );
    await t.test(
      "Nhật ký quản trị ghi phân quyền và hoàn xu; không lộ mật khẩu",
      async () => {
        const a = await admin.request("/api/admin");
        assert.equal(a.status, 200);
        assert.ok(a.data.audit.some((x) => x.action === "user.permission"));
        assert.ok(
          a.data.audit.some((x) => x.action === "redemption.cancelled"),
        );
        assert.ok(a.data.users.every((u) => !("password" in u)));
      },
    );
    await t.test("Đăng xuất thu hồi cookie và phiên", async () => {
      assert.equal(
        (await student.request("/api/logout", "POST", {})).status,
        200,
      );
      assert.equal((await student.request("/api/bootstrap")).status, 401);
    });
    await t.test("Giới hạn đăng nhập trả 429", async () => {
      const c = new Client();
      await c.request("/api/session");
      let status;
      for (let i = 0; i < 12; i++) {
        const r = await c.request("/api/login", "POST", {
          email: "missing@example.com",
          password: "InvalidPassword!2026",
        });
        status = r.status;
        if (status === 429) break;
      }
      assert.equal(status, 429);
    });
  } finally {
    inspect?.close();
    server.kill("SIGTERM");
    await new Promise((resolve) => {
      server.once("exit", resolve);
      setTimeout(resolve, 2000);
    });
    assert.ok(
      resolve(dataDir).startsWith(scratch + sep),
      "Chỉ dọn dữ liệu kiểm thử bên trong thư mục tạm đã chọn.",
    );
    rmSync(dataDir, { recursive: true, force: true });
  }
});
