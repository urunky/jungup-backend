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
describe("Items API", () => {
  let created;

  beforeAll(async () => {
    const createApp = require("../src/app");
    app = await createApp();
  });
  afterAll(async () => {
    if (app && app.db) await app.db.close();
  });

  test("health check", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  test("create item", async () => {
    const res = await request(app)
      .post("/items")
      .send({ name: "Test", description: "desc" });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("Test");
    created = res.body;
  });

  test("list items", async () => {
    const res = await request(app).get("/items");
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.totalCount).toBe("number");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("get item", async () => {
    const res = await request(app).get(`/items/${created.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Test");
  });

  test("update item", async () => {
    const res = await request(app)
      .put(`/items/${created.id}`)
      .send({ name: "Changed", description: "new" });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Changed");
  });

  test("delete item", async () => {
    const res = await request(app).delete(`/items/${created.id}`);
    expect(res.statusCode).toBe(204);
  });
});
