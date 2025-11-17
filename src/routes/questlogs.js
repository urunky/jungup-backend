const express = require("express");

function createRouter(db) {
  const router = express.Router();

  // Create questLog
  router.post("/", async (req, res) => {
    const { itemId, userId, note, done } = req.body;
    // validate item and user exist
    const item = await db.get("SELECT id FROM items WHERE id = ?", [itemId]);
    if (!item) return res.status(400).json({ error: "invalid itemId" });
    const user = await db.get("SELECT id FROM users WHERE id = ?", [userId]);
    if (!user) return res.status(400).json({ error: "invalid userId" });

    const result = await db.run(
      "INSERT INTO questLogs (itemId, userId, note, done) VALUES (?, ?, ?, ?)",
      [itemId, userId, note || null, done ? 1 : 0]
    );
    const row = await db.get(
      `SELECT q.*, i.name AS itemName
       FROM questLogs q
       JOIN items i ON i.id = q.itemId
       WHERE q.id = ?`,
      [result.lastID]
    );
    res.status(201).json(row);
  });

  // Read all
  router.get("/", async (req, res) => {
    const rows = await db.all(
      `SELECT q.*, i.name AS itemName
       FROM questLogs q
       JOIN items i ON i.id = q.itemId
       ORDER BY q.id DESC`
    );
    res.json(rows);
  });

  // Read one
  router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const row = await db.get(
      `SELECT q.*, i.name AS itemName
       FROM questLogs q
       JOIN items i ON i.id = q.itemId
       WHERE q.id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  });

  // Update note
  router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { note, done } = req.body;
    const info = await db.run(
      "UPDATE questLogs SET note = COALESCE(?, note), done = COALESCE(?, done) WHERE id = ?",
      [note != null ? note : null, done != null ? (done ? 1 : 0) : null, id]
    );
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    const row = await db.get(
      `SELECT q.*, i.name AS itemName
       FROM questLogs q
       JOIN items i ON i.id = q.itemId
       WHERE q.id = ?`,
      [id]
    );
    res.json(row);
  });

  // Delete
  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const info = await db.run("DELETE FROM questLogs WHERE id = ?", [id]);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  });

  return router;
}

module.exports = createRouter;
