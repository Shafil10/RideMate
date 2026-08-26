import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../src/app.js";
import { prisma } from "../src/prisma.js";
import { signToken } from "../src/middleware/auth.js";

const TEST_EMAIL = `vitest-rides-${Date.now()}@nsu.edu.bd`;
const createdRideIds: string[] = [];
let token: string;

beforeAll(async () => {
  const passwordHash = await bcrypt.hash("testpass123", 10);
  const user = await prisma.user.create({
    data: { name: "Rides Test User", email: TEST_EMAIL, passwordHash, university: "NSU" },
  });
  token = signToken({ sub: user.id, name: user.name, email: user.email, university: user.university });
});

afterAll(async () => {
  if (createdRideIds.length) {
    await prisma.ride.deleteMany({ where: { id: { in: createdRideIds } } });
  }
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

describe("GET /api/rides", () => {
  it("lists rides without requiring authentication", async () => {
    const res = await request(app).get("/api/rides");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.rides)).toBe(true);
  });
});

describe("POST /api/rides", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).post("/api/rides").send({
      type: "student-driver",
      origin: "Dhanmondi",
      destination: "Bashundhara",
      university: "NSU",
      departureTime: new Date().toISOString(),
      seatsTotal: 4,
      farePerSeat: 100,
    });
    expect(res.status).toBe(401);
  });

  it("rejects a request missing required fields", async () => {
    const res = await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "student-driver" });
    expect(res.status).toBe(400);
  });

  it("creates a ride for an authenticated user", async () => {
    const res = await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "student-driver",
        origin: "Dhanmondi",
        destination: "Bashundhara",
        university: "North South University",
        departureTime: new Date(Date.now() + 3600_000).toISOString(),
        seatsTotal: 4,
        farePerSeat: 100,
      });

    expect(res.status).toBe(201);
    expect(res.body.ride.id).toBeTruthy();
    createdRideIds.push(res.body.ride.id);
  });
});
