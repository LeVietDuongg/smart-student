import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(process.env.DATA_DIR || resolve(root, "data"));
const path = resolve(dataDir, "smart-student.sqlite");
if (!existsSync(path)) throw new Error("Chưa có cơ sở dữ liệu để sao lưu.");
const folder = resolve(dataDir, "backups");
mkdirSync(folder, { recursive: true });
const destination = resolve(
  folder,
  "smart-student-" + new Date().toISOString().replace(/[:.]/g, "-") + ".sqlite",
);
const db = new DatabaseSync(path);
try {
  await backup(db, destination);
  console.log("Đã sao lưu:", destination);
} finally {
  db.close();
}
