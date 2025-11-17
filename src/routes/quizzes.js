const express = require("express");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "..", "public", "img", "answers"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});

function createRouter(db) {
  const router = express.Router();

  // Create quiz
  router.post("/", upload.single("file"), async (req, res) => {
    try {
      const {
        name,
        score,
        opt1,
        opt2,
        opt3,
        opt4,
        answer,
        answerImage,
        itemId,
      } = req.body;

      // Use uploaded file path if file was provided, otherwise use answerImage from body
      let finalAnswerImage = answerImage || null;
      if (req.file) {
        finalAnswerImage = `/img/answers/${req.file.filename}`;
      }

      if (itemId) {
        const it = await db.get("SELECT id FROM items WHERE id = ?", [itemId]);
        if (!it) return res.status(400).json({ error: "invalid itemId" });
      }
      const result = await db.run(
        "INSERT INTO quizzes (name, score, opt1, opt2, opt3, opt4, answer, answerImage, itemId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          name || null,
          score || 0,
          opt1 || null,
          opt2 || null,
          opt3 || null,
          opt4 || null,
          answer || "",
          finalAnswerImage,
          itemId || null,
        ]
      );
      const quiz = await db.get("SELECT * FROM quizzes WHERE id = ?", [
        result.lastID,
      ]);
      quiz.score = quiz.score || 0;
      res.status(201).json(quiz);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Read all
  router.get("/", async (req, res) => {
    const { itemId } = req.query;

    let query = "SELECT * FROM quizzes";
    let params = [];

    if (itemId !== undefined && itemId !== null && itemId !== "") {
      const itemIdNum = Number(itemId);
      if (!isNaN(itemIdNum)) {
        query += " WHERE itemId = ?";
        params.push(itemIdNum);
      }
    }

    query += " ORDER BY id DESC";

    const rows = await db.all(query, params);
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
  router.put("/:id", upload.single("file"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const {
        name,
        score,
        opt1,
        opt2,
        opt3,
        opt4,
        answer,
        answerImage,
        itemId,
      } = req.body;

      // Use uploaded file path if file was provided, otherwise use answerImage from body
      let finalAnswerImage = answerImage || null;
      if (req.file) {
        finalAnswerImage = `/img/answers/${req.file.filename}`;
      }

      if (itemId) {
        const it = await db.get("SELECT id FROM items WHERE id = ?", [itemId]);
        if (!it) return res.status(400).json({ error: "invalid itemId" });
      }
      const info = await db.run(
        "UPDATE quizzes SET name = ?, score = ?, opt1 = ?, opt2 = ?, opt3 = ?, opt4 = ?, answer = ?, answerImage = ?, itemId = ? WHERE id = ?",
        [
          name || null,
          score || 0,
          opt1 || null,
          opt2 || null,
          opt3 || null,
          opt4 || null,
          answer || "",
          finalAnswerImage,
          itemId || null,
          id,
        ]
      );
      if (info.changes === 0)
        return res.status(404).json({ error: "not found" });
      const row = await db.get("SELECT * FROM quizzes WHERE id = ?", [id]);
      row.score = row.score || 0;
      res.json(row);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
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
