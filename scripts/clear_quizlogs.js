#!/usr/bin/env node
const path = require("path");
const { init } = require("../src/db");

(async () => {
  try {
    // Use development DB
    process.env.DB_FILE = path.join(__dirname, "..", "data", "app.db");
    const db = await init();

    const beforeRow = await db.get("SELECT COUNT(*) AS cnt FROM quizLogs");
    const before = beforeRow.cnt || 0;

    await db.run("DELETE FROM quizLogs");

    const afterRow = await db.get("SELECT COUNT(*) AS cnt FROM quizLogs");
    const after = afterRow.cnt || 0;

    console.log(`Cleared quizLogs: before=${before}, after=${after}`);

    await db.close();
  } catch (err) {
    console.error("Clearing quizLogs failed:", err);
    process.exit(1);
  }
})();
