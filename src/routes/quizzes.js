const express = require("express");

function createRouter(db) {
  const router = express.Router();

  // Create quiz
  router.post("/", async (req, res) => {
    const { name, score, opt1, opt2, opt3, opt4, answer, itemId } = req.body;
    if (itemId) {
      const it = await db.get("SELECT id FROM items WHERE id = ?", [itemId]);
      if (!it) return res.status(400).json({ error: "invalid itemId" });
    }
    const result = await db.run(
      "INSERT INTO quizzes (name, score, opt1, opt2, opt3, opt4, answer, itemId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name || null,
        score || 0,
        opt1 || null,
        opt2 || null,
        opt3 || null,
        opt4 || null,
        answer || "",
        itemId || null,
      ]
    );
    const quiz = await db.get("SELECT * FROM quizzes WHERE id = ?", [
      result.lastID,
    ]);
    quiz.score = quiz.score || 0;
    res.status(201).json(quiz);
  });

  // Read all
  router.get("/", async (req, res) => {
    const rows = await db.all("SELECT * FROM quizzes ORDER BY id DESC");
    rows.forEach((r) => {
      r.score = r.score || 0;
    });
    res.json(rows);
  });

  // Read one
  router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const row = await db.get("SELECT * FROM quizzes WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ error: "not found" });
    row.score = row.score || 0;
    row.itemId = row.itemId || null;
    res.json(row);
  });

  // Update
  router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { name, score, opt1, opt2, opt3, opt4, answer, itemId } = req.body;
    if (itemId) {
      const it = await db.get("SELECT id FROM items WHERE id = ?", [itemId]);
      if (!it) return res.status(400).json({ error: "invalid itemId" });
    }
    const info = await db.run(
      "UPDATE quizzes SET name = ?, score = ?, opt1 = ?, opt2 = ?, opt3 = ?, opt4 = ?, answer = ?, itemId = ? WHERE id = ?",
      [
        name || null,
        score || 0,
        opt1 || null,
        opt2 || null,
        opt3 || null,
        opt4 || null,
        answer || "",
        itemId || null,
        id,
      ]
    );
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    const row = await db.get("SELECT * FROM quizzes WHERE id = ?", [id]);
    row.score = row.score || 0;
    res.json(row);
  });

  // Delete
  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const info = await db.run("DELETE FROM quizzes WHERE id = ?", [id]);
    if (info.changes === 0) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  });

  return router;
}

module.exports = createRouter;
