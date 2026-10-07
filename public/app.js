const $ = (s, root = document) => root.querySelector(s);
const e = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const number = (n) => new Intl.NumberFormat("vi-VN").format(n || 0);
const dateLabel = (d) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(d));
const timeLabel = (s) => s?.slice(11, 16) || "";
const paths = {
  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  bot: "M8 3h8M12 3v3M5 8h14v12H5zM8 12h.01M16 12h.01M9 16h6M2 11v5M22 11v5",
  calendar:
    "M8 2v4M16 2v4M3 9h18M4 4h16a1 1 0 0 1 1 1v16H3V5a1 1 0 0 1 1-1M7 13h3M14 13h3M7 17h3",
  book: "M4 3h15v17H4zM7 6h8M7 10h8M7 14h5M1 6v17h16",
  game: "M7 7h10c3 0 4 3 5 9 0 2-2 3-3 1l-2-2H7l-2 2c-2 2-3 1-3-1 1-6 2-9 5-9M7 10v5M4.5 12.5h5M16 11h.01M19 14h.01",
  users:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-3c0-3 3-5 7-5s7 2 7 5v3M17 4c4 0 4 6 0 6M19 14c2 1 3 2 3 5v2",
  calc: "M5 2h14v20H5zM8 5h8M8 10h1M15 10h1M8 14h1M15 14h1M8 18h1M15 18h1",
  event: "M4 5h16v16H4zM8 2v6M16 2v6M9 12l2 2 4-4",
  cap: "M2 8 12 3l10 5-10 5zM6 10v8c4 3 8 3 12 0v-8M22 8v9",
  check: "M9 3h6v3H9zM7 4H4v18h16V4h-3M8 13l3 3 5-6",
  chart: "M3 3v18h18M7 17v-6M12 17V7M17 17v-9",
  settings:
    "M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14M15 15l6 6",
  chevron: "m9 5 7 7-7 7",
  down: "m5 9 7 7 7-7",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  edit: "m16 3 5 5-13 13H3v-5zM13 6l5 5",
  send: "m3 3 19 9-19 9 4-9zM7 12h15",
  play: "m8 4 12 8-12 8z",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 6v6l4 2",
  close: "m6 6 12 12M6 18 18 6",
  logout: "M9 3H3v18h6M13 7l5 5-5 5M8 12h13",
  shield: "M12 2 3 6v7c0 5 9 9 9 9s9-4 9-9V6zM8 12l3 3 5-6",
  menu: "M3 6h18M3 12h18M3 18h18",
  download: "M12 3v12M7 10l5 5 5-5M4 17v4h16v-4",
  back: "m14 5-7 7 7 7",
  star: "m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z",
  trophy:
    "M8 3h8v6c0 5-8 5-8 0zM8 5H3v3c0 3 3 4 5 4M16 5h5v3c0 3-3 4-5 4M12 13v5M7 21h10M9 18h6",
};
const icon = (name, cls = "") =>
  `<svg class="${e(cls)}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.book}"/></svg>`;
const nav = [
  ["home", "Trang chủ", "home"],
  ["ai", "AI Học tập", "bot"],
  ["calendar", "Lịch học & Lịch thi", "calendar"],
  ["materials", "Bài giảng & Tài liệu", "book"],
  ["games", "Game học tập", "game"],
  ["groups", "Hội nhóm học tập", "users"],
  ["grades", "Tính điểm", "calc"],
  ["events", "Sự kiện", "event"],
  ["teachers", "Giảng viên uy tín", "cap"],
  ["tasks", "To do list", "check"],
  ["stats", "Thống kê cá nhân", "chart"],
  ["settings", "Cài đặt", "settings"],
];
const subjects = [
  "Kinh tế vi mô",
  "Marketing căn bản",
  "Quản trị học",
  "Tiếng Anh",
];
const roleNames = {
  student: "Sinh viên",
  teacher: "Giảng viên",
  admin: "Quản trị viên",
};
const typeNames = {
  lesson: "Bài học",
  document: "Tài liệu",
  exam: "Đề tự kiểm tra",
};
const providerName = (provider) => provider === "gemini" ? "Gemini" : "OpenAI";
const aiFailureText = (code) => ({
  quota: "Hết hạn mức hoặc đang gửi quá nhanh",
  credentials_or_request: "Khóa API, quyền truy cập hoặc yêu cầu chưa hợp lệ",
  model_unavailable: "Mô hình hiện không khả dụng",
  invalid_model: "Tên mô hình chưa hợp lệ",
  timeout: "Phản hồi quá thời gian chờ",
  blocked: "Yêu cầu bị bộ lọc của nhà cung cấp từ chối",
}[code] || "Dịch vụ AI tạm thời không phản hồi");
let state = {
  csrf: "",
  user: null,
  data: null,
  route: "home",
  authMode: "login",
  week: null,
  filters: {},
  chat: [],
  chatPending: false,
  chatMode: "summary",
  query: "",
  game: null,
  admin: null,
};
let gameTimer, modalReturnFocus;
const brand = () =>
  `<div class="brand">${icon("cap")}<div><b>Smart Student</b><small>Học thông minh · Sống trọn đại học</small></div></div>`;
const avatar = (name, small = false, teacher = false) =>
  `<div class="avatar ${small ? "small" : ""} ${teacher ? "teacher" : ""}">${e(
    name
      .split(" ")
      .slice(-2)
      .map((n) => n[0])
      .join(""),
  )}</div>`;
const panelHead = (title, ico, route, extra = "") =>
  `<div class="panel-head"><div class="panel-title">${ico?.length > 2 ? icon(ico) : `<span class="emoji">${ico || ""}</span>`}${e(title)}</div>${route ? `<button class="link-btn" data-nav="${route}">Xem tất cả ${icon("chevron")}</button>` : extra}</div>`;
const empty = (message) => `<div class="empty">${e(message)}</div>`;
const pageHeading = (title, description, button = "") =>
  `<div class="page-heading"><div><h1>${e(title)}</h1><p>${e(description)}</p></div>${button}</div>`;
const options = (values, selected) =>
  values
    .map(
      (v) =>
        `<option value="${e(v)}" ${v === selected ? "selected" : ""}>${e(v)}</option>`,
    )
    .join("");
const canManage = (r) =>
  state.user.role === "admin" || r.owner === state.user.id;
const isStaff = () => ["admin", "teacher"].includes(state.user.role);
const gameSprite = (mode) => {
  const i = Math.max(
    0,
    [
      "quiz",
      "flashcard",
      "puzzle",
      "speed",
      "crossword",
      "daily",
      "race",
      "subject",
    ].indexOf(mode),
  );
  return `<span class="game-sprite" style="background-position:${((i % 4) * 100) / 3}% ${i < 4 ? 0 : 100}%" aria-hidden="true"></span>`;
};
function gameStreak() {
  const days = new Set(state.data.stats.gameDays || []);
  const current = new Date(state.data.today + "T12:00:00");
  if (!days.has(localDate(current))) current.setDate(current.getDate() - 1);
  let streak = 0;
  while (days.has(localDate(current))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }
  return streak;
}
function playedWeekDay(i) {
  const current = new Date(state.data.today + "T12:00:00");
  current.setDate(current.getDate() - ((current.getDay() + 6) % 7) + i);
  return (state.data.stats.gameDays || []).includes(localDate(current));
}
function toast(message, error = false) {
  const el = document.createElement("div");
  el.className = "toast" + (error ? " error" : "");
  el.textContent = message;
  $("#toasts").append(el);
  setTimeout(() => el.remove(), 4500);
}
async function api(path, { method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: {
      ...(method !== "GET"
        ? { "Content-Type": "application/json", "X-CSRF-Token": state.csrf }
        : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== "/api/login") {
      closeModal();
      state.user = null;
      state.data = null;
      state.admin = null;
      state.chat = [];
      state.chatPending = false;
      const session = await fetch("/api/session").then((r) => r.json());
      state.csrf = session.csrf;
      render();
    }
    throw new Error(data.error || "Không thể kết nối máy chủ.");
  }
  return data;
}
async function refresh() {
  state.data = await api("/api/bootstrap");
  state.user = state.data.user;
}
async function mutate(path, method, body, message) {
  await api(path, { method, body });
  await refresh();
  render();
  if (message) toast(message);
}
function navigate(route) {
  if (route === "admin" && state.user.role !== "admin")
    return toast("Bạn không có quyền quản trị.", true);
  location.hash = route;
}
function render() {
  if (!state.user) return renderAuth();
  if (!state.data) return;
  const route = state.route;
  const pages = {
    home: homePage,
    ai: aiPage,
    calendar: calendarPage,
    materials: materialsPage,
    games: gamesPage,
    groups: groupsPage,
    grades: gradesPage,
    events: eventsPage,
    teachers: teachersPage,
    tasks: tasksPage,
    stats: statsPage,
    settings: settingsPage,
    search: searchPage,
    admin: adminPage,
  };
  if (!pages[route] || (route === "admin" && state.user.role !== "admin"))
    state.route = "home";
  document.title = `${nav.find((n) => n[0] === state.route)?.[1] || "Smart Student"} · Smart Student`;
  $("#app").innerHTML =
    `<header class="topbar"><button class="icon-btn menu-toggle" data-action="menu" aria-label="Mở menu">${icon("menu")}</button>${brand()}<form class="top-search" data-form="search">${icon("search")}<input name="query" aria-label="Tìm kiếm" placeholder="Tìm kiếm bài giảng, tài liệu, giảng viên, môn học…" value="${e(state.query)}"></form><div class="top-account"><button class="icon-btn" data-action="notifications" aria-label="Thông báo">${icon("bell")}${state.user.settings.notifications !== false && state.data.notifications.some((n) => !n.seen) ? `<span class="notification-dot">${state.data.notifications.filter((n) => !n.seen).length}</span>` : ""}</button><button class="account-button" data-nav="settings">${avatar(state.user.name)}<div><b>${e(state.user.name)}</b><small>${roleNames[state.user.role]}${state.user.role === "student" ? " năm " + (state.user.settings.year || 2) : ""}</small></div>${icon("down")}</button></div></header><aside class="sidebar" aria-label="Điều hướng chính">${nav.map(([key, label, ico]) => `<button class="nav-item ${key === state.route ? "active" : ""}" data-nav="${key}" ${key === state.route ? 'aria-current="page"' : ""}>${icon(ico)}${label}</button>`).join("")}${state.user.role === "admin" ? `<button class="nav-item ${route === "admin" ? "active" : ""}" data-nav="admin">${icon("shield")}Quản trị hệ thống</button>` : ""}<div class="sidebar-note">Cùng Smart Student<br><b>biến đại học thành<br>hành trình tuyệt vời nhé!</b> 💗</div><div class="sidebar-robot" role="img" aria-label="Robot sinh viên"></div><div class="sidebar-footer">Một chút cố gắng, một bước tiến xa.</div></aside><div class="mobile-overlay" data-action="menu"></div><main class="main" id="main-content">${pages[state.route]()}<footer class="footer"><span>© ${new Date().getFullYear()} Smart Student · Học thông minh, sống trọn đại học</span><span>Đồng hành mỗi ngày 💙</span></footer></main>`;
}
function renderAuth(error = "") {
  const register = state.authMode === "register";
  $("#app").innerHTML =
    `<main class="auth-page"><section class="auth-visual">${brand()}<div class="auth-slogan"><h1>Học thông minh.<br>Sống trọn<br>đại học.</h1><p>Mỗi ngày một bước tiến,<br>mỗi hành trình một người bạn.</p></div><span class="badge">✦ Không gian học tập dành cho bạn</span></section><section class="auth-form">${brand()}<h2>${register ? "Bắt đầu hành trình ✨" : "Chào mừng trở lại 👋"}</h2><p>${register ? "Tạo tài khoản sinh viên để học, chơi và tiến bộ mỗi ngày." : "Đăng nhập để tiếp tục hành trình học tập của bạn."}</p>${error ? `<div class="error-text" role="alert">${e(error)}</div>` : ""}<form data-form="auth">${register ? '<label class="field">Họ và tên<input name="name" autocomplete="name" minlength="2" maxlength="80" placeholder="Nguyễn Minh Anh" required></label>' : ""}<label class="field">Email<input name="email" type="email" autocomplete="username" maxlength="254" placeholder="ban@example.com" required></label><label class="field">Mật khẩu<input name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" ${register ? 'minlength="12"' : ""} maxlength="128" placeholder="${register ? "Ít nhất 12 ký tự" : "Nhập mật khẩu của bạn"}" required></label>${register ? '<p class="tiny muted">Tài khoản mới được cấp quyền sinh viên. Mật khẩu được bảo vệ trên máy chủ.</p>' : ""}<button class="btn w-full" type="submit">${register ? "Tạo tài khoản" : "Đăng nhập"} ${icon("chevron")}</button></form><div class="auth-switch">${register ? "Đã có tài khoản?" : "Bạn chưa có tài khoản?"} <button data-action="auth-switch">${register ? "Đăng nhập" : "Đăng ký ngay"}</button></div><div class="auth-foot">Một không gian cho lịch học, tài liệu và những mục tiêu.<br>Smart Student · Học thông minh, sống trọn đại học</div></section></main>`;
}
function tasksList(limit = 100) {
  return (
    state.data.tasks
      .slice(0, limit)
      .map(
        (t) =>
          `<div class="task-line ${t.done ? "done" : ""}"><input type="checkbox" ${t.done ? "checked" : ""} data-task="${t.id}" aria-label="Hoàn thành ${e(t.title)}"><span class="priority"></span><span class="task-title" title="${e(t.title)}">${e(t.title)}</span>${state.route === "tasks" ? `<button class="icon-btn" data-action="task-edit" data-id="${t.id}" aria-label="Sửa công việc">${icon("edit")}</button>` : ""}<button class="icon-btn" data-action="task-delete" data-id="${t.id}" aria-label="Xóa công việc">${icon("trash")}</button></div>`,
      )
      .join("") || empty("Thêm công việc đầu tiên của bạn.")
  );
}
function taskEntry() {
  return `<form class="task-entry" data-form="task"><input name="title" placeholder="Thêm công việc mới…" aria-label="Công việc mới" maxlength="200" required><button class="btn" aria-label="Thêm công việc">${icon("plus")}</button></form>`;
}
function groupLines(limit = 4) {
  return (
    state.data.groups
      .slice(0, limit)
      .map(
        (g) =>
          `<div class="group-line"><div class="group-icon">${e(g.icon || "📚")}</div><div class="grow"><b>${e(g.title)}</b><small>${number(g.members)} thành viên</small></div><button class="btn outline" data-action="${g.joined ? "group-open" : "group-join"}" data-id="${g.id}">${g.joined ? "Mở nhóm" : "Tham gia"}</button></div>`,
      )
      .join("") || empty("Chưa có hội nhóm.")
  );
}
function teacherLines() {
  return (
    state.data.teachers
      .map(
        (t) =>
          `<div class="teacher-line">${avatar(t.name, false, true)}<div class="grow"><b>${e(t.name)}</b><small>${e(t.subject)} · ${t.rating.avg ? number(t.rating.avg) + " ⭐" : "Chưa đánh giá"}</small></div><button class="btn outline" data-action="teacher-open" data-id="${t.id}">Xem profile</button></div>`,
      )
      .join("") || empty("Chưa có giảng viên.")
  );
}
function lessonCards(limit = 3) {
  return (
    state.data.materials
      .filter((m) => m.type === "lesson")
      .slice(0, limit)
      .map(
        (m, i) =>
          `<div class="lesson-card"><button class="lesson-thumb" style="background:linear-gradient(145deg,${["#345275", "#89735a", "#47706b"][i % 3]},${["#9db7c9", "#c5b396", "#a3c9b6"][i % 3]})" data-action="material-open" data-id="${m.id}" aria-label="Mở ${e(m.title)}"><span class="play">${icon("play")}</span><small>${m.duration} phút</small></button><h4>${e(m.title)}</h4><p>${state.data.progress.some((p) => p.material_id === m.id && p.done) ? "✓ Đã hoàn thành" : "Bài học tương tác · Có bài tập"}</p></div>`,
      )
      .join("") || empty("Chưa có bài học.")
  );
}
function docCards() {
  return state.data.materials
    .filter((m) => m.type !== "lesson")
    .slice(0, 3)
    .map(
      (m) =>
        `<button class="doc-mini" data-action="material-open" data-id="${m.id}"><span class="doc-icon">${m.type === "exam" ? "📕" : "📘"}</span><span>${e(m.title)}<small>${typeNames[m.type]} · TXT</small></span></button>`,
    )
    .join("");
}
function miniGames() {
  return state.data.games
    .slice(0, 3)
    .map(
      (g) =>
        `<div class="mini-game ${g.color}"><div class="art">${gameSprite(g.id)}</div><h3>${g.name}</h3><p>${g.description}</p><button class="btn" data-action="game-choose" data-id="${g.id}">Bắt đầu</button></div>`,
    )
    .join("");
}
function gradeForm(compact = false) {
  return `<form data-form="grade" class="${compact ? "" : "stack"}">${!compact ? `<label class="field">Môn học<select name="subject">${options(subjects)}</select></label>` : '<input type="hidden" name="subject" value="Kinh tế vi mô">'}<div class="grade-form">${["Quá trình", "Giữa kỳ", "Cuối kỳ"].map((label, i) => `<div class="grade-fields"><label>${compact ? "Điểm " : ""}${label} (%)</label><input aria-label="Trọng số ${label}" name="w${i}" type="number" min="0" max="100" step="0.1" value="${[30, 30, 40][i]}" required><label>Điểm ${label}</label><input aria-label="Điểm ${label}" name="s${i}" type="number" min="0" max="10" step="0.1" value="${[8.5, 7, 9][i]}" required></div>`).join("")}<div class="grade-result"><small>Kết quả</small><strong id="grade-preview">8,25</strong><button class="btn" type="submit">Tính & lưu</button></div></div><small class="muted tiny">Điểm từ 0–10 · Tổng trọng số 100%</small></form>`;
}
function weekStart() {
  if (state.week) return new Date(state.week + "T12:00:00");
  const base = state.data.today;
  const d = new Date(base + "T12:00:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
function localDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function calendarWidget(large = false) {
  const start = weekStart(),
    days = Array.from({ length: large ? 7 : 5 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  const filter = state.filters.calendar || "all";
  return `<div class="calendar-head"><button class="icon-btn" data-action="week-prev" aria-label="Tuần trước">${icon("back")}</button><b>${dateLabel(start)} – ${dateLabel(days.at(-1))}</b><button class="icon-btn" data-action="week-next" aria-label="Tuần sau">${icon("chevron")}</button></div><div class="calendar ${large ? "large" : ""}"><span></span>${days.map((d, i) => `<div class="cal-day">${i === 6 ? "CN" : "T" + (i + 2)}<b>${d.getDate()}</b></div>`).join("")}<div class="cal-time">${["7:00", "9:00", "11:00", "13:00", "15:00", "17:00", "19:00"].map((t) => `<span>${t}</span>`).join("")}</div>${days
    .map(
      (d) =>
        `<div class="cal-body">${state.data.schedules
          .filter(
            (s) =>
              s.start.slice(0, 10) === localDate(d) &&
              (filter === "all" || s.kind === filter),
          )
          .map((s, i) => {
            const h =
              Number(s.start.slice(11, 13)) +
              Number(s.start.slice(14, 16)) / 60;
            const duration =
              (Date.parse(s.end) - Date.parse(s.start)) / 3600000;
            return `<button class="cal-event ${["sky", "lavender", "mint", "peach", "yellow", "pink"][i % 6]}" style="top:${Math.max(0, Math.min(91, ((h - 7) / 12) * 100))}%;height:${Math.min(35, Math.max(11, (duration / 12) * 100))}%" data-action="schedule-open" data-id="${s.id}">${e(s.title)}<small>${e(s.location)}</small></button>`;
          })
          .join("")}</div>`,
    )
    .join(
      "",
    )}</div><div class="calendar-add"><button class="btn" data-action="schedule-add">${icon("plus")} Thêm lịch học</button></div>`;
}
function homePage() {
  const d = state.data,
    done = d.tasks.filter((t) => t.done).length,
    percent = d.tasks.length ? Math.round((done / d.tasks.length) * 100) : 0;
  const todaySeconds =
    d.stats.activity.find((a) => a.day === d.today)?.seconds || 0;
  return `<div class="dashboard"><div class="welcome-row"><section class="welcome-banner"><div class="welcome-copy"><p>Chào mừng trở lại,</p><h1>${e(state.user.name)} !</h1><small>Hôm nay là một ngày tuyệt vời để học điều mới ✨</small><div class="welcome-quote">❝ &nbsp; Kỷ luật hôm nay,<br>&nbsp;&nbsp;&nbsp;&nbsp; là tự do của ngày mai.</div></div></section><section class="panel quick-panel"><h3>Hôm nay bạn muốn làm gì?</h3><div class="quick-grid">${[
    ["ai", "Hỏi AI", "bot"],
    ["materials", "Xem bài giảng", "play"],
    ["games", "Làm quiz", "trophy"],
    ["calendar", "Xem lịch học", "calendar"],
    ["tasks", "Tạo to do list", "check"],
    ["materials", "Tra cứu tài liệu", "book"],
  ]
    .map(
      ([r, t, i]) =>
        `<button class="quick-btn" data-nav="${r}">${icon(i)}${t}</button>`,
    )
    .join(
      "",
    )}</div></section><section class="panel progress-panel"><div class="flex between"><h3>Tiến độ hôm nay</h3><div class="progress-ring" style="--progress:${percent}"><span>${percent}%</span></div></div><p class="small muted mt">Đã hoàn thành ${done}/${d.tasks.length} việc</p>${d.tasks
    .slice(0, 4)
    .map(
      (t) =>
        `<label class="mini-check"><input type="checkbox" data-task="${t.id}" ${t.done ? "checked" : ""}>${e(t.title)}</label>`,
    )
    .join(
      "",
    )}</section></div><div class="dash-middle"><section class="panel"><div class="flex between"><div class="ai-intro"><span class="bot-icon">🤖</span><div><h3>AI HỌC TẬP</h3><p class="tiny muted">Trợ lý học tập thông minh luôn bên bạn</p></div></div><span class="badge red">${d.aiMode === "online" ? "AI" : "Thư viện"}</span></div><form class="ai-input" data-form="home-ai">${icon("search")}<input name="message" placeholder="Bạn muốn hỏi gì hôm nay?" aria-label="Câu hỏi học tập" maxlength="2000" required><button class="btn" aria-label="Gửi câu hỏi">${icon("send")}</button></form><div class="suggestions">${[
    ["summary", "Tóm tắt kiến thức"],
    ["solve", "Giải bài tập"],
    ["plan", "Lập kế hoạch học tập"],
    ["analysis", "Phân tích năng lực"],
  ]
    .map(
      ([mode, title]) =>
        `<button class="chip" data-action="ai-mode" data-id="${mode}">${title}</button>`,
    )
    .join("")}</div><div class="ai-tiles">${[
    [
      "summary",
      "🔮",
      "Tổng hợp kiến thức",
      "Tóm tắt nhanh, dễ hiểu",
      "lavender",
    ],
    ["solve", "📚", "Tra cứu bài tập", "Gợi ý từ thư viện môn học", "sky"],
    [
      "plan",
      "🗓️",
      "Lập kế hoạch học tập",
      "Gợi ý lịch học cá nhân",
      "lavender",
    ],
    [
      "analysis",
      "📊",
      "Phân tích tiến độ",
      "Theo dõi điểm và công việc",
      "peach",
    ],
    ["stats", "📗", "Báo cáo học tập", "Hiển thị kết quả sau mỗi ngày", "mint"],
    ["tasks", "⏰", "Thông báo thời gian", "Nhắc nhở cân bằng học tập", "pink"],
  ]
    .map(
      ([mode, emoji, title, desc, color]) =>
        `<button class="ai-tile ${color}" ${["stats", "tasks"].includes(mode) ? `data-nav="${mode}"` : `data-action="ai-mode" data-id="${mode}"`}><span class="emoji">${emoji}</span><b>${title}</b><p>${desc}</p></button>`,
    )
    .join(
      "",
    )}</div></section><section class="panel">${panelHead("Lịch học & Lịch thi", "calendar", "calendar")}<div class="tabs">${[
    ["all", "Thời khóa biểu"],
    ["exam", "Lịch thi"],
    ["deadline", "Deadline"],
  ]
    .map(
      ([v, t]) =>
        `<button class="chip ${(state.filters.calendar || "all") === v ? "active" : ""}" data-filter="calendar" data-value="${v}">${t}</button>`,
    )
    .join(
      "",
    )}</div>${calendarWidget()}</section><div class="right-stack"><section class="panel">${panelHead("To do list", "check", "tasks")}${taskEntry()}${tasksList(5)}</section><section class="panel time-card"><div class="flex between"><h3>Thời gian học hôm nay</h3>${icon("clock")}</div><div class="time-value">${Math.floor(todaySeconds / 3600)}h ${Math.floor((todaySeconds % 3600) / 60)}m</div><div class="time-segments"></div><div class="time-legend"><span>🔵 Trên website<b>${Math.floor(todaySeconds / 60)} phút</b></span><span>🌸 Nhịp học<b>25 phút / phiên</b></span><span>🟡 Nghỉ ngơi<b>5 phút</b></span></div></section></div></div><div class="dash-lower"><section class="panel">${panelHead("Game học tập", "game", "games")}<p class="tiny muted">Học mà chơi · Chơi mà nhớ lâu</p><div class="mini-games">${miniGames()}</div></section><section class="panel">${panelHead("Bài giảng & Tài liệu", "book", "materials")}<div class="tabs"><button class="chip active" data-nav="materials">Bài học</button><button class="chip" data-nav="materials">Đề tự kiểm tra</button><button class="chip" data-nav="materials">Tài liệu</button></div><div class="lesson-grid">${lessonCards()}</div><div class="doc-grid">${docCards()}</div></section><section class="panel">${panelHead("Hội nhóm học tập", "users", "groups")}<div class="group-list">${groupLines()}</div></section></div><div class="dash-bottom"><section class="panel">${panelHead("Tính điểm", "calc", "grades")}<div class="tabs"><button class="chip active">Điểm học phần</button></div>${gradeForm(true)}</section><section class="panel">${panelHead("Sự kiện mới nhất", "event", "events")}<div class="tabs"><button class="chip active" data-nav="events">Tất cả</button><button class="chip" data-nav="events">Học thuật</button><button class="chip" data-nav="events">Kỹ năng</button></div><div class="events-mini">${d.events
    .slice(0, 3)
    .map(
      (v) =>
        `<div class="event-mini"><h4>${e(v.title)}</h4><p>Thời gian: ${dateLabel(v.date)}<br>Địa điểm: ${e(v.location)}</p><span class="badge green">${e(v.category)}</span><br><button class="btn" data-action="event-open" data-id="${v.id}">${v.registered ? "Đã đăng ký" : "Đăng ký"}</button></div>`,
    )
    .join(
      "",
    )}</div></section><section class="panel">${panelHead("Giảng viên uy tín", "cap", "teachers")}<div class="teacher-list">${teacherLines()}</div></section></div></div>`;
}
function leaderboard() {
  return (
    state.data.leaderboard
      .map(
        (u, i) =>
          `<div class="rank-line ${u.id === state.user.id ? "me" : ""}"><span class="rank">${["🥇", "🥈", "🥉"][i] || i + 1}</span>${avatar(u.name, true)}<div class="grow"><b>${e(u.name)}</b><small>${number(u.xp)} XP</small></div><span class="badge gold">Lv. ${Math.floor(u.xp / 1000) + 1}</span></div>`,
      )
      .join("") || empty("Chơi game để bắt đầu bảng xếp hạng.")
  );
}
function rewardsGrid(limit = 8) {
  const filter = state.filters.rewards || "all";
  return state.data.rewards
    .filter((r) => filter === "all" || r.category === filter)
    .slice(0, limit)
    .map(
      (r) =>
        `<div class="reward-card"><div class="reward-art">${e(r.icon)}</div><h4>${e(r.title)}</h4><small>🟡 ${number(r.cost)} xu</small><button class="btn light" data-action="redeem-confirm" data-id="${r.id}" ${r.stock === 0 ? "disabled" : ""}>${r.stock === 0 ? "Hết quà" : "Đổi quà"}</button></div>`,
    )
    .join("");
}
function gamesPage() {
  const u = state.user,
    stats = state.data.stats;
  return `<div class="games-layout"><div><section class="game-hero"><h1>Game học tập</h1><h2>Học qua trò chơi · Kiến thức không còn khô khan!</h2><div class="hero-points"><span>Nhiều chế độ game đa dạng</span><span>Tích lũy xu sau khi hoàn thành</span><span>Đổi quà học tập thật thú vị</span><span>Vừa học vừa giải trí</span></div></section><div class="game-intro"><span class="emoji">🎮</span><div><h2>Chọn chế độ game</h2><p class="tiny muted">Nhiều hình thức chơi · Phù hợp với mọi phong cách học tập</p></div></div><div class="game-grid">${state.data.games.map((g) => `<article class="game-card"><div class="game-art ${g.color}">${gameSprite(g.id)}</div><div class="game-card-body"><h3>${g.name}</h3><p>${g.description}</p><span class="badge gold">🟡 +10–50 xu / ngày</span><button class="btn" data-action="game-choose" data-id="${g.id}">Chơi ngay</button></div></article>`).join("")}</div><p class="tiny muted mt">Mỗi chế độ thưởng xu một lần mỗi ngày. Bạn có thể chơi lại để luyện tập.</p></div><aside class="game-side"><section class="panel profile-card"><div class="flex">${avatar(u.name)}<div><b class="small">${e(u.name)}</b><p class="tiny muted">${roleNames[u.role]} · Smart Student</p></div></div><div class="xp-line"><span class="badge gold">Lv. ${u.level}</span><div class="bar"><span style="width:${(u.xp % 1000) / 10}%"></span></div><span>${u.xp % 1000}/1000 XP</span></div><div class="coin-line"><div class="coin-count"><span class="coin">🟡</span>${number(u.coins)} <small>xu</small></div><button class="btn small" data-action="scroll-rewards">Đổi quà</button></div><div class="flex between"><b class="small">Chuỗi ngày học game</b><span class="tiny muted">🔥 ${gameStreak()} ngày liên tiếp</span></div><div class="week-streak">${["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((t, i) => `<div class="${playedWeekDay(i) ? "complete" : ""}"><i>✓</i>${t}</div>`).join("")}</div></section><section class="panel">${panelHead("Bảng xếp hạng", "trophy", null)}<div class="tabs"><span class="chip active">Top sinh viên · Tổng XP</span></div>${leaderboard()}</section><section class="panel">${panelHead("Nhiệm vụ game", "game", null)}${[
    ["Hoàn thành 3 lượt chơi", Math.min(stats.plays, 3), 3],
    [
      "Chơi một game Puzzle",
      Math.min(stats.attempts.filter((a) => a.mode === "puzzle").length, 1),
      1,
    ],
    ["Đạt 500 xu từ trò chơi", Math.min(stats.earned, 500), 500],
  ]
    .map(
      ([title, value, max]) =>
        `<div class="mission">${icon("check")}<div class="grow"><b>${title}</b><div class="bar"><span style="width:${(value / max) * 100}%"></span></div><small class="tiny muted">${value}/${max}</small></div><span class="badge gold">${value === max ? "✓ Xong" : "Đang học"}</span></div>`,
    )
    .join(
      "",
    )}</section></aside></div><div class="game-bottom"><section class="preview-game"><div class="preview-header"><span>🏆 Quiz Challenge</span><span class="badge gold">🟡 +20 xu</span></div><div class="preview-inner"><span class="tiny muted">Câu hỏi minh họa</span><h3>Trong kinh tế vi mô, giá tăng thường làm lượng cung thay đổi thế nào?</h3><div class="answer-demo correct">Ⓐ &nbsp; Giá tăng thì lượng cung tăng ✓</div><div class="answer-demo">Ⓑ &nbsp; Giá tăng thì lượng cung giảm</div><div class="answer-demo">Ⓒ &nbsp; Giá không ảnh hưởng lượng cung</div><button class="btn mt" data-action="game-choose" data-id="quiz">Bắt đầu thử thách ${icon("chevron")}</button></div></section><section class="preview-game puzzle"><div class="preview-header"><span>🧩 Puzzle Kiến Thức</span><span class="badge gold">🟡 +30 xu</span></div><div class="preview-inner"><h3>Ghép những mảnh kiến thức của bạn.</h3><div class="puzzle-demo"><div class="puzzle-piece sky">Cung</div><div class="puzzle-piece pink">Cầu</div><div class="puzzle-piece yellow">Giá cả</div><div class="puzzle-piece lavender">Thị trường</div></div><button class="btn" data-action="game-choose" data-id="puzzle">Chơi ghép kiến thức</button></div></section><section class="panel" id="rewards">${panelHead("Đổi quà", "🎁", null, `<button class="link-btn" data-action="redemptions">Lịch sử đổi quà ${icon("chevron")}</button>`)}<div class="tabs">${[
    ["all", "Tất cả"],
    ["souvenir", "Đồ lưu niệm"],
    ["study", "Đồ học tập"],
  ]
    .map(
      ([v, t]) =>
        `<button class="chip ${(state.filters.rewards || "all") === v ? "active" : ""}" data-filter="rewards" data-value="${v}">${t}</button>`,
    )
    .join(
      "",
    )}</div><div class="reward-grid">${rewardsGrid()}</div></section></div>`;
}
function aiPage() {
  return `${pageHeading("AI Học tập", "Một người bạn đồng hành trong hành trình hiểu và ghi nhớ.")}<div class="chat-layout"><aside class="panel chat-tools"><h3 class="mb">Bạn muốn làm gì?</h3>${[
    ["summary", "🔮", "Tóm tắt kiến thức", "lavender"],
    ["solve", "📚", "Tra cứu & giải bài", "sky"],
    ["plan", "🗓️", "Lập kế hoạch học tập", "mint"],
    ["analysis", "📊", "Phân tích tiến độ", "peach"],
  ]
    .map(
      ([v, emoji, t, c]) =>
        `<button class="ai-tile ${c}" data-action="chat-mode" data-id="${v}"><span class="emoji">${emoji}</span><b>${state.chatMode === v ? "✓ " : ""}${t}</b></button>`,
    )
    .join(
      "",
    )}<div class="notice">${state.data.aiMode === "online" ? `Đã cấu hình ${providerName(state.data.aiProvider)}. Khi nhấn gửi, câu hỏi và tài liệu liên quan được gửi tới ${providerName(state.data.aiProvider)} để xử lý.` : "Đang dùng trợ lý tra cứu thư viện. Câu trả lời lấy từ tài liệu có sẵn; chế độ này chưa kết nối mô hình AI trực tuyến."}</div></aside><section class="panel chat-box"><div class="panel-head"><div class="ai-intro"><span class="bot-icon">🤖</span><div><h3>Chào ${e(state.user.name.split(" ").at(-1))}, mình có thể giúp gì?</h3><p class="tiny muted">Cùng học từng chút, hiểu thêm mỗi ngày.</p></div></div><button class="icon-btn" data-action="chat-clear" aria-label="Xóa cuộc trò chuyện">${icon("trash")}</button></div><div class="chat-log">${state.chat.length ? state.chat.map((m) => `<div class="chat-message ${m.role === "user" ? "user" : ""}">${e(m.text)}${m.sources?.map((s) => `<a href="#materials" data-action="material-open" data-id="${s.id}">📚 ${e(s.title)}</a>`).join("") || ""}${m.engine ? `<small>${m.engine === "online" ? providerName(m.provider) + " · AI trực tuyến" : m.engine === "library-fallback" ? aiFailureText(m.aiError) + " · Đã tra cứu thư viện" : "Nguồn: thư viện học tập cá nhân"}</small>` : ""}</div>`).join("") : `<div class="chat-message">Xin chào! Bạn có thể hỏi về cung – cầu, marketing 4P, mục tiêu SMART hoặc nhờ mình gợi ý kế hoạch học tập. ✨</div>`}</div><form class="chat-send" data-form="chat"><textarea name="message" aria-label="Câu hỏi" placeholder="Ví dụ: Tóm tắt kiến thức cung cầu…" maxlength="2000" required></textarea><button class="btn" aria-label="Gửi câu hỏi" ${state.chatPending ? "disabled" : ""}>${state.chatPending ? "Đang trả lời…" : icon("send")}</button></form></section></div>`;
}
function calendarPage() {
  return `${pageHeading("Lịch học & Lịch thi", "Sắp xếp thời gian để học tập chủ động hơn.", `<button class="btn" data-action="schedule-add">${icon("plus")} Thêm lịch</button>`)}<section class="panel"><div class="tabs">${[
    ["all", "Tất cả"],
    ["class", "Lịch học"],
    ["exam", "Lịch thi"],
    ["deadline", "Deadline"],
  ]
    .map(
      ([v, t]) =>
        `<button class="chip ${(state.filters.calendar || "all") === v ? "active" : ""}" data-filter="calendar" data-value="${v}">${t}</button>`,
    )
    .join(
      "",
    )}</div>${calendarWidget(true)}</section><section class="panel mt">${panelHead("Lịch sắp xếp của bạn", "calendar")}<div class="table-wrap"><table><thead><tr><th>Nội dung</th><th>Loại</th><th>Bắt đầu</th><th>Địa điểm</th><th></th></tr></thead><tbody>${state.data.schedules.map((s) => `<tr><td>${e(s.title)}</td><td><span class="badge">${{ class: "Lịch học", exam: "Lịch thi", deadline: "Deadline" }[s.kind]}</span></td><td>${dateLabel(s.start)} · ${timeLabel(s.start)}</td><td>${e(s.location)}</td><td><button class="btn light small" data-action="schedule-open" data-id="${s.id}">Chi tiết</button></td></tr>`).join("")}</tbody></table></div>${!state.data.schedules.length ? empty("Chưa có lịch. Thêm lịch để bắt đầu.") : ""}</section>`;
}
function materialsPage() {
  const f = state.filters.materials || "all",
    query = state.filters.materialSearch || "";
  const list = state.data.materials.filter(
    (m) =>
      (f === "all" || m.type === f) &&
      (!query ||
        (m.title + " " + m.subject)
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  return `${pageHeading("Bài giảng & Tài liệu", "Kiến thức được sắp xếp gọn gàng, luôn sẵn sàng khi bạn cần.", isStaff() ? `<button class="btn" data-action="record-add" data-id="materials">${icon("plus")} Thêm nội dung</button>` : "")}<div class="section-toolbar"><input data-live-filter="materialSearch" value="${e(query)}" placeholder="Tìm theo tên hoặc môn học…" aria-label="Tìm tài liệu"><div class="tabs">${[
    ["all", "Tất cả"],
    ["lesson", "Bài học"],
    ["document", "Tài liệu"],
    ["exam", "Đề tự kiểm tra"],
  ]
    .map(
      ([v, t]) =>
        `<button class="chip ${f === v ? "active" : ""}" data-filter="materials" data-value="${v}">${t}</button>`,
    )
    .join(
      "",
    )}</div></div><div class="content-grid">${list.map((m) => `<article class="content-card"><button class="lesson-thumb" data-action="material-open" data-id="${m.id}"><span class="play">${icon(m.type === "lesson" ? "play" : "book")}</span><small>${m.duration ? m.duration + " phút" : typeNames[m.type]}</small></button><div class="flex between"><span class="badge">${e(m.subject)}</span>${!m.published ? '<span class="badge gold">Bản nháp</span>' : ""}</div><h3>${e(m.title)}</h3><p>${e(m.description)}</p><div class="card-bottom"><button class="btn small" data-action="material-open" data-id="${m.id}">${state.data.progress.some((p) => p.material_id === m.id && p.done) ? "✓ Xem lại" : "Mở nội dung"}</button><a class="btn outline small" href="/api/materials/${m.id}/download">${icon("download")} Tải TXT</a>${canManage(m) && isStaff() ? `<button class="icon-btn" data-action="record-edit" data-id="${m.id}" aria-label="Sửa nội dung">${icon("edit")}</button><button class="icon-btn" data-action="record-delete" data-id="${m.id}" aria-label="Xóa nội dung">${icon("trash")}</button>` : ""}</div></article>`).join("")}</div>${!list.length ? empty("Không tìm thấy nội dung phù hợp.") : ""}`;
}
function groupsPage() {
  const query = state.filters.groupSearch || "",
    list = state.data.groups.filter((g) =>
      (g.title + " " + g.subject).toLowerCase().includes(query.toLowerCase()),
    );
  return `${pageHeading("Hội nhóm học tập", "Kết nối, chia sẻ và cùng nhau tiến bộ.", `<button class="btn" data-action="record-add" data-id="groups">${icon("plus")} Tạo nhóm</button>`)}<div class="section-toolbar"><input data-live-filter="groupSearch" value="${e(query)}" placeholder="Tìm nhóm theo môn học…" aria-label="Tìm nhóm"></div><div class="content-grid">${list.map((g) => `<article class="content-card"><div class="card-emoji">${e(g.icon || "📚")}</div><span class="badge">${e(g.subject)}</span><h3>${e(g.title)}</h3><p>${e(g.description)}</p><small class="muted">${number(g.members)} thành viên</small><div class="card-bottom"><button class="btn small" data-action="${g.joined ? "group-open" : "group-join"}" data-id="${g.id}">${g.joined ? "Mở thảo luận" : "Tham gia nhóm"}</button>${g.joined && g.owner !== state.user.id ? `<button class="btn outline small" data-action="group-leave" data-id="${g.id}">Rời nhóm</button>` : ""}${canManage(g) ? `<button class="icon-btn" data-action="record-edit" data-id="${g.id}" aria-label="Sửa nhóm">${icon("edit")}</button><button class="icon-btn" data-action="record-delete" data-id="${g.id}" aria-label="Xóa nhóm">${icon("trash")}</button>` : ""}</div></article>`).join("")}</div>${!list.length ? empty("Chưa tìm thấy nhóm phù hợp.") : ""}`;
}
function gradesPage() {
  return `${pageHeading("Tính điểm học phần", "Biết rõ kết quả và chủ động đặt mục tiêu cho kỳ học.")}<div class="two-column"><section class="panel">${panelHead("Nhập điểm môn học", "calc")}${gradeForm()}<div class="notice mt">Kết quả là tổng điểm nhân trọng số. Quy đổi tham khảo: A ≥ 8,5; B ≥ 7,0; C ≥ 5,5; D ≥ 4,0. Hãy đối chiếu quy chế trường bạn.</div></section><section class="panel">${panelHead("Kết quả đã lưu", "chart")}${state.data.grades.length ? `<div class="table-wrap"><table><thead><tr><th>Môn học</th><th>Điểm</th><th>Ngày lưu</th><th></th></tr></thead><tbody>${state.data.grades.map((g) => `<tr><td>${e(g.subject)}</td><td><b>${number(g.result)} (${letterGrade(g.result)})</b></td><td>${dateLabel(g.created)}</td><td><button class="icon-btn" data-action="grade-delete" data-id="${g.id}" aria-label="Xóa kết quả">${icon("trash")}</button></td></tr>`).join("")}</tbody></table></div>` : empty("Chưa có kết quả. Nhập điểm và bấm Tính & lưu.")}</section></div>`;
}
const letterGrade = (n) =>
  n >= 8.5 ? "A" : n >= 7 ? "B" : n >= 5.5 ? "C" : n >= 4 ? "D" : "F";
function eventsPage() {
  const f = state.filters.events || "all",
    list = state.data.events.filter((v) => f === "all" || v.category === f);
  return `${pageHeading("Sự kiện sinh viên", "Mở rộng trải nghiệm, tìm thêm những cơ hội mới.", isStaff() ? `<button class="btn" data-action="record-add" data-id="events">${icon("plus")} Thêm sự kiện</button>` : "")}<div class="tabs">${["all", "Học thuật", "Kỹ năng", "Tình nguyện", "Văn hóa"].map((v) => `<button class="chip ${f === v ? "active" : ""}" data-filter="events" data-value="${v}">${v === "all" ? "Tất cả" : v}</button>`).join("")}</div><div class="content-grid">${list.map((v) => `<article class="content-card"><div class="card-emoji">${e(v.icon || "🎉")}</div><span class="badge">${e(v.category)}</span><h3>${e(v.title)}</h3><p>${e(v.description)}</p><div class="small muted">📅 ${dateLabel(v.date)} · ${timeLabel(v.date)}<br>📍 ${e(v.location)}<br>👥 ${v.attendees}/${v.capacity} người đăng ký</div><div class="card-bottom"><button class="btn small ${v.registered ? "light" : ""}" data-action="event-open" data-id="${v.id}">${v.registered ? "✓ Đã đăng ký" : "Xem & đăng ký"}</button>${canManage(v) && isStaff() ? `<button class="icon-btn" data-action="record-edit" data-id="${v.id}" aria-label="Sửa sự kiện">${icon("edit")}</button><button class="icon-btn" data-action="record-delete" data-id="${v.id}" aria-label="Xóa sự kiện">${icon("trash")}</button>` : ""}</div></article>`).join("")}</div>${!list.length ? empty("Chưa có sự kiện trong danh mục này.") : ""}`;
}
function teachersPage() {
  const query = state.filters.teacherSearch || "",
    list = state.data.teachers.filter((t) =>
      (t.name + " " + t.subject).toLowerCase().includes(query.toLowerCase()),
    );
  return `${pageHeading("Giảng viên uy tín", "Tìm người đồng hành phù hợp với môn học của bạn.")}<div class="section-toolbar"><input data-live-filter="teacherSearch" value="${e(query)}" placeholder="Tìm tên hoặc môn học…" aria-label="Tìm giảng viên"></div><div class="content-grid">${list.map((t) => `<article class="content-card"><div class="flex">${avatar(t.name, false, true)}<div><h3>${e(t.name)}</h3><span class="tiny muted">${e(t.subject)}</span></div></div><p>${e(t.bio)}</p><span class="badge gold">⭐ ${t.rating.avg || "Chưa có đánh giá"} · ${t.rating.n} đánh giá</span><button class="btn outline" data-action="teacher-open" data-id="${t.id}">Xem hồ sơ</button></article>`).join("")}</div>${!list.length ? empty("Không tìm thấy giảng viên phù hợp.") : ""}`;
}
function tasksPage() {
  const done = state.data.tasks.filter((t) => t.done).length;
  return `${pageHeading("To do list", "Những bước nhỏ mỗi ngày tạo nên một hành trình lớn.")}<div class="two-column"><section class="panel page-tasks">${taskEntry()}${tasksList()}</section><section class="panel"><div class="text-center"><div class="card-emoji">🌱</div><h2>Bạn đang tiến bộ!</h2><p class="muted mt">Đã hoàn thành ${done}/${state.data.tasks.length} công việc.</p><div class="bar mt"><span style="width:${state.data.tasks.length ? (done / state.data.tasks.length) * 100 : 0}%"></span></div><p class="small muted mt">Chọn một việc quan trọng, tập trung 25 phút rồi dành 5 phút nghỉ ngơi.</p></div><button class="btn light w-full mt" data-nav="calendar">${icon("calendar")} Sắp xếp lịch học</button></section></div>`;
}
function statsPage() {
  const d = state.data,
    total = d.stats.activity.reduce((s, a) => s + a.seconds, 0),
    avg = d.grades.length
      ? d.grades.reduce((s, g) => s + g.result, 0) / d.grades.length
      : 0;
  return `${pageHeading("Thống kê cá nhân", "Theo dõi những gì bạn đã làm và nhìn thấy sự tiến bộ.")}<div class="stats-grid">${[
    [
      "check",
      "Công việc hoàn thành",
      d.tasks.filter((t) => t.done).length + "/" + d.tasks.length,
    ],
    ["trophy", "Lượt chơi đã hoàn thành", d.stats.plays],
    ["clock", "Thời gian 7 ngày", Math.floor(total / 60) + " phút"],
    [
      "calc",
      "Điểm trung bình đã lưu",
      avg ? number(Math.round(avg * 100) / 100) : "—",
    ],
  ]
    .map(
      ([i, t, v]) =>
        `<section class="panel stat-card">${icon(i)}<p class="small muted mt">${t}</p><strong>${v}</strong></section>`,
    )
    .join(
      "",
    )}</div><div class="two-column"><section class="panel">${panelHead("Thời gian hoạt động trên website", "chart")}<div class="activity-chart">${Array.from(
    { length: 7 },
    (_, i) => {
      const date = new Date(d.today + "T12:00:00");
      date.setDate(date.getDate() - 6 + i);
      const v =
        d.stats.activity.find((a) => a.day === localDate(date))?.seconds || 0;
      const max = Math.max(60, ...d.stats.activity.map((a) => a.seconds));
      return `<div class="chart-column"><b>${Math.floor(v / 60)}p</b><div class="chart-bar" style="height:${Math.max(2, (v / max) * 85)}%"></div><small>${date.getDate()}/${date.getMonth() + 1}</small></div>`;
    },
  ).join(
    "",
  )}</div><p class="tiny muted">Thời gian chỉ được ghi khi bạn đang xem website. Tổng hợp 7 ngày theo giờ Việt Nam.</p></section><section class="panel">${panelHead("Lịch sử xu", "trophy")}${
    d.stats.ledger.length
      ? `<div class="table-wrap"><table><tbody>${d.stats.ledger
          .slice(0, 10)
          .map(
            (l) =>
              `<tr><td>${e(l.reason)}<br><small class="muted">${dateLabel(l.created)}</small></td><td class="${l.amount > 0 ? "status" : ""}"><b>${l.amount > 0 ? "+" : ""}${number(l.amount)} xu</b></td></tr>`,
          )
          .join("")}</tbody></table></div>`
      : empty("Chơi game để bắt đầu tích lũy xu.")
  }</section></div><section class="panel mt">${panelHead("Lịch sử trò chơi", "game")}${d.stats.attempts.length ? `<div class="table-wrap"><table><thead><tr><th>Trò chơi</th><th>Điểm</th><th>Xu nhận</th><th>Ngày</th></tr></thead><tbody>${d.stats.attempts.map((a) => `<tr><td>${d.games.find((g) => g.id === a.mode)?.name}</td><td>${a.score}/5</td><td>${a.reward} xu</td><td>${dateLabel(a.finished)}</td></tr>`).join("")}</tbody></table></div>` : empty("Bạn chưa hoàn thành lượt chơi nào.")}</section>`;
}
function settingsPage() {
  const u = state.user;
  return `${pageHeading("Cài đặt", "Không gian học tập theo cách của bạn.")}<div class="two-column"><section class="panel">${panelHead("Thông tin tài khoản", "users")}<form data-form="profile"><label class="field">Họ và tên<input name="name" value="${e(u.name)}" minlength="2" maxlength="80" required></label><label class="field">Email<input value="${e(u.email)}" disabled></label><div class="form-row"><label class="field">Vai trò<input value="${roleNames[u.role]}" disabled></label><label class="field">Năm học<select name="year">${[1, 2, 3, 4, 5, 6].map((v) => `<option value="${v}" ${(u.settings.year || 2) === v ? "selected" : ""}>Năm ${v}</option>`).join("")}</select></label></div><label class="field">Môn học quan tâm / giảng dạy<select name="subject">${options(subjects, u.settings.subject || subjects[0])}</select></label><label class="field">Giới thiệu<textarea name="bio" maxlength="1000">${e(u.settings.bio || "")}</textarea></label><label class="flex small mb"><input name="notifications" type="checkbox" ${u.settings.notifications !== false ? "checked" : ""}> Hiển thị thông báo học tập</label><button class="btn" type="submit">Lưu thông tin</button></form></section><div class="stack"><section class="panel">${panelHead("Đổi mật khẩu", "shield")}<form data-form="password"><label class="field">Mật khẩu hiện tại<input type="password" name="current" autocomplete="current-password" maxlength="128" required></label><label class="field">Mật khẩu mới<input type="password" name="password" autocomplete="new-password" minlength="12" maxlength="128" required></label><label class="field">Nhập lại mật khẩu mới<input type="password" name="confirm" autocomplete="new-password" minlength="12" maxlength="128" required></label><p class="tiny muted mb">Đổi mật khẩu sẽ đăng xuất các phiên khác.</p><button class="btn" type="submit">Cập nhật mật khẩu</button></form></section><section class="panel danger-zone"><h3>Kết thúc phiên làm việc</h3><p class="small muted mt">Đăng xuất khi bạn sử dụng máy tính dùng chung.</p><button class="btn danger mt" data-action="logout">${icon("logout")} Đăng xuất</button></section></div></div>`;
}
function searchPage() {
  const query = state.query.toLowerCase(),
    matches = [
      ...state.data.materials
        .filter((m) => (m.title + " " + m.body).toLowerCase().includes(query))
        .map((m) => ({
          title: m.title,
          desc: m.subject,
          action: "material-open",
          id: m.id,
          emoji: "📚",
        })),
      ...state.data.groups
        .filter((g) => g.title.toLowerCase().includes(query))
        .map((g) => ({
          title: g.title,
          desc: g.description,
          nav: "groups",
          emoji: "👥",
        })),
      ...state.data.teachers
        .filter((t) => (t.name + " " + t.subject).toLowerCase().includes(query))
        .map((t) => ({
          title: t.name,
          desc: t.subject,
          action: "teacher-open",
          id: t.id,
          emoji: "🎓",
        })),
      ...state.data.events
        .filter((v) => v.title.toLowerCase().includes(query))
        .map((v) => ({
          title: v.title,
          desc: v.location,
          action: "event-open",
          id: v.id,
          emoji: "🎉",
        })),
    ];
  return `${pageHeading("Kết quả tìm kiếm", "“" + state.query + "” · " + matches.length + " kết quả")}<div class="content-grid">${matches.map((m) => `<article class="content-card"><span class="card-emoji">${m.emoji}</span><h3>${e(m.title)}</h3><p>${e(m.desc)}</p><button class="btn light small" ${m.nav ? `data-nav="${m.nav}"` : `data-action="${m.action}" data-id="${m.id}"`}>Xem chi tiết</button></article>`).join("")}</div>${!matches.length ? empty("Không tìm thấy kết quả. Hãy thử từ khóa khác.") : ""}`;
}
function adminPage() {
  const a = state.admin;
  if (!a) return `<section class="panel">Đang tải bảng quản trị…</section>`;
  return `${pageHeading("Quản trị hệ thống", "Quản lý tài khoản, quyền truy cập và các yêu cầu đổi quà.")}<div class="stats-grid">${[
    ["users", "Tài khoản", a.counts.users],
    ["book", "Nội dung học tập", a.counts.materials],
    ["game", "Lượt chơi", a.counts.plays],
    [
      "trophy",
      "Yêu cầu chờ xử lý",
      a.redemptions.filter((r) => r.status === "pending").length,
    ],
  ]
    .map(
      ([i, t, v]) =>
        `<section class="panel stat-card">${icon(i)}<p class="small muted mt">${t}</p><strong>${v}</strong></section>`,
    )
    .join(
      "",
    )}</div><section class="panel">${panelHead("Tài khoản & phân quyền", "shield")}<div class="table-wrap"><table><thead><tr><th>Người dùng</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th></th></tr></thead><tbody>${a.users.map((u) => `<tr><td>${e(u.name)}</td><td>${e(u.email)}</td><td><select aria-label="Vai trò của ${e(u.name)}" id="role-${u.id}" ${u.id === state.user.id ? "disabled" : ""}>${["student", "teacher", "admin"].map((v) => `<option value="${v}" ${v === u.role ? "selected" : ""}>${roleNames[v]}</option>`).join("")}</select></td><td><select aria-label="Trạng thái của ${e(u.name)}" id="active-${u.id}" ${u.id === state.user.id ? "disabled" : ""}><option value="1" ${u.active ? "selected" : ""}>Hoạt động</option><option value="0" ${!u.active ? "selected" : ""}>Đã khóa</option></select></td><td><button class="btn small" data-action="user-save" data-id="${u.id}" ${u.id === state.user.id ? "disabled" : ""}>Lưu quyền</button></td></tr>`).join("")}</tbody></table></div></section><section class="panel mt">${panelHead("Yêu cầu đổi quà", "trophy")}<div class="table-wrap"><table><thead><tr><th>Sinh viên</th><th>Món quà</th><th>Xu</th><th>Trạng thái</th><th>Xử lý</th></tr></thead><tbody>${a.redemptions.map((r) => `<tr><td>${e(r.name)}</td><td>${e(r.title)}</td><td>${r.cost}</td><td>${{ pending: "Chờ trao quà", completed: "Đã trao", cancelled: "Đã hủy & hoàn xu" }[r.status]}</td><td>${r.status === "pending" ? `<button class="btn light small" data-action="redemption-complete" data-id="${r.id}">Đã trao</button> <button class="btn danger small" data-action="redemption-cancel" data-id="${r.id}">Hủy</button>` : "—"}</td></tr>`).join("")}</tbody></table></div>${!a.redemptions.length ? empty("Chưa có yêu cầu đổi quà.") : ""}</section><section class="panel mt">${panelHead("Thông báo toàn hệ thống", "bell")}<form class="task-entry" data-form="announcement"><input name="title" maxlength="300" placeholder="Nhập thông báo cho người dùng…" required><button class="btn">Gửi thông báo</button></form></section><section class="panel mt">${panelHead("Nhật ký quản trị", "shield")}<div class="table-wrap"><table><thead><tr><th>Thời gian</th><th>Tài khoản</th><th>Thao tác</th><th>Đối tượng</th></tr></thead><tbody>${a.audit.map((l) => `<tr><td>${dateLabel(l.created)} ${new Date(l.created).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td><td>${e(l.name || "Hệ thống")}</td><td>${e(l.action)}</td><td class="tiny muted">${e(l.target)}</td></tr>`).join("")}</tbody></table></div></section>`;
}

const adminOverview = adminPage;
adminPage = function () {
  return (
    adminOverview() +
    `<section class="panel mt">${panelHead("Cửa hàng quà & tồn kho", "trophy", null, `<button class="btn small" data-action="reward-edit">${icon("plus")} Thêm quà</button>`)}<div class="table-wrap"><table><thead><tr><th>Quà</th><th>Giá xu</th><th>Tồn kho</th><th></th></tr></thead><tbody>${state.data.rewards.map((r) => `<tr><td>${e(r.icon)} ${e(r.title)}</td><td>${number(r.cost)}</td><td>${r.stock}</td><td><button class="btn light small" data-action="reward-edit" data-id="${r.id}">Sửa</button></td></tr>`).join("")}</tbody></table></div></section>`
  );
};
function rewardForm(r = {}) {
  openModal(
    r.id ? "Sửa món quà" : "Thêm món quà",
    `<form data-form="reward"><input type="hidden" name="id" value="${r.id || ""}"><label class="field">Tên quà<input name="title" maxlength="100" value="${e(r.title || "")}" required></label><div class="form-row"><label class="field">Biểu tượng<input name="icon" maxlength="8" value="${e(r.icon || "🎁")}" required></label><label class="field">Danh mục<select name="category"><option value="study" ${r.category === "study" ? "selected" : ""}>Đồ học tập</option><option value="souvenir" ${r.category === "souvenir" ? "selected" : ""}>Đồ lưu niệm</option></select></label></div><div class="form-row"><label class="field">Giá xu<input name="cost" type="number" min="1" max="100000" value="${r.cost || 300}" required></label><label class="field">Tồn kho<input name="stock" type="number" min="0" max="100000" value="${r.stock ?? 20}" required></label></div><div class="notice">Đặt tồn kho bằng 0 để tạm dừng đổi quà. Lịch sử giao dịch vẫn được giữ.</div><div class="modal-footer"><button class="btn">Lưu món quà</button></div></form>`,
  );
}
function openModal(title, content, wide = false) {
  modalReturnFocus = document.activeElement;
  $("#modal-root").innerHTML =
    `<div class="modal-backdrop"><section class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><h2 id="modal-title">${e(title)}</h2><button class="icon-btn" data-action="modal-close" aria-label="Đóng cửa sổ">${icon("close")}</button></div>${content}</section></div>`;
  document.body.classList.add("modal-open");
  setTimeout(
    () =>
      $(
        ".modal input:not([type=hidden]),.modal textarea,.modal button:not(.icon-btn)",
      )?.focus(),
    20,
  );
}
function closeModal() {
  clearInterval(gameTimer);
  if (state.game && !state.game.result && state.user)
    api("/api/games/abandon", {
      method: "POST",
      body: { id: state.game.id },
    }).catch(() => {});
  state.game = null;
  $("#modal-root").innerHTML = "";
  document.body.classList.remove("modal-open");
  modalReturnFocus?.focus?.();
}
function confirmModal(title, message, action, rid) {
  openModal(
    title,
    `<p class="muted">${e(message)}</p><div class="modal-footer"><button class="btn outline" data-action="modal-close">Quay lại</button><button class="btn danger" data-action="${action}" data-id="${e(rid)}">Xác nhận</button></div>`,
  );
}
function scheduleForm(s = {}) {
  const date = state.data.today;
  openModal(
    s.id ? "Sửa lịch học" : "Thêm lịch mới",
    `<form data-form="schedule"><input type="hidden" name="id" value="${s.id || ""}"><label class="field">Tiêu đề<input name="title" value="${e(s.title || "")}" maxlength="200" required></label><label class="field">Loại lịch<select name="kind">${[
      ["class", "Lịch học"],
      ["exam", "Lịch thi"],
      ["deadline", "Deadline"],
    ]
      .map(
        ([v, t]) =>
          `<option value="${v}" ${s.kind === v ? "selected" : ""}>${t}</option>`,
      )
      .join(
        "",
      )}</select></label><div class="form-row"><label class="field">Bắt đầu<input type="datetime-local" name="start" value="${e(s.start || date + "T09:00")}" required></label><label class="field">Kết thúc<input type="datetime-local" name="end" value="${e(s.end || date + "T10:30")}" required></label></div><label class="field">Địa điểm<input name="location" maxlength="100" value="${e(s.location || "")}" placeholder="Phòng học hoặc liên kết lớp"></label><div class="modal-footer"><button class="btn" type="submit">Lưu lịch</button></div></form>`,
  );
}
function recordForm(section, r = {}) {
  const title = {
    materials: "nội dung học tập",
    groups: "nhóm học tập",
    events: "sự kiện",
  }[section];
  openModal(
    (r.id ? "Sửa " : "Thêm ") + title,
    `<form data-form="record"><input type="hidden" name="id" value="${r.id || ""}"><input type="hidden" name="section" value="${section}"><label class="field">Tiêu đề<input name="title" maxlength="200" value="${e(r.title || "")}" required></label><label class="field">Mô tả<textarea name="description" maxlength="1000" required>${e(r.description || "")}</textarea></label><label class="field">Môn học<select name="subject">${options([...subjects, "Tổng hợp", "Tin học"], r.subject)}</select></label>${
      section === "materials"
        ? `<div class="form-row"><label class="field">Loại nội dung<select name="type">${Object.entries(
            typeNames,
          )
            .map(
              ([v, t]) =>
                `<option value="${v}" ${r.type === v ? "selected" : ""}>${t}</option>`,
            )
            .join(
              "",
            )}</select></label><label class="field">Thời lượng (phút)<input name="duration" type="number" min="0" max="240" value="${r.duration || 0}"></label></div><label class="field">Video YouTube (tùy chọn)<input name="videoUrl" type="url" maxlength="300" value="${r.videoId ? "https://www.youtube.com/watch?v=" + e(r.videoId) : ""}" placeholder="https://www.youtube.com/watch?v=…"></label><label class="field">Nội dung bài học / tài liệu<textarea name="body" maxlength="30000" rows="9" required>${e(r.body || "")}</textarea></label><label class="flex small"><input name="published" type="checkbox" ${r.published !== false ? "checked" : ""}> Công khai cho sinh viên</label>`
        : ""
    }${section === "events" ? `<div class="form-row"><label class="field">Ngày và giờ<input name="date" type="datetime-local" value="${e(r.date || state.data.today + "T09:00")}" required></label><label class="field">Danh mục<select name="category">${options(["Học thuật", "Kỹ năng", "Tình nguyện", "Văn hóa"], r.category)}</select></label></div><div class="form-row"><label class="field">Địa điểm<input name="location" maxlength="100" value="${e(r.location || "")}" required></label><label class="field">Sức chứa<input name="capacity" type="number" min="1" max="10000" value="${r.capacity || 100}" required></label></div>` : ""}<div class="modal-footer"><button class="btn" type="submit">Lưu ${title}</button></div></form>`,
    section === "materials",
  );
}
function materialModal(rid) {
  const m = state.data.materials.find((m) => m.id === rid);
  if (!m) return toast("Không tìm thấy tài liệu.", true);
  openModal(
    m.title,
    `<div class="lesson-cover"></div><div class="flex mb"><span class="badge">${e(m.subject)}</span><span class="badge gold">${typeNames[m.type]}</span>${m.duration ? `<span class="tiny muted">${m.duration} phút</span>` : ""}</div>${m.videoId ? `<div id="lesson-video"><button class="btn light w-full mb" data-action="video-play" data-id="${m.id}">${icon("play")} Xem video bài giảng (YouTube)</button></div>` : ""}<article>${e(m.body)}</article><div class="modal-footer"><a class="btn outline" href="/api/materials/${m.id}/download">${icon("download")} Tải tài liệu TXT</a><button class="btn" data-action="material-complete" data-id="${m.id}">${state.data.progress.some((p) => p.material_id === m.id && p.done) ? "✓ Đã hoàn thành" : "Đánh dấu đã học"}</button></div>`,
    true,
  );
}
async function groupModal(rid) {
  const g = state.data.groups.find((g) => g.id === rid);
  if (!g) return;
  const result = await api(`/api/groups/${rid}/posts`);
  openModal(
    g.title,
    `<p class="small muted mb">${e(g.description)} · ${g.members} thành viên</p><div class="group-posts">${result.posts.map((p) => `<div class="post-item"><div class="flex between"><b>${e(p.name)}</b>${p.user_id === state.user.id || state.user.role === "admin" ? `<button class="icon-btn" data-action="post-delete" data-id="${p.id}" data-group="${rid}" aria-label="Xóa bài viết">${icon("trash")}</button>` : ""}</div><small>${dateLabel(p.created)}</small><p>${e(p.body)}</p></div>`).join("") || empty("Chưa có thảo luận. Chia sẻ câu hỏi đầu tiên nhé!")}</div><form data-form="post" class="mt"><input type="hidden" name="group" value="${rid}"><textarea name="body" maxlength="2000" placeholder="Chia sẻ câu hỏi hoặc kiến thức với nhóm…" required></textarea><div class="modal-footer"><button class="btn">${icon("send")} Gửi thảo luận</button></div></form>`,
    true,
  );
}
function eventModal(rid) {
  const v = state.data.events.find((v) => v.id === rid);
  if (!v) return;
  openModal(
    v.title,
    `<div class="card-emoji text-center">${e(v.icon || "🎉")}</div><span class="badge">${e(v.category)}</span><p class="mt">${e(v.description)}</p><p class="muted small mt">📅 ${dateLabel(v.date)} · ${timeLabel(v.date)}<br>📍 ${e(v.location)}<br>👥 ${v.attendees}/${v.capacity} người đã đăng ký</p><div class="modal-footer"><button class="btn ${v.registered ? "outline" : ""}" data-action="event-toggle" data-id="${v.id}">${v.registered ? "Hủy đăng ký" : "Đăng ký tham gia"}</button></div>`,
  );
}
function teacherModal(rid) {
  const t = state.data.teachers.find((t) => t.id === rid);
  if (!t) return;
  openModal(
    t.name,
    `<div class="flex mb">${avatar(t.name, false, true)}<div><span class="badge">${e(t.subject)}</span><p class="small muted">⭐ ${t.rating.avg || "Chưa có đánh giá"} · ${t.rating.n} đánh giá</p></div></div><p>${e(t.bio)}</p>${state.user.role === "student" ? `<form data-form="rating" class="mt"><input type="hidden" name="id" value="${t.id}"><label class="field">Đánh giá của bạn<select name="value">${[5, 4, 3, 2, 1].map((v) => `<option value="${v}" ${t.myRating === v ? "selected" : ""}>${"⭐".repeat(v)} (${v}/5)</option>`).join("")}</select></label><button class="btn">Lưu đánh giá</button></form>` : ""}`,
  );
}
function chooseGame(mode) {
  const g = state.data.games.find((g) => g.id === mode);
  if (!g) return;
  openModal(
    g.name,
    `<div class="text-center"><div class="card-emoji">${g.icon}</div><p>${g.description}</p></div><div class="notice mt">5 câu mỗi lượt · Đáp án được máy chủ chấm.<br>Trả lời đúng nhận 10 xu/câu, mỗi chế độ thưởng một lần/ngày.${mode === "speed" ? "<br>Giới hạn 90 giây." : mode === "race" ? "<br>Giới hạn 3 phút." : ""}</div><form data-form="game-start" class="mt"><input type="hidden" name="mode" value="${mode}"><label class="field">Chọn môn học<select name="subject">${options(subjects)}</select></label><button class="btn w-full">Bắt đầu chơi ${icon("chevron")}</button></form>`,
  );
}
function renderGame() {
  const g = state.game;
  if (!g) return;
  const q = g.questions[g.index],
    modeInfo = state.data.games.find((m) => m.id === g.mode);
  const selected = g.answers[g.index];
  openModal(
    modeInfo.name,
    `<div class="flex between"><span class="badge">Câu ${g.index + 1}/${g.questions.length} · ${e(q.subject)}</span><span class="timer" id="game-timer">${icon("clock")} <b></b></span></div><div class="bar mt"><span style="width:${(g.index / g.questions.length) * 100}%"></span></div>${g.mode === "race" ? `<div class="race-track"><span class="race-car" style="left:${(g.index / 5) * 78}%">🏎️</span><span class="race-flag">🏁</span></div>` : ""}<section class="quiz-stage">${g.mode === "flashcard" ? `<button class="flashcard w-full" data-action="flash-flip">${e(g.flipped ? q.card : q.prompt)}<small class="muted tiny">${g.flipped ? "Đọc gợi ý rồi chọn đáp án bên dưới." : "Nhấp để lật thẻ và ôn kiến thức."}</small></button>` : `<h3 class="quiz-question">${e(q.prompt)}</h3>`}${g.mode === "crossword" ? `<p class="text-center tiny muted">Gợi ý: ${q.hint} chữ cái · Có thể nhập có dấu hoặc không dấu.</p><input id="crossword-answer" class="crossword-input" aria-label="Đáp án ô chữ" maxlength="100" value="${e(typeof selected === "string" ? selected : "")}">` : `${g.mode === "puzzle" ? `<div class="puzzle-target" id="puzzle-target">${selected !== undefined && selected >= 0 ? e(q.options[selected]) : "Kéo mảnh đáp án vào đây hoặc nhấp để chọn."}</div>` : ""}<div class="quiz-options">${q.options.map((option, i) => `<button class="quiz-option ${selected === i ? "selected" : ""}" data-action="game-answer" data-id="${i}" ${g.mode === "puzzle" ? `draggable="true" data-piece="${i}"` : ""}><span class="letter">${String.fromCharCode(65 + i)}</span>${e(option)}</button>`).join("")}</div>`}</section><div class="modal-footer"><button class="btn outline" data-action="game-prev" ${g.index === 0 ? "disabled" : ""}>${icon("back")} Câu trước</button><button class="btn" data-action="game-next">${g.index === g.questions.length - 1 ? "Nộp bài" : "Câu tiếp theo"} ${icon("chevron")}</button></div>`,
    true,
  );
  updateTimer();
}
function updateTimer() {
  if (!state.game) return;
  const remaining = Math.max(
    0,
    Math.ceil((state.game.started + state.game.limit - Date.now()) / 1000),
  );
  const el = $("#game-timer b");
  if (el) {
    el.textContent = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
    $("#game-timer").classList.toggle("urgent", remaining < 20);
  }
  if (!remaining && !state.game.submitting) submitGame(true);
}
function storeCurrentAnswer() {
  if (state.game?.mode === "crossword")
    state.game.answers[state.game.index] = $("#crossword-answer")?.value || "";
}
async function submitGame(timedOut = false) {
  const g = state.game;
  if (!g || g.submitting) return;
  storeCurrentAnswer();
  if (
    !timedOut &&
    g.answers.some((v) => v === null || v === undefined || v === "")
  )
    return toast("Hãy trả lời đủ các câu trước khi nộp bài.", true);
  g.submitting = true;
  clearInterval(gameTimer);
  try {
    const answers = g.questions.map(
      (_, i) => g.answers[i] ?? (g.mode === "crossword" ? "" : -1),
    );
    const result = await api("/api/games/submit", {
      method: "POST",
      body: { id: g.id, answers },
    });
    g.result = result;
    await refresh();
    render();
    openModal(
      "Kết quả học tập",
      `<div class="result-score"><span class="emoji">${result.score >= 4 ? "🏆" : result.score >= 2 ? "🌟" : "🌱"}</span><h2>${result.score}/${result.total} câu đúng</h2><p class="muted">${result.score >= 4 ? "Tuyệt vời! Bạn đã nắm kiến thức rất tốt." : "Mỗi lần luyện tập là một bước tiến mới."}</p><span class="badge gold mt">🟡 +${result.reward} xu · ${result.reward ? "Đã cập nhật tài khoản" : "Luyện tập để nhớ lâu hơn"}</span>${result.expired ? '<p class="small muted mt">Lượt chơi đã hết thời gian.</p>' : ""}</div>${result.results.map((r, i) => `<div class="result-detail ${r.correct ? "correct" : "wrong"}"><b>${r.correct ? "✓" : "✕"} Câu ${i + 1}: ${e(r.answer)}</b><p>${e(r.explanation)}</p></div>`).join("")}<div class="modal-footer"><button class="btn" data-action="modal-close">Hoàn thành</button></div>`,
      true,
    );
  } catch (err) {
    g.submitting = false;
    toast(err.message, true);
  }
}
async function chatSend(message) {
  if (state.chatPending) return;
  const conversation = state.chat;
  const userId = state.user.id;
  state.chatPending = true;
  conversation.push({ role: "user", text: message });
  render();
  $(".chat-log")?.scrollTo(0, 999999);
  try {
    const result = await api("/api/assistant", {
      method: "POST",
      body: { message, mode: state.chatMode },
    });
    if (state.chat !== conversation || state.user?.id !== userId) return;
    conversation.push({
      role: "assistant",
      text: result.answer,
      sources: result.sources,
      engine: result.engine,
      provider: result.provider,
      aiError: result.aiError,
    });
  } catch (error) {
    if (state.chat === conversation && state.user?.id === userId) throw error;
  } finally {
    if (state.chat === conversation && state.user?.id === userId) {
      state.chatPending = false;
      if (state.route === "ai") {
        render();
        $(".chat-log")?.scrollTo(0, 999999);
      }
    }
  }
}
async function loadAdmin() {
  if (state.user.role === "admin") state.admin = await api("/api/admin");
}

document.addEventListener("click", async (event) => {
  const element = event.target.closest(
    "[data-nav],[data-action],[data-filter]",
  );
  if (!element) return;
  if (element.tagName === "A") event.preventDefault();
  if (element.dataset.nav) {
    navigate(element.dataset.nav);
    $(".sidebar")?.classList.remove("open");
    $(".mobile-overlay")?.classList.remove("visible");
    return;
  }
  if (element.dataset.filter) {
    state.filters[element.dataset.filter] = element.dataset.value;
    render();
    return;
  }
  const action = element.dataset.action,
    rid = element.dataset.id;
  try {
    if (action === "auth-switch") {
      state.authMode = state.authMode === "login" ? "register" : "login";
      renderAuth();
    } else if (action === "menu") {
      $(".sidebar")?.classList.toggle("open");
      $(".mobile-overlay")?.classList.toggle("visible");
    } else if (action === "modal-close") closeModal();
    else if (action === "logout") {
      await api("/api/logout", { method: "POST", body: {} });
      state.user = null;
      state.data = null;
      state.chat = [];
      state.chatPending = false;
      state.admin = null;
      const session = await api("/api/session");
      state.csrf = session.csrf;
      closeModal();
      render();
    } else if (action === "notifications") {
      openModal(
        "Thông báo của bạn",
        state.data.notifications
          .map(
            (n) =>
              `<div class="notification-item ${n.seen ? "" : "unread"}">${icon("bell")}<div><p>${e(n.title)}</p><small>${dateLabel(n.created)}</small></div></div>`,
          )
          .join("") || empty("Chưa có thông báo."),
      );
      await api("/api/notifications/read", { method: "POST", body: {} });
      await refresh();
      render();
    } else if (action === "task-delete") {
      confirmModal(
        "Xóa công việc",
        "Công việc này sẽ được xóa khỏi danh sách.",
        "task-delete-confirm",
        rid,
      );
    } else if (action === "task-delete-confirm") {
      await mutate(
        "/api/tasks/" + rid,
        "DELETE",
        undefined,
        "Đã xóa công việc.",
      );
      closeModal();
    } else if (action === "task-edit") {
      const t = state.data.tasks.find((t) => t.id === rid);
      openModal(
        "Sửa công việc",
        `<form data-form="task-edit"><input type="hidden" name="id" value="${t.id}"><label class="field">Nội dung<input name="title" value="${e(t.title)}" maxlength="200" required></label><button class="btn">Lưu công việc</button></form>`,
      );
    } else if (action === "schedule-add") scheduleForm();
    else if (action === "schedule-open") {
      const s = state.data.schedules.find((s) => s.id === rid);
      openModal(
        s.title,
        `<p class="muted">${dateLabel(s.start)}<br>${timeLabel(s.start)} – ${timeLabel(s.end)}<br>📍 ${e(s.location || "Chưa có địa điểm")}</p><div class="modal-footer"><button class="btn danger" data-action="schedule-delete" data-id="${rid}">Xóa lịch</button><button class="btn" data-action="schedule-edit" data-id="${rid}">Sửa lịch</button></div>`,
      );
    } else if (action === "schedule-edit")
      scheduleForm(state.data.schedules.find((s) => s.id === rid));
    else if (action === "schedule-delete")
      confirmModal(
        "Xóa lịch",
        "Lịch này sẽ được xóa khỏi thời khóa biểu.",
        "schedule-delete-confirm",
        rid,
      );
    else if (action === "schedule-delete-confirm") {
      await mutate(
        "/api/schedules/" + rid,
        "DELETE",
        undefined,
        "Đã xóa lịch.",
      );
      closeModal();
    } else if (action === "week-prev" || action === "week-next") {
      const d = weekStart();
      d.setDate(d.getDate() + (action === "week-prev" ? -7 : 7));
      state.week = localDate(d);
      render();
    } else if (action === "material-open") materialModal(rid);
    else if (action === "video-play") {
      const m = state.data.materials.find((m) => m.id === rid);
      if (m?.videoId && /^[a-zA-Z0-9_-]{11}$/.test(m.videoId))
        $("#lesson-video").innerHTML =
          `<iframe class="video-player" src="https://www.youtube-nocookie.com/embed/${m.videoId}" title="Video bài giảng" sandbox="allow-scripts allow-same-origin allow-presentation" referrerpolicy="no-referrer" allow="fullscreen"></iframe>`;
    } else if (action === "material-complete") {
      await mutate(
        `/api/materials/${rid}/complete`,
        "POST",
        {},
        "Đã lưu tiến độ bài học.",
      );
      closeModal();
    } else if (action === "record-add") recordForm(rid);
    else if (action === "reward-edit")
      rewardForm(state.data.rewards.find((r) => r.id === rid) || {});
    else if (action === "record-edit") {
      for (const section of ["materials", "groups", "events"]) {
        const r = state.data[section].find((r) => r.id === rid);
        if (r) {
          recordForm(section, r);
          break;
        }
      }
    } else if (action === "record-delete")
      confirmModal(
        "Xóa nội dung",
        "Nội dung và dữ liệu liên quan sẽ được xóa.",
        "record-delete-confirm",
        rid,
      );
    else if (action === "record-delete-confirm") {
      await mutate(
        "/api/records/" + rid,
        "DELETE",
        undefined,
        "Đã xóa nội dung.",
      );
      closeModal();
    } else if (action === "group-join" || action === "group-leave") {
      await mutate(
        `/api/groups/${rid}/membership`,
        "POST",
        { join: action === "group-join" },
        action === "group-join" ? "Bạn đã tham gia nhóm." : "Bạn đã rời nhóm.",
      );
      if (action === "group-join") await groupModal(rid);
    } else if (action === "group-open") await groupModal(rid);
    else if (action === "post-delete") {
      await api("/api/posts/" + rid, { method: "DELETE" });
      await groupModal(element.dataset.group);
      toast("Đã xóa thảo luận.");
    } else if (action === "grade-delete")
      confirmModal(
        "Xóa kết quả",
        "Kết quả điểm này sẽ được xóa.",
        "grade-delete-confirm",
        rid,
      );
    else if (action === "grade-delete-confirm") {
      await mutate(
        "/api/grades/" + rid,
        "DELETE",
        undefined,
        "Đã xóa kết quả.",
      );
      closeModal();
    } else if (action === "event-open") eventModal(rid);
    else if (action === "event-toggle") {
      const v = state.data.events.find((v) => v.id === rid);
      await mutate(
        `/api/events/${rid}/registration`,
        "POST",
        { register: !v.registered },
        v.registered ? "Đã hủy đăng ký." : "Đăng ký thành công.",
      );
      closeModal();
    } else if (action === "teacher-open") teacherModal(rid);
    else if (action === "ai-mode") {
      state.chatMode = rid;
      navigate("ai");
    } else if (action === "chat-mode") {
      state.chatMode = rid;
      render();
    } else if (action === "chat-clear") {
      state.chat = [];
      state.chatPending = false;
      render();
    } else if (action === "game-choose") chooseGame(rid);
    else if (action === "game-answer") {
      state.game.answers[state.game.index] = Number(rid);
      state.game.flipped = false;
      renderGame();
    } else if (action === "flash-flip") {
      state.game.flipped = !state.game.flipped;
      renderGame();
    } else if (action === "game-prev") {
      storeCurrentAnswer();
      state.game.index = Math.max(0, state.game.index - 1);
      state.game.flipped = false;
      renderGame();
    } else if (action === "game-next") {
      storeCurrentAnswer();
      const g = state.game;
      if (
        g.answers[g.index] === null ||
        g.answers[g.index] === undefined ||
        g.answers[g.index] === ""
      )
        return toast("Bạn hãy chọn hoặc nhập một đáp án.", true);
      if (g.index === g.questions.length - 1) await submitGame();
      else {
        g.index++;
        g.flipped = false;
        renderGame();
      }
    } else if (action === "scroll-rewards")
      $("#rewards")?.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (action === "redeem-confirm") {
      const r = state.data.rewards.find((r) => r.id === rid);
      openModal(
        "Đổi " + r.title,
        `<div class="text-center"><div class="card-emoji">${e(r.icon)}</div><p>Dùng <b>${number(r.cost)} xu</b> để tạo yêu cầu đổi quà.</p><p class="small muted mt">Bạn đang có ${number(state.user.coins)} xu. Còn ${r.stock} món.<br>Quản trị viên sẽ xử lý yêu cầu trong hệ thống.</p></div><div class="modal-footer"><button class="btn outline" data-action="modal-close">Quay lại</button><button class="btn" data-action="redeem" data-id="${rid}" ${state.user.coins < r.cost ? "disabled" : ""}>Xác nhận đổi quà</button></div>`,
      );
    } else if (action === "redeem") {
      element.disabled = true;
      await mutate(
        "/api/redeem",
        "POST",
        { rewardId: rid },
        "Đã tạo yêu cầu đổi quà!",
      );
      closeModal();
    } else if (action === "redemptions")
      openModal(
        "Lịch sử đổi quà",
        state.data.redemptions
          .map(
            (r) =>
              `<div class="notification-item"><span class="emoji">${e(r.icon)}</span><div><b>${e(r.title)}</b><p class="small muted">${r.cost} xu · ${dateLabel(r.created)}</p><span class="badge">${{ pending: "Chờ trao quà", completed: "Đã trao quà", cancelled: "Đã hủy & hoàn xu" }[r.status]}</span></div></div>`,
          )
          .join("") || empty("Bạn chưa đổi quà."),
      );
    else if (action === "user-save") {
      const role = $(`#role-${rid}`).value,
        active = $(`#active-${rid}`).value === "1";
      openModal(
        "Xác nhận phân quyền",
        `<p>Đổi vai trò thành <b>${roleNames[role]}</b> và trạng thái <b>${active ? "hoạt động" : "đã khóa"}</b>.</p><p class="small muted mt">Các phiên đăng nhập của tài khoản này sẽ kết thúc.</p><form data-form="user-permission"><input type="hidden" name="id" value="${rid}"><input type="hidden" name="role" value="${role}"><input type="hidden" name="active" value="${active ? "1" : "0"}"><div class="modal-footer"><button class="btn">Xác nhận</button></div></form>`,
      );
    } else if (
      action === "redemption-complete" ||
      action === "redemption-cancel"
    ) {
      const status =
        action === "redemption-complete" ? "completed" : "cancelled";
      openModal(
        status === "completed"
          ? "Xác nhận đã trao quà"
          : "Hủy yêu cầu & hoàn xu",
        `<p class="muted">${status === "completed" ? "Xác nhận quà đã được trao cho sinh viên." : "Xu và tồn kho sẽ được hoàn lại một lần."}</p><form data-form="redemption-status"><input type="hidden" name="id" value="${rid}"><input type="hidden" name="status" value="${status}"><div class="modal-footer"><button class="btn">Xác nhận</button></div></form>`,
      );
    }
  } catch (err) {
    toast(err.message, true);
    element.disabled = false;
  }
});
document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-form]");
  if (!form) return;
  event.preventDefault();
  const kind = form.dataset.form,
    b = Object.fromEntries(new FormData(form));
  const button = $("button[type=submit],button:not([type])", form);
  if (button) button.disabled = true;
  try {
    if (kind === "auth") {
      const result = await api(
        state.authMode === "register" ? "/api/register" : "/api/login",
        { method: "POST", body: b },
      );
      state.csrf = result.csrf;
      state.user = result.user;
      await refresh();
      state.route = nav.some((n) => n[0] === location.hash.slice(1))
        ? location.hash.slice(1)
        : "home";
      if (state.user.role === "admin" && location.hash === "#admin") {
        state.route = "admin";
        await loadAdmin();
      }
      render();
    } else if (kind === "search") {
      state.query = b.query.trim();
      if (state.query) {
        navigate("search");
        if (state.route === "search") render();
      }
    } else if (kind === "task")
      await mutate(
        "/api/tasks",
        "POST",
        { title: b.title },
        "Đã thêm công việc.",
      );
    else if (kind === "task-edit") {
      const t = state.data.tasks.find((t) => t.id === b.id);
      await mutate(
        "/api/tasks/" + b.id,
        "PATCH",
        { title: b.title, done: !!t.done },
        "Đã sửa công việc.",
      );
      closeModal();
    } else if (kind === "schedule") {
      const { id, ...payload } = b;
      await mutate(
        "/api/schedules" + (id ? "/" + id : ""),
        id ? "PATCH" : "POST",
        payload,
        "Đã lưu lịch.",
      );
      state.week = null;
      closeModal();
      render();
    } else if (kind === "record") {
      const { id, ...payload } = b;
      payload.published = !!form.elements.published?.checked;
      await mutate(
        "/api/records" + (id ? "/" + id : ""),
        id ? "PATCH" : "POST",
        payload,
        "Đã lưu nội dung.",
      );
      closeModal();
    } else if (kind === "post") {
      await api(`/api/groups/${b.group}/posts`, {
        method: "POST",
        body: { body: b.body },
      });
      await groupModal(b.group);
      toast("Đã gửi thảo luận.");
    } else if (kind === "grade") {
      const result = await api("/api/grades", {
        method: "POST",
        body: {
          subject: b.subject,
          scores: [0, 1, 2].map((i) => Number(b["s" + i])),
          weights: [0, 1, 2].map((i) => Number(b["w" + i])),
        },
      });
      await refresh();
      render();
      toast(
        `Đã lưu điểm ${number(result.result)} (${letterGrade(result.result)}).`,
      );
    } else if (kind === "profile")
      await mutate(
        "/api/profile",
        "POST",
        { ...b, notifications: form.elements.notifications.checked },
        "Đã lưu thông tin.",
      );
    else if (kind === "password") {
      if (b.password !== b.confirm) throw Error("Hai mật khẩu mới chưa khớp.");
      const result = await api("/api/password", {
        method: "POST",
        body: { current: b.current, password: b.password },
      });
      state.csrf = result.csrf;
      form.reset();
      toast("Đã đổi mật khẩu và kết thúc các phiên khác.");
    } else if (kind === "rating") {
      await mutate(
        `/api/teachers/${b.id}/rating`,
        "POST",
        { value: Number(b.value) },
        "Đã lưu đánh giá.",
      );
      closeModal();
    } else if (kind === "home-ai") {
      state.chatMode = "summary";
      navigate("ai");
      state.route = "ai";
      await chatSend(b.message);
    } else if (kind === "chat") await chatSend(b.message);
    else if (kind === "game-start") {
      const game = await api("/api/games/start", {
        method: "POST",
        body: { mode: b.mode, subject: b.subject },
      });
      state.game = {
        ...game,
        index: 0,
        answers: Array(game.questions.length).fill(null),
        flipped: false,
      };
      renderGame();
      clearInterval(gameTimer);
      gameTimer = setInterval(updateTimer, 1000);
    } else if (kind === "user-permission") {
      await api("/api/admin/users/" + b.id, {
        method: "PATCH",
        body: { role: b.role, active: b.active === "1" },
      });
      await loadAdmin();
      render();
      closeModal();
      toast("Đã cập nhật quyền.");
    } else if (kind === "redemption-status") {
      await api("/api/admin/redemptions/" + b.id, {
        method: "PATCH",
        body: { status: b.status },
      });
      await refresh();
      await loadAdmin();
      render();
      closeModal();
      toast("Đã xử lý yêu cầu đổi quà.");
    } else if (kind === "announcement") {
      await api("/api/admin/announcement", {
        method: "POST",
        body: { title: b.title },
      });
      await refresh();
      await loadAdmin();
      render();
      toast("Đã gửi thông báo hệ thống.");
    } else if (kind === "reward") {
      await api("/api/admin/rewards", {
        method: "POST",
        body: { ...b, cost: Number(b.cost), stock: Number(b.stock) },
      });
      await refresh();
      await loadAdmin();
      render();
      closeModal();
      toast("Đã cập nhật cửa hàng quà.");
    }
  } catch (err) {
    if (kind === "auth") {
      renderAuth(err.message);
    } else toast(err.message, true);
  } finally {
    if (button && button.isConnected) button.disabled = false;
  }
});
document.addEventListener("change", async (event) => {
  const input = event.target;
  if (input.dataset.task) {
    input.disabled = true;
    try {
      await mutate("/api/tasks/" + input.dataset.task, "PATCH", {
        done: input.checked,
      });
    } catch (err) {
      toast(err.message, true);
      input.checked = !input.checked;
      input.disabled = false;
    }
  }
});
let filterTimer;
document.addEventListener("input", (event) => {
  const input = event.target;
  if (input.dataset.liveFilter) {
    clearTimeout(filterTimer);
    const pos = input.selectionStart;
    filterTimer = setTimeout(() => {
      state.filters[input.dataset.liveFilter] = input.value;
      render();
      const el = $(`[data-live-filter="${input.dataset.liveFilter}"]`);
      el?.focus();
      el?.setSelectionRange(pos, pos);
    }, 200);
  }
  const form = input.closest('[data-form="grade"]');
  if (form) {
    const weights = [0, 1, 2].map((i) => Number(form.elements["w" + i].value)),
      scores = [0, 1, 2].map((i) => Number(form.elements["s" + i].value));
    $("#grade-preview", form).textContent =
      weights.reduce((a, v) => a + v, 0) === 100
        ? number(
            Math.round(
              scores.reduce((a, v, i) => a + (v * weights[i]) / 100, 0) * 100,
            ) / 100,
          )
        : "—";
  }
});
document.addEventListener("dragstart", (event) => {
  const p = event.target.closest("[data-piece]");
  if (p) event.dataTransfer.setData("text/plain", p.dataset.piece);
});
document.addEventListener("dragover", (event) => {
  if (event.target.closest("#puzzle-target")) {
    event.preventDefault();
    $("#puzzle-target").classList.add("dragover");
  }
});
document.addEventListener("drop", (event) => {
  if (event.target.closest("#puzzle-target")) {
    event.preventDefault();
    const value = Number(event.dataTransfer.getData("text/plain"));
    if (
      Number.isInteger(value) &&
      value >= 0 &&
      value < 4 &&
      state.game?.mode === "puzzle"
    ) {
      state.game.answers[state.game.index] = value;
      renderGame();
    }
  }
});
document.addEventListener("keydown", (event) => {
  if (!$(".modal")) return;
  if (event.key === "Escape") {
    closeModal();
    return;
  }
  if (event.key === "Tab") {
    const focusable = Array.from(
      $(".modal").querySelectorAll(
        "button:not([disabled]),input:not([disabled]):not([type=hidden]),select,textarea,a[href]",
      ),
    );
    const first = focusable[0],
      last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});
window.addEventListener("hashchange", async () => {
  if (!state.user) return;
  closeModal();
  state.route = location.hash.slice(1) || "home";
  if (state.route === "admin") {
    try {
      await loadAdmin();
    } catch (err) {
      toast(err.message, true);
      state.route = "home";
    }
  }
  render();
  window.scrollTo(0, 0);
});
setInterval(() => {
  if (state.user && document.visibilityState === "visible")
    api("/api/activity", { method: "POST", body: { seconds: 60 } }).catch(
      () => {},
    );
}, 60000);
async function boot() {
  try {
    const session = await api("/api/session");
    state.csrf = session.csrf;
    state.user = session.user;
    if (state.user) {
      await refresh();
      state.route = location.hash.slice(1) || "home";
      if (state.route === "admin") await loadAdmin();
    }
    render();
  } catch (err) {
    $("#app").innerHTML =
      `<div class="loading"><span class="loading-cap">☁️</span><strong>Kết nối đang gián đoạn</strong><p>${e(err.message)}</p><button class="btn" data-action="retry">Thử lại</button></div>`;
  }
}
document.addEventListener("click", (event) => {
  if (event.target.closest('[data-action="retry"]')) boot();
});
boot();
