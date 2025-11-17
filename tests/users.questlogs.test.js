const request = require("supertest");
const fs = require("fs");
const path = require("path");

// Isolated test DB
const dataDir = path.join(__dirname, "..", "data");
const dbFile = path.join(dataDir, "test.db");
process.env.DB_FILE = dbFile;
if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

let app;
describe("Users nested questLogs endpoint", () => {
  let user;
  let items = [];
  beforeAll(async () => {
    const createApp = require("../src/app");
    app = await createApp();

    // Ensure at least 12 items exist (user creation seeds up to 10 random)
    for (let i = 1; i <= 12; i++) {
      const res = await request(app)
        .post("/api/items")
        .send({ name: `Item${i}`, description: `Desc${i}` });
      items.push(res.body);
    }

    // Create user (auto seeds 10 quest logs for random items)
    const u = await request(app).post("/api/users").send({ age: 30 });
    expect(u.statusCode).toBe(201);
    user = u.body;
  });

  afterAll(async () => {
    if (app && app.db) await app.db.close();
  });

  test("GET /api/users/:id/questLogs returns logs with itemName", async () => {
    const res = await request(app).get(`/api/users/${user.id}/questLogs`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(10);
    if (res.body.length > 0) {
      const row = res.body[0];
      expect(row.userId).toBe(user.id);
      expect(row).toHaveProperty("itemId");
      expect(row).toHaveProperty("done");
      expect(row).toHaveProperty("itemName");
      expect(typeof row.itemName).toBe("string");
    }
  });

  test("Filter by done works", async () => {
    // Create an extra questLog explicitly with done=true
    const itemId = items[0].id;
    const created = await request(app)
      .post("/api/questLogs")
      .send({ itemId, userId: user.id, note: "x", done: true });
    expect(created.statusCode).toBe(201);

    const doneTrue = await request(app)
      .get(`/api/users/${user.id}/questLogs`)
      .query({ done: 1 });
    expect(doneTrue.statusCode).toBe(200);
    const createdRow = doneTrue.body.find((r) => r.id === created.body.id);
    expect(createdRow).toBeTruthy();
    expect(createdRow).toHaveProperty("itemName");

    const doneFalse = await request(app)
      .get(`/api/users/${user.id}/questLogs`)
      .query({ done: 0 });
    expect(doneFalse.statusCode).toBe(200);
    expect(doneFalse.body.some((r) => r.id === created.body.id)).toBe(false);
  });
});
