#!/usr/bin/env node
const path = require("path");
const { init } = require("../src/db");

(async () => {
  try {
    process.env.DB_FILE = path.join(__dirname, "..", "data", "app.db");
    const db = await init();

    // Get all items with interests field
    const rows = await db.all(
      `SELECT id, interests FROM items 
       WHERE interests LIKE '%diagram%' 
          OR interests LIKE '%ai%' 
          OR interests LIKE '%calculation%' 
          OR interests LIKE '%pattern%' 
          OR interests LIKE '%history%' 
          OR interests LIKE '%play%'`
    );

    console.log(`Found ${rows.length} items with string interests:`);
    console.table(rows);

    await db.close();
  } catch (e) {
    console.error("Failed checking items interests:", e);
    process.exit(1);
  }
})();
