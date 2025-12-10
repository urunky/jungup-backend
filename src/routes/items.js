const express = require("express");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "..", "public", "img", "items"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    fieldSize: 50 * 1024 * 1024, // 50MB field size limit for base64 content
  },
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

  // Create item
  router.post("/", upload.single("file"), async (req, res) => {
    const {
      name,
      description,
      stair,
      x,
      y,
      img1,
      img2,
      img3,
      score,
      opt1,
      opt2,
      opt3,
      opt4,
      answer,
      question,
      quizType,
      content,
      interests,
    } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const result = await db.run(
      "INSERT INTO items (name, description, stair, x, y, img1, img2, img3, score, opt1, opt2, opt3, opt4, answer, question, quizType, content, interests) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        description ?? null,
        stair ?? null,
        x ?? 0,
        y ?? 0,
        img1 ?? null,
        img2 ?? null,
        img3 ?? null,
        score ?? 0,
        opt1 ?? null,
        opt2 ?? null,
        opt3 ?? null,
        opt4 ?? null,
        req.file ? `/img/items/${req.file.filename}` : answer ?? null,
        question ?? null,
        quizType ?? null,
        content ?? null,
        interests ?? null,
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
          "SELECT * FROM items WHERE stair = ? ORDER BY id DESC LIMIT ? OFFSET ?",
          [stair, pageSize, offset]
        );
      } else {
        rows = await db.all(
          "SELECT * FROM items WHERE stair = ? ORDER BY id DESC",
          [stair]
        );
      }
    } else {
      totalRow = await db.get("SELECT COUNT(*) as cnt FROM items");
      total = totalRow.cnt || 0;
      totalPages = pageSize ? Math.max(Math.ceil(total / pageSize), 1) : 1;
      if (pageSize) {
        rows = await db.all(
          "SELECT * FROM items ORDER BY id DESC LIMIT ? OFFSET ?",
          [pageSize, offset]
        );
      } else {
        rows = await db.all("SELECT * FROM items ORDER BY id DESC");
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
    res.json(row);
  });

  // Update
  router.put("/:id", upload.single("file"), async (req, res) => {
    const id = Number(req.params.id);
    const existing = await db.get("SELECT * FROM items WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ error: "not found" });

    const {
      name,
      description,
      stair,
      x,
      y,
      img1,
      img2,
      img3,
      score,
      opt1,
      opt2,
      opt3,
      opt4,
      answer,
      question,
      quizType,
      content,
      interests,
    } = req.body;

    const info = await db.run(
      "UPDATE items SET name = ?, description = ?, stair = ?, x = ?, y = ?, img1 = ?, img2 = ?, img3 = ?, score = ?, opt1 = ?, opt2 = ?, opt3 = ?, opt4 = ?, answer = ?, question = ?, quizType = ?, content = ?, interests = ? WHERE id = ?",
      [
        name ?? existing.name,
        description ?? existing.description,
        stair ?? existing.stair,
        x ?? existing.x,
        y ?? existing.y,
        img1 ?? existing.img1,
        img2 ?? existing.img2,
        img3 ?? existing.img3,
        score ?? existing.score,
        opt1 ?? existing.opt1,
        opt2 ?? existing.opt2,
        opt3 ?? existing.opt3,
        opt4 ?? existing.opt4,
        req.file
          ? `/img/items/${req.file.filename}`
          : answer ?? existing.answer,
        question ?? existing.question,
        quizType ?? existing.quizType,
        content ?? existing.content,
        interests ?? existing.interests,
        id,
      ]
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
