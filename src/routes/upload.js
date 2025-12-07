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

function createRouter() {
  const router = express.Router();

  // Upload image endpoint
  router.post("/image", upload.single("file"), (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageUrl = `/img/items/${req.file.filename}`;
    res.status(201).json({ url: imageUrl });
  });

  // Error handling middleware for multer errors
  router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "UNEXPECTED_FIELD") {
        return res.status(400).json({
          error: "Unexpected field",
          message: "Please use 'file' as the field name for file upload",
        });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });

  return router;
}

module.exports = createRouter;
