#!/usr/bin/env node
const path = require("path");
const { init } = require("../src/db");

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

(async () => {
  try {
    // Ensure we use dev DB
    process.env.DB_FILE = path.join(__dirname, "..", "data", "app.db");
    const db = await init();

    const interests = [
      "coding",
      "reading",
      "gaming",
      "music",
      "sports",
      "travel",
      "movies",
      "art",
    ];

    const countRow = await db.get("SELECT COUNT(*) as cnt FROM users");
    const before = countRow.cnt || 0;

    const target = 40;
    const toInsert = Math.max(0, target - before);

    for (let i = 0; i < toInsert; i++) {
      const age = randInt(18, 65);
      const interest = pick(interests);
      const rewarded = Math.random() < 0.5 ? 0 : 1; // 50% chance rewarded
      await db.run(
        "INSERT INTO users (age, interest, rewarded) VALUES (?, ?, ?)",
        [age, interest, rewarded]
      );
    }

    const afterRow = await db.get("SELECT COUNT(*) as cnt FROM users");
    const after = afterRow.cnt || 0;

    console.log(
      `Seeded users: before=${before}, inserted=${toInsert}, after=${after}`
    );

    await db.close();
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
})();
