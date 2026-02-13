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
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});

// Helper: support upload.multiple(...) as a thin wrapper around multer.array
upload.multiple = function (fieldName, maxCount) {
  return upload.array(fieldName, maxCount || 10);
};

function createRouter(db) {
  const router = express.Router();

  // Create item
  router.post(
    "/",
    upload.fields([
      { name: "file", maxCount: 1 },
      { name: "file1", maxCount: 1 },
      { name: "file2", maxCount: 1 },
    ]),
    async (req, res) => {
      const {
        name,
        description,
        stair,
        x,
        y,
        q1,
        o11,
        o12,
        o13,
        o14,
        a1,
        quizType1,
        q2,
        o21,
        o22,
        o23,
        o24,
        a2,
        quizType2,
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
        code,
      } = req.body;
      if (!name) return res.status(400).json({ error: "name is required" });

      const filePath0 =
        req.files && req.files["file"] && req.files["file"][0]
          ? `/img/items/${req.files["file"][0].filename}`
          : null;
      const filePath1 =
        req.files && req.files["file1"] && req.files["file1"][0]
          ? `/img/items/${req.files["file1"][0].filename}`
          : null;
      const filePath2 =
        req.files && req.files["file2"] && req.files["file2"][0]
          ? `/img/items/${req.files["file2"][0].filename}`
          : null;
      const result = await db.run(
        "INSERT INTO items (name, description, stair, x, y, q1, o11, o12, o13, o14, a1, quizType1, q2, o21, o22, o23, o24, a2, quizType2, score, opt1, opt2, opt3, opt4, answer, question, quizType, content, interests, code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          name,
          description ?? null,
          stair ?? null,
          x ?? 0,
          y ?? 0,
          q1 ?? null,
          o11 ?? null,
          o12 ?? null,
          o13 ?? null,
          o14 ?? null,
          filePath1 ? filePath1 : (a1 ?? null),
          quizType1 ?? null,
          q2 ?? null,
          o21 ?? null,
          o22 ?? null,
          o23 ?? null,
          o24 ?? null,
          filePath2 ? filePath2 : (a2 ?? null),
          quizType2 ?? null,
          score ?? 0,
          opt1 ?? null,
          opt2 ?? null,
          opt3 ?? null,
          opt4 ?? null,
          filePath0 ? filePath0 : (answer ?? null),
          question ?? null,
          quizType ?? null,
          content ?? null,
          interests ?? null,
          code ?? null,
        ],
      );
      const item = await db.get("SELECT * FROM items WHERE id = ?", [
        result.lastID,
      ]);
      res.status(201).json(item);
    },
  );

  // Read all (with pagination, stair filter, and name search)
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
    const name = req.query.name ? req.query.name.trim() : undefined;

    let totalRow, total, totalPages, rows;
    let whereConditions = [];
    let queryParams = [];

    // Build WHERE conditions
    if (stair !== undefined && !isNaN(stair)) {
      whereConditions.push("stair = ?");
      queryParams.push(stair);
    }
    if (name) {
      whereConditions.push("name LIKE ?");
      queryParams.push(`%${name}%`);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get total count
    totalRow = await db.get(
      `SELECT COUNT(*) as cnt FROM items ${whereClause}`,
      queryParams,
    );
    total = totalRow.cnt || 0;
    totalPages = pageSize ? Math.max(Math.ceil(total / pageSize), 1) : 1;

    // Get rows with pagination
    if (pageSize) {
      rows = await db.all(
        `SELECT * FROM items ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...queryParams, pageSize, offset],
      );
    } else {
      rows = await db.all(
        `SELECT * FROM items ${whereClause} ORDER BY id DESC`,
        queryParams,
      );
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
  router.put(
    "/:id",
    upload.fields([
      { name: "file", maxCount: 1 },
      { name: "file1", maxCount: 1 },
      { name: "file2", maxCount: 1 },
    ]),
    async (req, res) => {
      const id = Number(req.params.id);
      const existing = await db.get("SELECT * FROM items WHERE id = ?", [id]);
      if (!existing) return res.status(404).json({ error: "not found" });

      const {
        name,
        description,
        stair,
        x,
        y,
        q1,
        o11,
        o12,
        o13,
        o14,
        a1,
        quizType1,
        q2,
        o21,
        o22,
        o23,
        o24,
        a2,
        quizType2,
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
        code,
      } = req.body;

      const filePath0 =
        req.files && req.files["file"] && req.files["file"][0]
          ? `/img/items/${req.files["file"][0].filename}`
          : null;
      const filePath1 =
        req.files && req.files["file1"] && req.files["file1"][0]
          ? `/img/items/${req.files["file1"][0].filename}`
          : null;
      const filePath2 =
        req.files && req.files["file2"] && req.files["file2"][0]
          ? `/img/items/${req.files["file2"][0].filename}`
          : null;

      const info = await db.run(
        "UPDATE items SET name = ?, description = ?, stair = ?, x = ?, y = ?, q1 = ?, o11 = ?, o12 = ?, o13 = ?, o14 = ?, a1 = ?, quizType1 = ?, q2 = ?, o21 = ?, o22 = ?, o23 = ?, o24 = ?, a2 = ?, quizType2 = ?, score = ?, opt1 = ?, opt2 = ?, opt3 = ?, opt4 = ?, answer = ?, question = ?, quizType = ?, content = ?, interests = ?, code = ? WHERE id = ?",
        [
          name ?? existing.name,
          description ?? existing.description,
          stair ?? existing.stair,
          x ?? existing.x,
          y ?? existing.y,
          q1 ?? existing.q1,
          o11 ?? existing.o11,
          o12 ?? existing.o12,
          o13 ?? existing.o13,
          o14 ?? existing.o14,
          filePath1 ? filePath1 : (a1 ?? existing.a1),
          quizType1 ?? existing.quizType1,
          q2 ?? existing.q2,
          o21 ?? existing.o21,
          o22 ?? existing.o22,
          o23 ?? existing.o23,
          o24 ?? existing.o24,
          filePath2 ? filePath2 : (a2 ?? existing.a2),
          quizType2 ?? existing.quizType2,
          score ?? existing.score,
          opt1 ?? existing.opt1,
          opt2 ?? existing.opt2,
          opt3 ?? existing.opt3,
          opt4 ?? existing.opt4,
          filePath0 ? filePath0 : (answer ?? existing.answer),
          question ?? existing.question,
          quizType ?? existing.quizType,
          content ?? existing.content,
          interests ?? existing.interests,
          code ?? existing.code,
          id,
        ],
      );
      if (info.changes === 0)
        return res.status(404).json({ error: "not found" });
      const row = await db.get("SELECT * FROM items WHERE id = ?", [id]);
      res.json(row);
    },
  );

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
