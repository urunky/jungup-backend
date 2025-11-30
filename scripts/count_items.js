const { init } = require("../src/db");

(async () => {
  const db = await init();
  const result = await db.get("SELECT COUNT(*) as count FROM items");
  console.log(`Total items: ${result.count}`);
  await db.close();
})();
