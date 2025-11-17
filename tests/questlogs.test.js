const request = require("supertest");
const fs = require("fs");
const path = require("path");

// Use a separate test database
const dataDir = path.join(__dirname, "..", "data");
const dbFile = path.join(dataDir, "test.db");
process.env.DB_FILE = dbFile;
if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

let app;
describe("QuestLogs API", () => {
  let user;
  let items = [];
  let created;

  beforeAll(async () => {
    const createApp = require("../src/app");
    app = await createApp();
    // create some items
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/api/items")
        .send({ name: `Item${i}`, description: `D${i}` });
      items.push(res.body);
    }
    // create user
    const uRes = await request(app).post("/api/users").send({ age: 20 });
    user = uRes.body;
  });

  afterAll(async () => {
    if (app && app.db) await app.db.close();
  });

  test("create questLog includes itemName", async () => {
    const itemId = items[0].id;
    const res = await request(app)
      .post("/api/questLogs")
      .send({ itemId, userId: user.id, note: "first", done: false });
    expect(res.statusCode).toBe(201);
    expect(res.body.itemId).toBe(itemId);
    expect(res.body.userId).toBe(user.id);
    expect(res.body.done).toBe(0);
    expect(res.body).toHaveProperty("itemName");
    expect(typeof res.body.itemName).toBe("string");
    created = res.body;
  });

  test("update questLog includes itemName", async () => {
    const res = await request(app)
      .put(`/api/questLogs/${created.id}`)
      .send({ note: "updated", done: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.note).toBe("updated");
    expect(res.body.done).toBe(1);
    expect(res.body).toHaveProperty("itemName");
  });
});
