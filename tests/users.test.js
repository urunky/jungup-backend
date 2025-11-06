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
describe("Users API", () => {
  let created;

  beforeAll(async () => {
    const createApp = require("../src/app");
    app = await createApp();
  });
  afterAll(async () => {
    if (app && app.db) await app.db.close();
  });

  test("create user", async () => {
    const res = await request(app)
      .post("/users")
      .send({ age: 30, interest: "coding", rewarded: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.age).toBe(30);
    expect(res.body.rewarded).toBe(1);
    created = res.body;
  });

  test("list users", async () => {
    const res = await request(app).get("/users");
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.totalCount).toBe("number");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    // Check rewarded field exists in all users
    for (const user of res.body.data) {
      expect(user).toHaveProperty("rewarded");
      expect([0, 1]).toContain(user.rewarded);
    }
  });

  test("get user", async () => {
    const res = await request(app).get(`/users/${created.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.age).toBe(30);
    expect([0, 1]).toContain(res.body.rewarded);
  });

  test("update user", async () => {
    const res = await request(app)
      .put(`/users/${created.id}`)
      .send({ age: 31, interest: "reading", rewarded: 0 });
    expect(res.statusCode).toBe(200);
    expect(res.body.age).toBe(31);
    expect(res.body.rewarded).toBe(0);
  });

  test("delete user", async () => {
    const res = await request(app).delete(`/users/${created.id}`);
    expect(res.statusCode).toBe(204);
  });
});
