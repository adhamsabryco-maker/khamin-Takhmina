import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'players.db');
const db = new Database(dbPath);

try {
  const update = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
  
  update.run('5579190', 'paymob_integration_id');
  
  console.log('Successfully updated Paymob integration ID in database.');
} catch (err) {
  console.error('Error updating Paymob integration ID:', err);
} finally {
  db.close();
}
