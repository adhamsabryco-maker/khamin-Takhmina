import { Filter } from 'bad-words';
try {
  const filter = new Filter();
  console.log("Filter created successfully");
} catch (e) {
  console.error("Error creating filter:", e);
}
