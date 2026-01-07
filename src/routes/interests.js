const express = require("express");

function createRouter(db) {
  const router = express.Router();

  // Create interest
  router.post("/", async (req, res) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    const result = await db.run("INSERT INTO interests (name) VALUES (?)", [
      name,
    ]);
    const interest = await db.get("SELECT * FROM interests WHERE id = ?", [
      result.lastID,
    ]);
    res.status(201).json(interest);
  });

  // Read all (with pagination)
  router.get("/", async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rawPageSize = parseInt(req.query.pageSize, 10) || 10;
    const pageSize = Math.max(1, Math.min(100, rawPageSize));
    const offset = (page - 1) * pageSize;

    // total count
    const totalRow = await db.get("SELECT COUNT(*) as cnt FROM interests");
    const total = totalRow.cnt || 0;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    const rows = await db.all(
      "SELECT * FROM interests ORDER BY id DESC LIMIT ? OFFSET ?",
      [pageSize, offset]
    );

    // pagination headers
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
    const row = await db.get("SELECT * FROM interests WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  });

  // Update
  router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    const info = await db.run("UPDATE interests SET name = ? WHERE id = ?", [
      name,
      id,
    ]);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    const row = await db.get("SELECT * FROM interests WHERE id = ?", [id]);
    res.json(row);
  });

  // Delete
  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const info = await db.run("DELETE FROM interests WHERE id = ?", [id]);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  });

  return router;
}

module.exports = createRouter;
