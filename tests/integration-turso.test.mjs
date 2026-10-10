// Chạy lại toàn bộ kiểm thử đầu cuối với database Turso (giả lập qua HTTP) thay vì file SQLite.
process.env.TEST_DB_MODE = "remote";
await import("./integration.test.mjs");
