import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'players.db');
const db = new Database(dbPath);

try {
  console.log('Inspecting categories...');
  const categories = db.prepare("SELECT * FROM categories WHERE name = 'جماد' OR name = 'نبات'").all();
  console.log('Found categories:', categories);

  for (const cat of categories) {
    if (cat.id !== 'objects' && cat.id !== 'plants') {
      console.log(`Fixing category ${cat.name}: ${cat.id} -> ${cat.name === 'جماد' ? 'objects' : 'plants'}`);
      db.prepare("UPDATE categories SET id = ? WHERE name = ?").run(cat.name === 'جماد' ? 'objects' : 'plants', cat.name);
    }
  }
  
  const updatedCategories = db.prepare("SELECT * FROM categories WHERE name = 'جماد' OR name = 'نبات'").all();
  console.log('Updated categories:', updatedCategories);

} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}
