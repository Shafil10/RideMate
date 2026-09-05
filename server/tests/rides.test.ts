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

describe("POST /api/rides/:id/join", () => {
  const JOINER_EMAIL = `vitest-rides-joiner-${Date.now()}@nsu.edu.bd`;
  let joinerToken: string;
  let rideId: string;

  beforeAll(async () => {
    const driver = await prisma.user.findUniqueOrThrow({ where: { email: TEST_EMAIL } });
    const joinerHash = await bcrypt.hash("testpass123", 10);
    const joiner = await prisma.user.create({
      data: { name: "Rides Test Joiner", email: JOINER_EMAIL, passwordHash: joinerHash, university: "NSU" },
    });
    joinerToken = signToken({ sub: joiner.id, name: joiner.name, email: joiner.email, university: joiner.university });

    const ride = await prisma.ride.create({
      data: {
        type: "student-driver",
        origin: "Dhanmondi",
        destination: "Bashundhara",
        university: "North South University",
        departureTime: new Date(Date.now() + 3600_000),
        seatsTotal: 4,
        farePerSeat: 100,
        driverId: driver.id,
      },
    });
    rideId = ride.id;
    createdRideIds.push(ride.id);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: JOINER_EMAIL } });
  });

  it("rejects the driver joining their own ride", async () => {
    const res = await request(app)
      .post(`/api/rides/${rideId}/join`)
      .set("Authorization", `Bearer ${token}`)
      .send({ pickupPoint: "Somewhere on the route" });
    expect(res.status).toBe(400);
  });

  it("lets a different student join the ride", async () => {
    const res = await request(app)
      .post(`/api/rides/${rideId}/join`)
      .set("Authorization", `Bearer ${joinerToken}`)
      .send({ pickupPoint: "Somewhere on the route" });
    expect(res.status).toBe(200);
    expect(res.body.ride.seatsTaken).toBe(1);
  });
});

describe("GET /api/rides/nearby", () => {
  // Straight line from Dhanmondi to Bashundhara — the ride's own stored route.
  const routeStart = { lat: 23.7461, lng: 90.3742 };
  const routeEnd = { lat: 23.8103, lng: 90.4215 };
  let onRouteRideId: string;
  // A searcher distinct from the ride's own driver — /nearby now excludes a
  // driver's own rides from their own search results (you can't join a ride
  // you're driving), so matching must be exercised as someone else.
  const SEARCHER_EMAIL = `vitest-rides-searcher-${Date.now()}@nsu.edu.bd`;
  let searcherToken: string;

  beforeAll(async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: TEST_EMAIL } });

    const searcherHash = await bcrypt.hash("testpass123", 10);
    const searcher = await prisma.user.create({
      data: { name: "Rides Test Searcher", email: SEARCHER_EMAIL, passwordHash: searcherHash, university: "NSU" },
    });
    searcherToken = signToken({ sub: searcher.id, name: searcher.name, email: searcher.email, university: searcher.university });

    const ride = await prisma.ride.create({
      data: {
        type: "student-driver",
        origin: "Dhanmondi",
        originLat: routeStart.lat,
        originLng: routeStart.lng,
        destination: "Bashundhara",
        destLat: routeEnd.lat,
        destLng: routeEnd.lng,
        university: "North South University",
        departureTime: new Date(Date.now() + 3600_000),
        seatsTotal: 4,
        farePerSeat: 100,
        driverId: user.id,
      },
    });
    onRouteRideId = ride.id;
    createdRideIds.push(ride.id);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: SEARCHER_EMAIL } });
  });

  it("rejects an unauthenticated request", async () => {
    const res = await request(app).get("/api/rides/nearby");
    expect(res.status).toBe(401);
  });

  it("rejects a request missing coordinates", async () => {
    const res = await request(app)
      .get("/api/rides/nearby")
      .set("Authorization", `Bearer ${token}`)
      .query({ originLat: routeStart.lat });
    expect(res.status).toBe(400);
  });

  it("finds a ride whose route passes within 200m of both points, in order", async () => {
    const res = await request(app)
      .get("/api/rides/nearby")
      .set("Authorization", `Bearer ${searcherToken}`)
      .query({
        originLat: routeStart.lat,
        originLng: routeStart.lng,
        destLat: routeEnd.lat,
        destLng: routeEnd.lng,
      });
    expect(res.status).toBe(200);
    expect(res.body.rides.map((r: { id: string }) => r.id)).toContain(onRouteRideId);
  });

  it("excludes a ride when the searched points are far from its route", async () => {
    const res = await request(app)
      .get("/api/rides/nearby")
      .set("Authorization", `Bearer ${searcherToken}`)
      .query({
        originLat: 24.5,
        originLng: 91.5,
        destLat: 24.6,
        destLng: 91.6,
      });
    expect(res.status).toBe(200);
    expect(res.body.rides.map((r: { id: string }) => r.id)).not.toContain(onRouteRideId);
  });

  it("excludes a ride from the driver's own search results", async () => {
    const res = await request(app)
      .get("/api/rides/nearby")
      .set("Authorization", `Bearer ${token}`)
      .query({
        originLat: routeStart.lat,
        originLng: routeStart.lng,
        destLat: routeEnd.lat,
        destLng: routeEnd.lng,
      });
    expect(res.status).toBe(200);
    expect(res.body.rides.map((r: { id: string }) => r.id)).not.toContain(onRouteRideId);
  });
});
