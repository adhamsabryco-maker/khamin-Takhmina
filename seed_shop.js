import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'players.db');
console.log(`Using database at: ${dbPath}`);

const db = new Database(dbPath);

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_items (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      price REAL,
      type TEXT,
      image TEXT,
      amount INTEGER,
      active INTEGER DEFAULT 1,
      timestamp INTEGER
    )
  `);

  const insert = db.prepare('INSERT OR REPLACE INTO shop_items (id, name, description, price, type, image, amount, active, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  const now = Date.now();
  insert.run('token_pack_1', '1 Token', 'مباراة واحدة مع مستوى 40+', 10, 'token_pack_1', '', 1, 1, now);
  insert.run('token_pack_5', '5 Tokens', '5 مباريات + 1 مجاناً', 40, 'token_pack_5', '', 5, 1, now);
  insert.run('token_pack_10', '10 Tokens', '10 مباريات + 3 مجاناً', 70, 'token_pack_10', '', 10, 1, now);
  
  console.log('Successfully seeded shop items.');
} catch (err) {
  console.error('Error seeding shop items:', err);
} finally {
  db.close();
}
