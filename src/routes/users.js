const express = require("express");
const crypto = require("crypto");

function createRouter(db) {
  const router = express.Router();

  // Create user
  router.post("/", async (req, res) => {
    const { age, interests, rewarded, grade, area, quests, again } = req.body;
    const result = await db.run(
      "INSERT INTO users (age, interests, rewarded, grade, area, quests, again) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        age || null,
        interests || null,
        rewarded != null ? rewarded : 0,
        grade || null,
        area || null,
        quests || null,
        again != null ? again : 0,
      ]
    );
    const user = await db.get("SELECT * FROM users WHERE id = ?", [
      result.lastID,
    ]);

    // 인증 토큰 생성 (간단한 예시: userId + 랜덤)
    const token = crypto.randomBytes(16).toString("hex") + "-" + user.id;
    res.cookie("auth", token, {
      httpOnly: true,
      secure: false, // 개발환경은 false, 운영은 true(https)
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000, // 12시간
    });
    // userId를 쿠키에 저장
    res.cookie("userId", user.id, {
      httpOnly: false, // JS에서 읽을 수 있도록
      secure: false,
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000, // 12시간
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

  // Read user's itemLogs
  router.get("/:id/itemLogs", async (req, res) => {
    const id = Number(req.params.id);
    const user = await db.get("SELECT id FROM users WHERE id = ?", [id]);
    if (!user) return res.status(404).json({ error: "not found" });

    // Optional filters
    const { itemId } = req.query;
    const params = [id];
    let where = "WHERE userId = ?";
    if (itemId !== undefined) {
      where += " AND itemId = ?";
      params.push(Number(itemId));
    }

    const rows = await db.all(
      `SELECT * FROM itemLogs ${where} ORDER BY id DESC`,
      params
    );
    res.json(rows);
  });

  // Update
  router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { age, interests, rewarded, grade, area, quests, again } = req.body;
    const info = await db.run(
      "UPDATE users SET age = ?, interests = ?, rewarded = ?, grade = ?, area = ?, quests = ?, again = ? WHERE id = ?",
      [
        age,
        interests,
        rewarded != null ? rewarded : 0,
        grade,
        area,
        quests,
        again != null ? again : 0,
        id,
      ]
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
