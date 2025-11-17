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
describe("Quizzes API", () => {
  let created;

  beforeAll(async () => {
    const createApp = require("../src/app");
    app = await createApp();
    // create an item to reference
    const iRes = await request(app)
      .post("/api/items")
      .send({ name: "ref item", description: "for quiz" });
    item = iRes.body;
  });

  afterAll(async () => {
    if (app && app.db) await app.db.close();
  });

  test("create quiz", async () => {
    const res = await request(app).post("/api/quizzes").send({
      name: "First quiz",
      score: 10,
      opt1: "a",
      opt2: "b",
      opt3: "c",
      opt4: "d",
      answer: "2",
      answerImage: "/img/answers/quiz1.jpg",
      itemId: item.id,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("First quiz");
    expect(res.body.score).toBe(10);
    expect(res.body.opt1).toBe("a");
    expect(res.body.opt2).toBe("b");
    expect(res.body.opt3).toBe("c");
    expect(res.body.opt4).toBe("d");
    expect(res.body.answer).toBe("2");
    expect(res.body.answerImage).toBe("/img/answers/quiz1.jpg");
    expect(res.body.itemId).toBe(item.id);
    created = res.body;
  });

  test("list quizzes", async () => {
    const res = await request(app).get("/api/quizzes");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("list quizzes by itemId", async () => {
    const res = await request(app).get(`/api/quizzes?itemId=${item.id}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((quiz) => {
      expect(quiz.itemId).toBe(item.id);
    });
  });

  test("get quiz", async () => {
    const res = await request(app).get(`/api/quizzes/${created.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("First quiz");
  });

  test("update quiz", async () => {
    const res = await request(app).put(`/api/quizzes/${created.id}`).send({
      name: "Renamed",
      score: 42,
      opt1: "A",
      opt2: "B",
      opt3: "C",
      opt4: "D",
      answer: "1",
      answerImage: "/img/answers/quiz2.png",
      itemId: item.id,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.score).toBe(42);
    expect(res.body.opt1).toBe("A");
    expect(res.body.opt2).toBe("B");
    expect(res.body.opt3).toBe("C");
    expect(res.body.opt4).toBe("D");
    expect(res.body.answer).toBe("1");
    expect(res.body.answerImage).toBe("/img/answers/quiz2.png");
    expect(res.body.itemId).toBe(item.id);
  });

  test("delete quiz", async () => {
    const res = await request(app).delete(`/api/quizzes/${created.id}`);
    expect(res.statusCode).toBe(204);
  });
});
