const request = require("supertest");
const fs = require("fs");
const path = require("path");

// Use a separate test database
const dataDir = path.join(__dirname, "..", "data");
const dbFile = path.join(dataDir, "test.db");

// Set test database path
process.env.DB_FILE = dbFile;

// Remove existing test db before tests
if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

let app;
describe("QuizLogs API", () => {
  let createdUser, createdQuiz, createdLog;

  beforeAll(async () => {
    const createApp = require("../src/app");
    app = await createApp();

    // create a user and a quiz to reference
    const uRes = await request(app)
      .post("/api/users")
      .send({ age: 25, interest: "testing" });
    createdUser = uRes.body;
    const qRes = await request(app)
      .post("/api/quizzes")
      .send({ name: "Q1", solved: false });
    createdQuiz = qRes.body;
  });

  afterAll(async () => {
    if (app && app.db) await app.db.close();
  });

  test("create quizLog", async () => {
    const res = await request(app)
      .post("/api/quizlogs")
      .send({ quizId: createdQuiz.id, userId: createdUser.id, answer: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.quizId).toBe(createdQuiz.id);
    expect(res.body.userId).toBe(createdUser.id);
    expect(res.body.answer).toBe(1);
    createdLog = res.body;
  });

  test("list quizLogs", async () => {
    const res = await request(app).get("/api/quizlogs");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("get quizLog", async () => {
    const res = await request(app).get(`/api/quizlogs/${createdLog.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toBe(1);
  });

  test("update quizLog", async () => {
    const res = await request(app)
      .put(`/api/quizlogs/${createdLog.id}`)
      .send({ answer: 2 });
    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toBe(2);
  });

  test("delete quizLog", async () => {
    const res = await request(app).delete(`/api/quizlogs/${createdLog.id}`);
    expect(res.statusCode).toBe(204);
  });
});
