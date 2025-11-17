#!/usr/bin/env node
const path = require("path");
const { init } = require("../src/db");

(async () => {
  try {
    process.env.DB_FILE = path.join(__dirname, "..", "data", "app.db");
    const db = await init();
    const rows = await db.all(
      "SELECT id FROM items WHERE stair = 2 ORDER BY id ASC"
    );
    let toggle = true;
    for (const r of rows) {
      const newStair = toggle ? 3 : 4;
      await db.run("UPDATE items SET stair = ? WHERE id = ?", [newStair, r.id]);
      toggle = !toggle;
    }
    console.log(
      `Updated ${rows.length} items with stair=2 to 3/4 alternately.`
    );
    const counts = await db.all(
      "SELECT stair, COUNT(*) as cnt FROM items GROUP BY stair ORDER BY stair"
    );
    console.table(counts);
    await db.close();
  } catch (e) {
    console.error("Failed updating items stair:", e);
    process.exit(1);
  }
})();
