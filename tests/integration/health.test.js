const request = require("supertest");
const mongoose = require("mongoose");
const { closeServer } = require("../helpers/teardown");

let server;

describe("Health Check Endpoints", () => {
  beforeEach(() => {
    server = require("../../api");
  });

  afterEach(async () => {
    await closeServer(server);
  });

  describe("GET /health", () => {
    it("should return 200 with health status", async () => {
      const res = await request(server).get("/health");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("status", "healthy");
      expect(res.body).toHaveProperty("timestamp");
      expect(res.body).toHaveProperty("uptime");
      expect(res.body).toHaveProperty("environment");
      expect(res.body).toHaveProperty("version");
      expect(res.body).toHaveProperty("node");
    });

    it("should return valid timestamp format", async () => {
      const res = await request(server).get("/health");

      expect(res.status).toBe(200);
      const timestamp = new Date(res.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it("should return positive uptime", async () => {
      const res = await request(server).get("/health");

      expect(res.status).toBe(200);
      expect(res.body.uptime).toBeGreaterThan(0);
    });

    it("should return test environment", async () => {
      const res = await request(server).get("/health");

      expect(res.status).toBe(200);
      expect(res.body.environment).toBe("test");
    });

    it("should return version from package.json", async () => {
      const res = await request(server).get("/health");
      const packageJson = require("../../package.json");

      expect(res.status).toBe(200);
      expect(res.body.version).toBe(packageJson.version);
    });
  });

  describe("GET /ready", () => {
    it("should return 200 or 503 based on MongoDB status", async () => {
      const res = await request(server).get("/ready");

      // MongoDB may take time to connect in test environment
      if (res.status === 200) {
        expect(res.body).toHaveProperty("status", "ready");
        expect(res.body).toHaveProperty("checks");
        expect(res.body.checks.mongodb.status).toBe("healthy");
        expect(res.body.checks.mongodb.state).toBe("connected");
      } else {
        expect(res.status).toBe(503);
        expect(res.body).toHaveProperty("status", "not ready");
        expect(res.body.checks.mongodb.status).toBe("unhealthy");
      }
      expect(res.body).toHaveProperty("timestamp");
    });

    it("should return 503 when MongoDB is not connected", async () => {
      // Close MongoDB connection
      await mongoose.connection.close();

      const res = await request(server).get("/ready");

      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty("status", "not ready");
      expect(res.body.checks.mongodb.status).toBe("unhealthy");

      // Reconnect for cleanup using MongoDB In-Memory URI
      await mongoose.connect(process.env.MONGO_URI);
    });

    it("should return valid timestamp format", async () => {
      const res = await request(server).get("/ready");

      const timestamp = new Date(res.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it("should verify MongoDB ping succeeds", async () => {
      const res = await request(server).get("/ready");

      expect(res.status).toBe(200);
      expect(res.body.checks.mongodb).toHaveProperty("responseTime", "OK");
    });
  });

  describe("Health endpoints performance", () => {
    it("/health should respond quickly (< 100ms)", async () => {
      const start = Date.now();
      await request(server).get("/health");
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("/ready should respond reasonably fast (< 500ms)", async () => {
      const start = Date.now();
      await request(server).get("/ready");
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });
});
