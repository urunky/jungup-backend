const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

// DB_FILE env var lets us use different db for tests
const dbPath =
  process.env.DB_FILE || path.join(__dirname, "..", "data", "app.db");

async function init() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  // SQLite runtime settings
  await db.exec(`PRAGMA journal_mode = WAL;`);
  await db.exec(`PRAGMA busy_timeout = 5000;`);
  // enable foreign key support
  await db.exec(`PRAGMA foreign_keys = ON;`);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      stair INTEGER,
      x INTEGER DEFAULT 0,
      y INTEGER DEFAULT 0,
      img1 TEXT,
      img2 TEXT,
      img3 TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // Migration: if old column name exists, rename/migrate to createdAt
  try {
    const cols = await db.all("PRAGMA table_info('items')");
    const hasCreatedAt = cols.some((c) => c.name === "createdAt");
    const hasCreated_at = cols.some((c) => c.name === "created_at");
    if (!hasCreatedAt && hasCreated_at) {
      try {
        await db.exec(
          "ALTER TABLE items RENAME COLUMN created_at TO createdAt;"
        );
      } catch (e) {
        // Fallback for older SQLite: add new column and backfill
        await db.exec("ALTER TABLE items ADD COLUMN createdAt DATETIME;");
        await db.exec(
          "UPDATE items SET createdAt = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE createdAt IS NULL;"
        );
      }
    }
  } catch (e) {
    // no-op if pragma not supported
  }
  // Migration: add x, y columns if missing and set default to 0
  try {
    const cols = await db.all("PRAGMA table_info('items')");
    const hasX = cols.some((c) => c.name === "x");
    const hasY = cols.some((c) => c.name === "y");
    if (!hasX) {
      await db.exec("ALTER TABLE items ADD COLUMN x INTEGER DEFAULT 0;");
      await db.exec("UPDATE items SET x = 0 WHERE x IS NULL;");
    }
    if (!hasY) {
      await db.exec("ALTER TABLE items ADD COLUMN y INTEGER DEFAULT 0;");
      await db.exec("UPDATE items SET y = 0 WHERE y IS NULL;");
    }
  } catch (e) {}
  // Migration: add img1, img2, img3 columns if missing
  try {
    const cols = await db.all("PRAGMA table_info('items')");
    const hasImg1 = cols.some((c) => c.name === "img1");
    const hasImg2 = cols.some((c) => c.name === "img2");
    const hasImg3 = cols.some((c) => c.name === "img3");
    if (!hasImg1) {
      await db.exec("ALTER TABLE items ADD COLUMN img1 TEXT;");
    }
    if (!hasImg2) {
      await db.exec("ALTER TABLE items ADD COLUMN img2 TEXT;");
    }
    if (!hasImg3) {
      await db.exec("ALTER TABLE items ADD COLUMN img3 TEXT;");
    }
  } catch (e) {}
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      age INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      interest TEXT,
      rewarded INTEGER DEFAULT 0
    );
  `);
  // Migration: users.createdDate -> users.createdAt
  try {
    const cols = await db.all("PRAGMA table_info('users')");
    const hasCreatedAt = cols.some((c) => c.name === "createdAt");
    const hasCreatedDate = cols.some((c) => c.name === "createdDate");
    const hasRewarded = cols.some((c) => c.name === "rewarded");
    if (!hasCreatedAt && hasCreatedDate) {
      try {
        await db.exec(
          "ALTER TABLE users RENAME COLUMN createdDate TO createdAt;"
        );
      } catch (e) {
        await db.exec("ALTER TABLE users ADD COLUMN createdAt DATETIME;");
        await db.exec(
          "UPDATE users SET createdAt = COALESCE(createdDate, CURRENT_TIMESTAMP) WHERE createdAt IS NULL;"
        );
      }
    }
    if (!hasRewarded) {
      await db.exec("ALTER TABLE users ADD COLUMN rewarded INTEGER DEFAULT 0;");
    }
  } catch (e) {}
  await db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      name TEXT,
      score INTEGER DEFAULT 0,
      opt1 TEXT,
      opt2 TEXT,
      opt3 TEXT,
      opt4 TEXT,
      answer TEXT,
      itemId INTEGER,
      FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE SET NULL
    );
  `);
  // Migration: quizzes.createdDate -> quizzes.createdAt
  try {
    const cols = await db.all("PRAGMA table_info('quizzes')");
    const hasCreatedAt = cols.some((c) => c.name === "createdAt");
    const hasCreatedDate = cols.some((c) => c.name === "createdDate");
    if (!hasCreatedAt && hasCreatedDate) {
      try {
        await db.exec(
          "ALTER TABLE quizzes RENAME COLUMN createdDate TO createdAt;"
        );
      } catch (e) {
        await db.exec("ALTER TABLE quizzes ADD COLUMN createdAt DATETIME;");
        await db.exec(
          "UPDATE quizzes SET createdAt = COALESCE(createdDate, CURRENT_TIMESTAMP) WHERE createdAt IS NULL;"
        );
      }
    }
  } catch (e) {}
  await db.exec(`
    CREATE TABLE IF NOT EXISTS quizLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quizId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      answer INTEGER,
      imageData TEXT,
      imageMimeType TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  // Migration: quizLogs.createdDate -> quizLogs.createdAt
  try {
    const cols = await db.all("PRAGMA table_info('quizLogs')");
    const hasCreatedAt = cols.some((c) => c.name === "createdAt");
    const hasCreatedDate = cols.some((c) => c.name === "createdDate");
    if (!hasCreatedAt && hasCreatedDate) {
      try {
        await db.exec(
          "ALTER TABLE quizLogs RENAME COLUMN createdDate TO createdAt;"
        );
      } catch (e) {
        await db.exec("ALTER TABLE quizLogs ADD COLUMN createdAt DATETIME;");
        await db.exec(
          "UPDATE quizLogs SET createdAt = COALESCE(createdDate, CURRENT_TIMESTAMP) WHERE createdAt IS NULL;"
        );
      }
    }
  } catch (e) {}
  return db;
}

module.exports = { init };
