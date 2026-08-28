import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../src/app.js";
import { prisma } from "../src/prisma.js";
import { signToken } from "../src/middleware/auth.js";

const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const INITIATOR_EMAIL = `vitest-rr-initiator-${RUN_ID}@nsu.edu.bd`;
const INITIATOR2_EMAIL = `vitest-rr-initiator2-${RUN_ID}@nsu.edu.bd`;
const joinerEmails = Array.from({ length: 4 }, (_, i) => `vitest-rr-joiner-${i}-${RUN_ID}@nsu.edu.bd`);
const allEmails = [INITIATOR_EMAIL, INITIATOR2_EMAIL, ...joinerEmails];

let initiatorToken: string;
let initiator2Token: string;
let joinerTokens: string[] = [];
let requestId: string;
let geoRequestId: string;

async function createTestUser(email: string) {
  const passwordHash = await bcrypt.hash("testpass123", 10);
  const user = await prisma.user.create({
    data: { name: "RR Test User", email, passwordHash, university: "NSU" },
  });
  return signToken({ sub: user.id, name: user.name, email: user.email, university: user.university });
}

beforeAll(async () => {
  initiatorToken = await createTestUser(INITIATOR_EMAIL);
  initiator2Token = await createTestUser(INITIATOR2_EMAIL);
  joinerTokens = await Promise.all(joinerEmails.map(createTestUser));
});

afterAll(async () => {
  for (const id of [requestId, geoRequestId].filter(Boolean)) {
    await prisma.rideRequestParticipant.deleteMany({ where: { requestId: id } });
    await prisma.rideRequest.deleteMany({ where: { id } });
  }
  await prisma.user.deleteMany({ where: { email: { in: allEmails } } });
  await prisma.$disconnect();
});

describe("POST /api/ride-requests/:id/join — participant cap", () => {
  it("posts a request as the initiator", async () => {
    const res = await request(app)
      .post("/api/ride-requests")
      .set("Authorization", `Bearer ${initiatorToken}`)
      .send({
        origin: "Dhanmondi",
        destination: "Bashundhara",
        university: "NSU",
        desiredTime: new Date(Date.now() + 3600_000).toISOString(),
        pickupPoint: "Dhanmondi 27",
        dropoffPoint: "Bashundhara Gate 4",
      });
    expect(res.status).toBe(201);
    requestId = res.body.request.id;
    expect(res.body.request.seatsNeeded).toBe(1);
  });

  it("allows up to 3 more joiners (4 total)", async () => {
    for (const jt of joinerTokens.slice(0, 3)) {
      const res = await request(app)
        .post(`/api/ride-requests/${requestId}/join`)
        .set("Authorization", `Bearer ${jt}`)
        .send({ pickupPoint: "Somewhere nearby", dropoffPoint: "Somewhere else" });
      expect(res.status).toBe(200);
    }
  });

  it("rejects a 5th joiner once the pool is full", async () => {
    const res = await request(app)
      .post(`/api/ride-requests/${requestId}/join`)
      .set("Authorization", `Bearer ${joinerTokens[3]}`)
      .send({ pickupPoint: "Somewhere nearby", dropoffPoint: "Somewhere else" });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/full/i);
  });
});

describe("GET /api/ride-requests/joinable", () => {
  // Same Dhanmondi -> Bashundhara line used in rides.test.ts's /nearby cases.
  const routeStart = { lat: 23.7461, lng: 90.3742 };
  const routeEnd = { lat: 23.8103, lng: 90.4215 };

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/ride-requests")
      .set("Authorization", `Bearer ${initiator2Token}`)
      .send({
        origin: "Dhanmondi",
        originLat: routeStart.lat,
        originLng: routeStart.lng,
        destination: "Bashundhara",
        destLat: routeEnd.lat,
        destLng: routeEnd.lng,
        university: "NSU",
        desiredTime: new Date(Date.now() + 3600_000).toISOString(),
        pickupPoint: "Dhanmondi 27",
        dropoffPoint: "Bashundhara Gate 4",
      });
    expect(res.status).toBe(201);
    geoRequestId = res.body.request.id;
  });

  it("does not show the initiator their own pool request", async () => {
    const res = await request(app)
      .get("/api/ride-requests/joinable")
      .set("Authorization", `Bearer ${initiator2Token}`)
      .query({ originLat: routeStart.lat, originLng: routeStart.lng, destLat: routeEnd.lat, destLng: routeEnd.lng });
    expect(res.status).toBe(200);
    expect(res.body.requests.map((r: { id: string }) => r.id)).not.toContain(geoRequestId);
  });

  it("shows a matching pool request to a different passenger searching the same route", async () => {
    const res = await request(app)
      .get("/api/ride-requests/joinable")
      .set("Authorization", `Bearer ${joinerTokens[3]}`)
      .query({ originLat: routeStart.lat, originLng: routeStart.lng, destLat: routeEnd.lat, destLng: routeEnd.lng });
    expect(res.status).toBe(200);
    expect(res.body.requests.map((r: { id: string }) => r.id)).toContain(geoRequestId);
  });

  it("excludes it for a searcher whose route is nowhere near it", async () => {
    const res = await request(app)
      .get("/api/ride-requests/joinable")
      .set("Authorization", `Bearer ${joinerTokens[3]}`)
      .query({ originLat: 24.5, originLng: 91.5, destLat: 24.6, destLng: 91.6 });
    expect(res.status).toBe(200);
    expect(res.body.requests.map((r: { id: string }) => r.id)).not.toContain(geoRequestId);
  });
});
