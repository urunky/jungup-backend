const express = require("express");
const multer = require("multer");
const path = require("path");
// const sharp = require("sharp");
const fs = require("fs").promises;

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
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
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

  // Create itemLog
  router.post("/", upload.single("image"), async (req, res) => {
    let { itemId, userId, answer } = req.body;
    if (answer === "null") answer = null;
    // validate item and user exist
    console.log("itemId", itemId, "userId", userId);
    const item = await db.get("SELECT id FROM items WHERE id = ?", [itemId]);
    if (!item) return res.status(400).json({ error: "invalid itemId" });
    const user = await db.get("SELECT id FROM users WHERE id = ?", [userId]);
    if (!user) return res.status(400).json({ error: "invalid userId" });

    let imageUrl = null;

    // Use uploaded file path if file was uploaded
    if (req.file) {
      imageUrl = `/img/answers/${req.file.filename}`;

      // TODO: Enable sharp image processing later
      /*
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = uniqueSuffix + ".jpg";
      const outputPath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        "img",
        "answers",
        filename
      );

      try {
        // Resize and compress image
        await sharp(req.file.buffer)
          .resize(800, null, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 80 })
          .toFile(outputPath);

        imageUrl = `/img/answers/${filename}`;
      } catch (err) {
        console.error("Image processing error:", err);
        return res.status(500).json({ error: "Failed to process image" });
      }
      */
    }

    const result = await db.run(
      "INSERT INTO itemLogs (itemId, userId, answer) VALUES (?, ?, ?)",
      [itemId, userId, answer || imageUrl]
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
