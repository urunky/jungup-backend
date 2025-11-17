const express = require("express");

function createRouter(db) {
  const router = express.Router();

  // Create item
  router.post("/", async (req, res) => {
    const { name, description, stair, x, y, img1, img2, img3 } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const result = await db.run(
      "INSERT INTO items (name, description, stair, x, y, img1, img2, img3) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        description || null,
        stair || null,
        x !== undefined ? x : 0,
        y !== undefined ? y : 0,
        img1 || null,
        img2 || null,
        img3 || null,
      ]
    );
    const item = await db.get("SELECT * FROM items WHERE id = ?", [
      result.lastID,
    ]);
    res.status(201).json(item);
  });

  // Read all (with pagination and stair filter)
  router.get("/", async (req, res) => {
    const hasPageSize = req.query.pageSize !== undefined;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rawPageSize = parseInt(req.query.pageSize, 10) || 10;
    const pageSize = hasPageSize
      ? Math.max(1, Math.min(100, rawPageSize))
      : null;
    const offset = pageSize ? (page - 1) * pageSize : 0;
    const stair =
      req.query.stair !== undefined ? parseInt(req.query.stair, 10) : undefined;

    let totalRow, total, totalPages, rows;
    if (stair !== undefined && !isNaN(stair)) {
      totalRow = await db.get(
        "SELECT COUNT(*) as cnt FROM items WHERE stair = ?",
        [stair]
      );
      total = totalRow.cnt || 0;
      totalPages = pageSize ? Math.max(Math.ceil(total / pageSize), 1) : 1;
      if (pageSize) {
        rows = await db.all(
          `SELECT i.*, CASE WHEN COUNT(q.id) > 0 THEN 1 ELSE 0 END as hasQuiz
           FROM items i
           LEFT JOIN quizzes q ON q.itemId = i.id
           WHERE i.stair = ?
           GROUP BY i.id
           ORDER BY i.id DESC
           LIMIT ? OFFSET ?`,
          [stair, pageSize, offset]
        );
      } else {
        rows = await db.all(
          `SELECT i.*, CASE WHEN COUNT(q.id) > 0 THEN 1 ELSE 0 END as hasQuiz
           FROM items i
           LEFT JOIN quizzes q ON q.itemId = i.id
           WHERE i.stair = ?
           GROUP BY i.id
           ORDER BY i.id DESC`,
          [stair]
        );
      }
    } else {
      totalRow = await db.get("SELECT COUNT(*) as cnt FROM items");
      total = totalRow.cnt || 0;
      totalPages = pageSize ? Math.max(Math.ceil(total / pageSize), 1) : 1;
      if (pageSize) {
        rows = await db.all(
          `SELECT i.*, CASE WHEN COUNT(q.id) > 0 THEN 1 ELSE 0 END as hasQuiz
           FROM items i
           LEFT JOIN quizzes q ON q.itemId = i.id
           GROUP BY i.id
           ORDER BY i.id DESC
           LIMIT ? OFFSET ?`,
          [pageSize, offset]
        );
      } else {
        rows = await db.all(
          `SELECT i.*, CASE WHEN COUNT(q.id) > 0 THEN 1 ELSE 0 END as hasQuiz
           FROM items i
           LEFT JOIN quizzes q ON q.itemId = i.id
           GROUP BY i.id
           ORDER BY i.id DESC`
        );
      }
    }

    // pagination headers (for compatibility)
    res.setHeader("X-Total-Count", String(total));
    res.setHeader("X-Page", String(page));
    res.setHeader("X-Page-Size", String(pageSize || total));
    res.setHeader("X-Total-Pages", String(totalPages));

    res.json({
      totalCount: total,
      page,
      pageSize: pageSize || total,
      totalPages,
      data: rows,
    });
  });

  // Read one
  router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const row = await db.get("SELECT * FROM items WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ error: "not found" });
    // Get quizzes for this item
    const quizzes = await db.all("SELECT * FROM quizzes WHERE itemId = ?", [
      id,
    ]);
    const hasQuiz = quizzes.length > 0 ? 1 : 0;
    res.json({ ...row, hasQuiz, quizzes });
  });

  // Update
  router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { name, description, stair, x, y, img1, img2, img3 } = req.body;
    const info = await db.run(
      "UPDATE items SET name = ?, description = ?, stair = ?, x = ?, y = ?, img1 = ?, img2 = ?, img3 = ? WHERE id = ?",
      [name, description, stair, x, y, img1, img2, img3, id]
    );
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    const row = await db.get("SELECT * FROM items WHERE id = ?", [id]);
    res.json(row);
  });

  // Delete
  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const info = await db.run("DELETE FROM items WHERE id = ?", [id]);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  });

  return router;
}

module.exports = createRouter;
