// Set test environment before imports
process.env.NODE_ENV = "test";
process.env.TEST_PORT = "4001";

// Use test database URL if provided
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

import request from "supertest";
import { app } from "../src/index.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Server Tests", () => {
  beforeAll(async () => {
    // Ensure test database is ready
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("GET /health returns 200 with status ok and db connected", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toEqual({
      status: "ok",
      db: "connected",
    });
  });

  test("GET /api/v1/posts returns 200 with array length <= 20", async () => {
    const response = await request(app).get("/api/v1/posts").expect(200);

    expect(response.body).toHaveProperty("posts");
    expect(Array.isArray(response.body.posts)).toBe(true);
    expect(response.body.posts.length).toBeLessThanOrEqual(20);
  });
});
