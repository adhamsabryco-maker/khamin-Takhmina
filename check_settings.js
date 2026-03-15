import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'players.db');
const db = new Database(dbPath);

try {
  const settings = db.prepare('SELECT * FROM settings').all();
  console.log('Current settings:', settings);
} catch (err) {
  console.error('Error reading settings:', err);
} finally {
  db.close();
}
