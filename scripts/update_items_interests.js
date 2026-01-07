#!/usr/bin/env node
const path = require("path");
const { init } = require("../src/db");

// Mapping from string to number
const interestMap = {
  diagram: "1",
  ai: "2",
  calculation: "3",
  pattern: "4",
  history: "5",
  play: "6",
};

(async () => {
  try {
    process.env.DB_FILE = path.join(__dirname, "..", "data", "app.db");
    const db = await init();

    // Get all items with interests field
    const rows = await db.all(
      "SELECT id, interests FROM items WHERE interests IS NOT NULL AND interests != ''"
    );

    console.log(`Found ${rows.length} items with interests field to update.`);

    let updatedCount = 0;
    for (const row of rows) {
      const oldInterests = row.interests;

      // Split by comma, trim whitespace, and map to numbers
      const interestList = oldInterests.split(",").map((item) => item.trim());
      const newInterestList = interestList.map((interest) => {
        const lowerInterest = interest.toLowerCase();
        return interestMap[lowerInterest] || interest;
      });

      // Join back with comma
      const newInterests = newInterestList.join(",");

      if (oldInterests !== newInterests) {
        await db.run("UPDATE items SET interests = ? WHERE id = ?", [
          newInterests,
          row.id,
        ]);
        console.log(
          `Updated item ${row.id}: "${oldInterests}" -> "${newInterests}"`
        );
        updatedCount++;
      }
    }

    console.log(`\nUpdated ${updatedCount} items successfully.`);
    await db.close();
  } catch (e) {
    console.error("Failed updating items interests:", e);
    process.exit(1);
  }
})();
