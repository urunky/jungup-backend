const express = require("express");
const crypto = require("crypto");

function createRouter(db) {
  const router = express.Router();

  // Create user
  router.post("/", async (req, res) => {
    const { age, interest, rewarded } = req.body;
    const result = await db.run(
      "INSERT INTO users (age, interest, rewarded) VALUES (?, ?, ?)",
      [age || null, interest || null, rewarded != null ? rewarded : 0]
    );
    const user = await db.get("SELECT * FROM users WHERE id = ?", [
      result.lastID,
    ]);

    // Create 10 quest logs for random items for this user (done=false)
    try {
      const items = await db.all(
        "SELECT id FROM items ORDER BY RANDOM() LIMIT 10"
      );
      if (items && items.length > 0) {
        const stmt = await db.prepare(
          "INSERT INTO questLogs (itemId, userId, done) VALUES (?, ?, ?)"
        );
        try {
          for (const it of items) {
            await stmt.run(it.id, user.id, 0);
          }
        } finally {
          await stmt.finalize();
        }
      }
    } catch (e) {
      // Ignore quest log generation errors to not block user creation
    }

    // 인증 토큰 생성 (간단한 예시: userId + 랜덤)
    const token = crypto.randomBytes(16).toString("hex") + "-" + user.id;
    res.cookie("auth", token, {
      httpOnly: true,
      secure: false, // 개발환경은 false, 운영은 true(https)
      sameSite: "lax",
      maxAge: 3 * 60 * 60 * 1000, // 3시간
    });
    // userId를 쿠키에 저장
    res.cookie("userId", user.id, {
      httpOnly: false, // JS에서 읽을 수 있도록
      secure: false,
      sameSite: "lax",
      maxAge: 3 * 60 * 60 * 1000,
    });
    res.status(201).json(user);
  });

  // Read all (with pagination)
  router.get("/", async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rawPageSize = parseInt(req.query.pageSize, 10) || 10;
    const pageSize = Math.max(1, Math.min(100, rawPageSize));
    const offset = (page - 1) * pageSize;

    // total count
    const totalRow = await db.get("SELECT COUNT(*) as cnt FROM users");
    const total = totalRow.cnt || 0;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    const rows = await db.all(
      "SELECT * FROM users ORDER BY id DESC LIMIT ? OFFSET ?",
      [pageSize, offset]
    );

    // pagination headers (kept for compatibility)
    res.setHeader("X-Total-Count", String(total));
    res.setHeader("X-Page", String(page));
    res.setHeader("X-Page-Size", String(pageSize));
    res.setHeader("X-Total-Pages", String(totalPages));

    // include totalCount and paging in body
    res.json({
      totalCount: total,
      page,
      pageSize,
      totalPages,
      data: rows,
    });
  });

  // Read one
  router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const row = await db.get("SELECT * FROM users WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  });

  // Read user's questLogs
  router.get("/:id/questLogs", async (req, res) => {
    const id = Number(req.params.id);
    console.log("id", id);
    const user = await db.get("SELECT id FROM users WHERE id = ?", [id]);
    if (!user) return res.status(404).json({ error: "not found" });
    console.log("user", user);
    // Optional filters
    const { done, itemId } = req.query;
    const params = [id];
    let where = "WHERE q.userId = ?";
    if (done !== undefined) {
      // Accept true/false/1/0 strings
      const v = String(done).toLowerCase();
      const doneVal = v === "true" || v === "1" ? 1 : 0;
      where += " AND q.done = ?";
      params.push(doneVal);
    }
    if (itemId !== undefined) {
      where += " AND q.itemId = ?";
      params.push(Number(itemId));
    }

    // Return questLogs joined with items for itemName, newest first
    const rows = await db.all(
      `SELECT q.*, i.name AS itemName
       FROM questLogs q
       JOIN items i ON i.id = q.itemId
       ${where}
       ORDER BY q.id DESC`,
      params
    );
    console.log("rows", rows);
    res.json(rows);
  });

  // Update
  router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { age, interest, rewarded } = req.body;
    const info = await db.run(
      "UPDATE users SET age = ?, interest = ?, rewarded = ? WHERE id = ?",
      [age, interest, rewarded != null ? rewarded : 0, id]
    );
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    const row = await db.get("SELECT * FROM users WHERE id = ?", [id]);
    res.json(row);
  });

  // Delete
  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const info = await db.run("DELETE FROM users WHERE id = ?", [id]);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  });

  return router;
}

module.exports = createRouter;
