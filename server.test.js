const request = require("supertest");
const { server, serverInstance } = require("./server");
const fs = require("fs");
const path = require("path");

describe("Server API Tests", () => {
  let testDbPath;
  let originalDbData;

  beforeAll(async () => {
    originalDbData = await fs.promises.readFile("db.json", "utf8");
    testDbPath = path.join(__dirname, "test-db.json");
    await fs.promises.writeFile(testDbPath, originalDbData);
    process.env.DB_PATH = testDbPath;
  });

  afterAll(async () => {
    await fs.promises.unlink(testDbPath);
    await fs.promises.writeFile("db.json", originalDbData);
    serverInstance.close();
  });

  describe("Authentication Middleware", () => {
    it("should return a 401 status code for missing token", async () => {
      const response = await request(server).get("/api/protected");
      expect(response.status).toBe(401);
      expect(response.body.error).toBe(
        "Authorization token missing or invalid"
      );
    });

    it("should return a 401 status code for invalid token", async () => {
      const response = await request(server)
        .get("/api/protected")
        .set("Authorization", "Bearer invalidtoken");
      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid token");
    });

    it("should return a 200 status code for valid token", async () => {
      const signupResponse = await request(server).post("/signup").send({
        email: "testuser@example.com",
        username: "testuser",
        password: "password",
        firstname: "Test",
        lastname: "User",
      });

      expect(signupResponse.status).toBe(201);

      const loginResponse = await request(server).post("/login").send({
        username: "testuser",
        password: "password",
      });

      expect(loginResponse.status).toBe(200);
      const { token } = loginResponse.body;

      const response = await request(server)
        .get("/api/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Access granted");
    });
  });
});
