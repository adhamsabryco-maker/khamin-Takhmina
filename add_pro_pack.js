import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'players.db');
const db = new Database(dbPath);

try {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO shop_items (id, name, description, price, type, image, amount, active, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insert.run('pro_pack', 'باقة المحترفين', 'استخدم وسائل المساعدة بدون إعلانات لمدة 30 يوم', 150, 'pro_pack', '', 0, 1, Date.now());
  console.log('Successfully added pro_pack to shop_items.');
} catch (err) {
  console.error('Error adding pro_pack:', err);
} finally {
  db.close();
}
