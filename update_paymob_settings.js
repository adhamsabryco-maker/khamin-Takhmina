import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'players.db');
const db = new Database(dbPath);

try {
  const update = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
  
  update.run('5572379', 'paymob_integration_id');
  update.run('1013400', 'paymob_iframe_id');
  
  console.log('Successfully updated Paymob settings in database.');
} catch (err) {
  console.error('Error updating Paymob settings:', err);
} finally {
  db.close();
}
