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
    process.env.DB_FILE = path.join(__dirname, "..", "data", "app.db");
    const db = await init();

    // ensure there's at least one item to reference; create if needed
    let item = await db.get("SELECT * FROM items ORDER BY id DESC LIMIT 1");
    if (!item) {
      await db.run("INSERT INTO items (name, description) VALUES (?, ?)", [
        "seed item",
        "for quizzes",
      ]);
      item = await db.get("SELECT * FROM items ORDER BY id DESC LIMIT 1");
    }

    const names = ["Math", "History", "Science", "Geography", "Literature"];

    const target = 20;
    const countRow = await db.get("SELECT COUNT(*) as cnt FROM quizzes");
    const before = countRow.cnt || 0;
    const toInsert = Math.max(0, target - before);

    for (let i = 0; i < toInsert; i++) {
      const name = pick(names) + " Quiz #" + randInt(1, 999);
      const score = randInt(0, 100);
      const opts = ["A", "B", "C", "D"].map((v) => v + randInt(1, 9));
      const answer = String(randInt(1, 4));
      await db.run(
        "INSERT INTO quizzes (name, score, opt1, opt2, opt3, opt4, answer, itemId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [name, score, opts[0], opts[1], opts[2], opts[3], answer, item.id]
      );
    }

    const afterRow = await db.get("SELECT COUNT(*) as cnt FROM quizzes");
    const after = afterRow.cnt || 0;
    console.log(
      `Seeded quizzes: before=${before}, inserted=${toInsert}, after=${after}`
    );

    await db.close();
  } catch (err) {
    console.error("Seeding quizzes failed:", err);
    process.exit(1);
  }
})();
