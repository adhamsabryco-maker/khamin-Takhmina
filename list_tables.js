import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'players.db');
const db = new Database(dbPath);

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables);
} catch (err) {
  console.error('Error listing tables:', err);
} finally {
  db.close();
}
