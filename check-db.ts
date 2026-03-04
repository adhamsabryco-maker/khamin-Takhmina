import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'players.db');
console.log("Checking DB at:", dbPath);

try {
  const db = new Database(dbPath);
  const columns = db.prepare("PRAGMA table_info(players)").all();
  console.log("Columns:", columns.map((c: any) => c.name));
} catch (e) {
  console.error("Error checking DB:", e);
}
