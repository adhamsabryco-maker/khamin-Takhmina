import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'players.db');
const db = new Database(dbPath);

try {
  const items = db.prepare('SELECT * FROM shop_items').all();
  console.log('Current shop items:', items);
} catch (err) {
  console.error('Error reading shop items:', err);
} finally {
  db.close();
}
