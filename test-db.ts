import Database from 'better-sqlite3';
try {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE test (id INTEGER)');
  console.log("Database created successfully");
} catch (e) {
  console.error("Error creating database:", e);
}
