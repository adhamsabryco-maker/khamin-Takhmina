import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, 'players.db');
console.log('DB Path:', dbPath);

try {
  const db = new Database(dbPath);
  const settings = db.prepare('SELECT * FROM settings').all();
  console.log('Settings:', settings);
} catch (e) {
  console.error('Error:', e);
}
