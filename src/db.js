const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const fs = require("fs");

// DB_FILE env var lets us use different db for tests
const dbPath =
  process.env.DB_FILE || path.join(__dirname, "..", "data", "app.db");

async function init() {
  // Ensure the database directory exists; create if missing
  try {
    const dir = path.dirname(dbPath);
    await fs.promises.mkdir(dir, { recursive: true });
  } catch (e) {
    // ignore directory creation errors; open() may still create file if dir exists
  }
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
      q1 TEXT,
      o11 TEXT,
      o12 TEXT,
      o13 TEXT,
      o14 TEXT,
      a1 TEXT,
      quizType1 TEXT,
      q2 TEXT,
      o21 TEXT,
      o22 TEXT,
      o23 TEXT,
      o24 TEXT,
      a2 TEXT,
      quizType2 TEXT,
      score INTEGER DEFAULT 0,
      opt1 TEXT,
      opt2 TEXT,
      opt3 TEXT,
      opt4 TEXT,
      answer TEXT,
      question TEXT,
      quizType TEXT,
      content BLOB,
      interests TEXT,
      code TEXT,
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
  // Migration: ensure other item columns exist (do not add img1/img2/img3)
  try {
    const cols = await db.all("PRAGMA table_info('items')");
    const hasQ1 = cols.some((c) => c.name === "q1");
    const hasO11 = cols.some((c) => c.name === "o11");
    const hasO12 = cols.some((c) => c.name === "o12");
    const hasO13 = cols.some((c) => c.name === "o13");
    const hasO14 = cols.some((c) => c.name === "o14");
    const hasA1 = cols.some((c) => c.name === "a1");
    const hasQuizType1 = cols.some((c) => c.name === "quizType1");
    const hasQ2 = cols.some((c) => c.name === "q2");
    const hasO21 = cols.some((c) => c.name === "o21");
    const hasO22 = cols.some((c) => c.name === "o22");
    const hasO23 = cols.some((c) => c.name === "o23");
    const hasO24 = cols.some((c) => c.name === "o24");
    const hasA2 = cols.some((c) => c.name === "a2");
    const hasQuizType2 = cols.some((c) => c.name === "quizType2");
    const hasScore = cols.some((c) => c.name === "score");
    const hasOpt1 = cols.some((c) => c.name === "opt1");
    const hasOpt2 = cols.some((c) => c.name === "opt2");
    const hasOpt3 = cols.some((c) => c.name === "opt3");
    const hasOpt4 = cols.some((c) => c.name === "opt4");
    const hasAnswer = cols.some((c) => c.name === "answer");
    const hasQuestion = cols.some((c) => c.name === "question");
    const hasQuizType = cols.some((c) => c.name === "quizType");
    const hasContent = cols.some((c) => c.name === "content");
    const hasInterests = cols.some((c) => c.name === "interests");
    if (!hasQ1) {
      await db.exec("ALTER TABLE items ADD COLUMN q1 TEXT;");
    }
    if (!hasO11) {
      await db.exec("ALTER TABLE items ADD COLUMN o11 TEXT;");
    }
    if (!hasO12) {
      await db.exec("ALTER TABLE items ADD COLUMN o12 TEXT;");
    }
    if (!hasO13) {
      await db.exec("ALTER TABLE items ADD COLUMN o13 TEXT;");
    }
    if (!hasO14) {
      await db.exec("ALTER TABLE items ADD COLUMN o14 TEXT;");
    }
    if (!hasA1) {
      await db.exec("ALTER TABLE items ADD COLUMN a1 TEXT;");
    }
    if (!hasQuizType1) {
      await db.exec("ALTER TABLE items ADD COLUMN quizType1 TEXT;");
    }
    if (!hasQ2) {
      await db.exec("ALTER TABLE items ADD COLUMN q2 TEXT;");
    }
    if (!hasO21) {
      await db.exec("ALTER TABLE items ADD COLUMN o21 TEXT;");
    }
    if (!hasO22) {
      await db.exec("ALTER TABLE items ADD COLUMN o22 TEXT;");
    }
    if (!hasO23) {
      await db.exec("ALTER TABLE items ADD COLUMN o23 TEXT;");
    }
    if (!hasO24) {
      await db.exec("ALTER TABLE items ADD COLUMN o24 TEXT;");
    }
    if (!hasA2) {
      await db.exec("ALTER TABLE items ADD COLUMN a2 TEXT;");
    }
    if (!hasQuizType2) {
      await db.exec("ALTER TABLE items ADD COLUMN quizType2 TEXT;");
    }
    if (!hasScore) {
      await db.exec("ALTER TABLE items ADD COLUMN score INTEGER DEFAULT 0;");
    }
    if (!hasOpt1) {
      await db.exec("ALTER TABLE items ADD COLUMN opt1 TEXT;");
    }
    if (!hasOpt2) {
      await db.exec("ALTER TABLE items ADD COLUMN opt2 TEXT;");
    }
    if (!hasOpt3) {
      await db.exec("ALTER TABLE items ADD COLUMN opt3 TEXT;");
    }
    if (!hasOpt4) {
      await db.exec("ALTER TABLE items ADD COLUMN opt4 TEXT;");
    }
    if (!hasAnswer) {
      await db.exec("ALTER TABLE items ADD COLUMN answer TEXT;");
    }
    if (!hasQuestion) {
      await db.exec("ALTER TABLE items ADD COLUMN question TEXT;");
    }
    if (!hasQuizType) {
      await db.exec("ALTER TABLE items ADD COLUMN quizType TEXT;");
    }
    if (!hasContent) {
      await db.exec("ALTER TABLE items ADD COLUMN content TEXT;");
    }
    if (!hasInterests) {
      await db.exec("ALTER TABLE items ADD COLUMN interests TEXT;");
    }
  } catch (e) {}
  // Migration: add code column if missing
  try {
    const cols = await db.all("PRAGMA table_info('items')");
    const hasCode = cols.some((c) => c.name === "code");
    if (!hasCode) {
      await db.exec("ALTER TABLE items ADD COLUMN code TEXT;");
    }
  } catch (e) {}

  // Migration: remove img1/img2/img3 columns if they exist (recreate table)
  try {
    const cols = await db.all("PRAGMA table_info('items')");
    const hasImg1 = cols.some((c) => c.name === "img1");
    const hasImg2 = cols.some((c) => c.name === "img2");
    const hasImg3 = cols.some((c) => c.name === "img3");
    if (hasImg1 || hasImg2 || hasImg3) {
      await db.exec(`
        CREATE TABLE items_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          stair INTEGER,
          x INTEGER DEFAULT 0,
          y INTEGER DEFAULT 0,
          q1 TEXT,
          o11 TEXT,
          o12 TEXT,
          o13 TEXT,
          o14 TEXT,
          a1 TEXT,
          quizType1 TEXT,
          q2 TEXT,
          o21 TEXT,
          o22 TEXT,
          o23 TEXT,
          o24 TEXT,
          a2 TEXT,
          quizType2 TEXT,
          score INTEGER DEFAULT 0,
          opt1 TEXT,
          opt2 TEXT,
          opt3 TEXT,
          opt4 TEXT,
          answer TEXT,
          question TEXT,
          quizType TEXT,
          content BLOB,
          interests TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await db.exec(`
        INSERT INTO items_new (id, name, description, stair, x, y, q1, o11, o12, o13, o14, a1, quizType1, q2, o21, o22, o23, o24, a2, quizType2, score, opt1, opt2, opt3, opt4, answer, question, quizType, content, interests, createdAt)
        SELECT id, name, description, stair, x, y, q1, o11, o12, o13, o14, a1, quizType1, q2, o21, o22, o23, o24, a2, quizType2, score, opt1, opt2, opt3, opt4, answer, question, quizType, content, interests, COALESCE(createdAt, CURRENT_TIMESTAMP)
        FROM items;
      `);
      await db.exec("DROP TABLE items;");
      await db.exec("ALTER TABLE items_new RENAME TO items;");
    }
  } catch (e) {}
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      age INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      interests TEXT,
      rewarded INTEGER DEFAULT 0,
      grade TEXT,
      area TEXT,
      quests TEXT,
      again INTEGER DEFAULT 0
    );
  `);
  // Migration: users.createdDate -> users.createdAt
  try {
    const cols = await db.all("PRAGMA table_info('users')");
    const hasCreatedAt = cols.some((c) => c.name === "createdAt");
    const hasCreatedDate = cols.some((c) => c.name === "createdDate");
    const hasInterests = cols.some((c) => c.name === "interests");
    const hasInterest = cols.some((c) => c.name === "interest");
    const hasRewarded = cols.some((c) => c.name === "rewarded");
    const hasGrade = cols.some((c) => c.name === "grade");
    const hasArea = cols.some((c) => c.name === "area");
    const hasQuests = cols.some((c) => c.name === "quests");
    const hasAgain = cols.some((c) => c.name === "again");
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
    if (!hasInterests && hasInterest) {
      try {
        await db.exec("ALTER TABLE users RENAME COLUMN interest TO interests;");
      } catch (e) {
        await db.exec("ALTER TABLE users ADD COLUMN interests TEXT;");
        await db.exec(
          "UPDATE users SET interests = interest WHERE interests IS NULL;"
        );
      }
    }
    if (!hasRewarded) {
      await db.exec("ALTER TABLE users ADD COLUMN rewarded INTEGER DEFAULT 0;");
    }
    if (!hasGrade) {
      await db.exec("ALTER TABLE users ADD COLUMN grade TEXT;");
    }
    if (!hasArea) {
      await db.exec("ALTER TABLE users ADD COLUMN area TEXT;");
    }
    if (!hasQuests) {
      await db.exec("ALTER TABLE users ADD COLUMN quests TEXT;");
    }
    if (!hasAgain) {
      await db.exec("ALTER TABLE users ADD COLUMN again INTEGER DEFAULT 0;");
    }
  } catch (e) {}
  await db.exec(`
    CREATE TABLE IF NOT EXISTS itemLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      answer TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  // Migration: Drop quizzes table if it exists (quiz data moved to items table)
  try {
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='quizzes'"
    );
    if (tables.length > 0) {
      await db.exec("DROP TABLE quizzes;");
    }
  } catch (e) {}
  // Migration: itemLogs table rename from quizLogs and column updates
  try {
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='quizLogs'"
    );
    if (tables.length > 0) {
      // Rename quizLogs to itemLogs
      await db.exec("ALTER TABLE quizLogs RENAME TO itemLogs;");
      // Rename quizId column to itemId if it exists
      const cols = await db.all("PRAGMA table_info('itemLogs')");
      const hasQuizId = cols.some((c) => c.name === "quizId");
      if (hasQuizId) {
        await db.exec("ALTER TABLE itemLogs RENAME COLUMN quizId TO itemId;");
      }
    }
  } catch (e) {}
  // Migration: itemLogs.createdDate -> itemLogs.createdAt
  try {
    const cols = await db.all("PRAGMA table_info('itemLogs')");
    const hasCreatedAt = cols.some((c) => c.name === "createdAt");
    const hasCreatedDate = cols.some((c) => c.name === "createdDate");
    if (!hasCreatedAt && hasCreatedDate) {
      try {
        await db.exec(
          "ALTER TABLE itemLogs RENAME COLUMN createdDate TO createdAt;"
        );
      } catch (e) {
        await db.exec("ALTER TABLE itemLogs ADD COLUMN createdAt DATETIME;");
        await db.exec(
          "UPDATE itemLogs SET createdAt = COALESCE(createdDate, CURRENT_TIMESTAMP) WHERE createdAt IS NULL;"
        );
      }
    }
  } catch (e) {}
  // Migration: Remove imageData and imageMimeType columns from itemLogs
  try {
    const cols = await db.all("PRAGMA table_info('itemLogs')");
    const hasImageData = cols.some((c) => c.name === "imageData");
    const hasImageMimeType = cols.some((c) => c.name === "imageMimeType");
    if (hasImageData || hasImageMimeType) {
      // SQLite doesn't support DROP COLUMN directly, need to recreate table
      await db.exec(`
        CREATE TABLE itemLogs_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          itemId INTEGER NOT NULL,
          userId INTEGER NOT NULL,
          answer TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      await db.exec(`
        INSERT INTO itemLogs_new (id, itemId, userId, answer, createdAt)
        SELECT id, itemId, userId, answer, createdAt FROM itemLogs;
      `);
      await db.exec("DROP TABLE itemLogs;");
      await db.exec("ALTER TABLE itemLogs_new RENAME TO itemLogs;");
    }
  } catch (e) {}
  // Migration: Drop questLogs table if it exists
  try {
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='questLogs'"
    );
    if (tables.length > 0) {
      await db.exec("DROP TABLE questLogs;");
    }
  } catch (e) {}

  // Create interests table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS interests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

module.exports = { init };
