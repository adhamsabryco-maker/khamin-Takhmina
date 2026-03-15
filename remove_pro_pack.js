import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'players.db');
const db = new Database(dbPath);

try {
  db.prepare('DELETE FROM shop_items WHERE id = ?').run('pro_pack');
  console.log('Successfully removed pro_pack.');
} catch (err) {
  console.error('Error removing pro_pack:', err);
} finally {
  db.close();
}
