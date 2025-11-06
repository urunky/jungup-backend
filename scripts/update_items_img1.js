#!/usr/bin/env node
const path = require("path");
const { init } = require("../src/db");

(async () => {
  try {
    process.env.DB_FILE = path.join(__dirname, "..", "data", "app.db");
    const db = await init();
    const total = 80;
    for (let i = 0; i < total; i++) {
      const imgNum = ((i % 40) + 1).toString().padStart(2, "0");
      const img1 = `/img/items/item${imgNum}.jpg`;
      await db.run("UPDATE items SET img1 = ? WHERE id = ?", [img1, i + 1]);
    }
    console.log("Updated img1 for 80 items (item01~item40.jpg cycle).");
    await db.close();
  } catch (err) {
    console.error("Update items img1 failed:", err);
    process.exit(1);
  }
})();
