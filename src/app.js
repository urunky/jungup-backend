const express = require("express");
const morgan = require("morgan");
const { init } = require("./db");
const createItemsRouter = require("./routes/items");
const cors = require("cors");

const app = express();
app.use(morgan("dev"));
app.use(express.json());

// Export an async function to initialize DB before returning the app
async function createApp() {
  const db = await init();
  // Enable CORS for all origins (adjust in production)
  app.use(
    cors({
      origin: "*",
      exposedHeaders: [
        "X-Total-Count",
        "X-Page",
        "X-Page-Size",
        "X-Total-Pages",
      ],
    })
  );
  // Serve a small test page from /test.html to avoid chrome:// CSP issues
  app.use(express.static(require("path").join(__dirname, "..", "public")));
  // attach db to app so callers (tests) can close it when needed
  app.db = db;
  const api = express.Router();
  api.use("/items", createItemsRouter(db));
  const createUsersRouter = require("./routes/users");
  api.use("/users", createUsersRouter(db));
  const createItemLogsRouter = require("./routes/itemlogs");
  api.use("/itemlogs", createItemLogsRouter(db));
  const createInterestsRouter = require("./routes/interests");
  api.use("/interests", createInterestsRouter(db));
  const createUploadRouter = require("./routes/upload");
  api.use("/upload", createUploadRouter());
  const createVideoRouter = require("./routes/video");
  api.use("/video", createVideoRouter());
  api.get("/", (req, res) => res.json({ status: "ok" }));
  app.use("/api", api);
  return app;
}

module.exports = createApp;
