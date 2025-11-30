const express = require("express");

function createRouter(db) {
  const router = express.Router();

  // Create itemLog
  router.post("/", async (req, res) => {
    const { itemId, userId, answer, imageData, imageMimeType } = req.body;
    // validate item and user exist
    const item = await db.get("SELECT id FROM items WHERE id = ?", [itemId]);
    if (!item) return res.status(400).json({ error: "invalid itemId" });
    const user = await db.get("SELECT id FROM users WHERE id = ?", [userId]);
    if (!user) return res.status(400).json({ error: "invalid userId" });

    // Validate image data if provided
    if (imageData && !imageMimeType) {
      return res.status(400).json({
        error: "imageMimeType is required when imageData is provided",
      });
    }
    if (!imageData && imageMimeType) {
      return res.status(400).json({
        error: "imageData is required when imageMimeType is provided",
      });
    }

    const result = await db.run(
      "INSERT INTO itemLogs (itemId, userId, answer, imageData, imageMimeType) VALUES (?, ?, ?, ?, ?)",
      [itemId, userId, answer || null, imageData || null, imageMimeType || null]
    );
    const row = await db.get("SELECT * FROM itemLogs WHERE id = ?", [
      result.lastID,
    ]);
    res.status(201).json(row);
  });

  // Read all
  router.get("/", async (req, res) => {
    const rows = await db.all("SELECT * FROM itemLogs ORDER BY id DESC");
    res.json(rows);
  });

  // Read one
  router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const row = await db.get("SELECT * FROM itemLogs WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  });

  // Update
  router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { answer } = req.body;
    const info = await db.run("UPDATE itemLogs SET answer = ? WHERE id = ?", [
      answer,
      id,
    ]);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    const row = await db.get("SELECT * FROM itemLogs WHERE id = ?", [id]);
    res.json(row);
  });

  // Delete
  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const info = await db.run("DELETE FROM itemLogs WHERE id = ?", [id]);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  });

  return router;
}

module.exports = createRouter;
