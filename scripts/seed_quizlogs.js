#!/usr/bin/env node
const path = require("path");
const { init } = require("../src/db");

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

(async () => {
  try {
    process.env.DB_FILE = path.join(__dirname, "..", "data", "app.db");
    const db = await init();

    const users = await db.all("SELECT id FROM users");
    const quizzes = await db.all("SELECT id FROM quizzes");
    if (users.length === 0 || quizzes.length === 0) {
      console.log("Need users and quizzes before seeding quizLogs.");
      process.exit(0);
    }

    const target = 50;
    const countRow = await db.get("SELECT COUNT(*) as cnt FROM quizLogs");
    const before = countRow.cnt || 0;
    const toInsert = Math.max(0, target - before);

    for (let i = 0; i < toInsert; i++) {
      const userId = users[randInt(0, users.length - 1)].id;
      const quizId = quizzes[randInt(0, quizzes.length - 1)].id;
      const answer = randInt(1, 4);
      await db.run(
        "INSERT INTO quizLogs (quizId, userId, answer) VALUES (?, ?, ?)",
        [quizId, userId, answer]
      );
    }

    const afterRow = await db.get("SELECT COUNT(*) as cnt FROM quizLogs");
    const after = afterRow.cnt || 0;
    console.log(
      `Seeded quizLogs: before=${before}, inserted=${toInsert}, after=${after}`
    );

    await db.close();
  } catch (err) {
    console.error("Seeding quizLogs failed:", err);
    process.exit(1);
  }
})();
