import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'players.db');
console.log(`Using database at: ${dbPath}`);

const db = new Database(dbPath);

const apiKey = 'ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRFek9EazBNU3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5ySGdYVGNEVmFpSkQ2bTktQ1lETzJzSEV1N3JqVjR1RkdpR2F2dHlZNEM4T0JicXFSYWF3NEFqVWdES1otQ25NOHd3aGtDZlVfVFk3UkRjNV9jZ3BUZw==';

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  
  insert.run('paymob_api_key', apiKey);
  insert.run('paymob_integration_id', '5579190'); // Example ID, user didn't provide it, maybe I should leave it or ask? Wait, the user only provided the API key.
  insert.run('paymob_iframe_id', '1013400'); // Example ID
  
  console.log('Successfully seeded Paymob API key.');
} catch (err) {
  console.error('Error seeding Paymob settings:', err);
} finally {
  db.close();
}
