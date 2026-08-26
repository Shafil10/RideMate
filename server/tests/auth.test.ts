import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";

const capturedOtps = new Map<string, string>();

vi.mock("../src/email/resend.js", () => ({
  isResendConfigured: () => true,
  sendOtpEmail: vi.fn(async (to: string, _name: string, code: string) => {
    capturedOtps.set(to, code);
  }),
  sendPasswordResetEmail: vi.fn(async (to: string, _name: string, code: string) => {
    capturedOtps.set(to, code);
  }),
}));

const { default: app } = await import("../src/app.js");
const { prisma } = await import("../src/prisma.js");

const TEST_EMAIL_PREFIX = "vitest-";
const runId = Date.now();

function testEmail(label: string) {
  return `${TEST_EMAIL_PREFIX}${label}-${runId}@nsu.edu.bd`;
}

// A directly-created user (bypassing the OTP flow) to test login against —
// keeps these tests independent of whatever seed data happens to exist.
const existingUserEmail = testEmail("existing");
const existingUserPassword = "existingpass123";

beforeAll(async () => {
  const passwordHash = await bcrypt.hash(existingUserPassword, 10);
  await prisma.user.create({
    data: { name: "Existing Test User", email: existingUserEmail, passwordHash, university: "NSU" },
  });
});

afterAll(async () => {
  await prisma.pendingSignup.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
  await prisma.passwordReset.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
  await prisma.$disconnect();
});

describe("POST /api/auth/login", () => {
  it("rejects an unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail("no-such-user"), password: "whatever123" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });

  it("logs in an existing account with the correct password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: existingUserEmail, password: existingUserPassword });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(existingUserEmail);
  });

  it("rejects a correct email with the wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: existingUserEmail, password: "wrong-password" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/signup/start + /verify", () => {
  it("requires vehicle details for a driver signup", async () => {
    const email = testEmail("driver-novehicle");
    const res = await request(app).post("/api/auth/signup/start").send({
      name: "Test Driver",
      email,
      password: "testpass123",
      university: "NSU",
      defaultRole: "driver",
    });
    expect(res.status).toBe(400);
  });

  it("completes a passenger signup end to end with the correct OTP", async () => {
    const email = testEmail("passenger");

    const start = await request(app).post("/api/auth/signup/start").send({
      name: "Test Passenger",
      email,
      password: "testpass123",
      university: "NSU",
      defaultRole: "passenger",
    });
    expect(start.status).toBe(200);

    const code = capturedOtps.get(email);
    expect(code).toMatch(/^\d{6}$/);

    const wrong = await request(app).post("/api/auth/signup/verify").send({ email, code: "000000" });
    expect(wrong.status).toBe(400);

    const verify = await request(app).post("/api/auth/signup/verify").send({ email, code });
    expect(verify.status).toBe(201);
    expect(verify.body.token).toBeTruthy();
    expect(verify.body.user.defaultRole).toBe("passenger");
  });

  it("completes a driver signup with vehicle details", async () => {
    const email = testEmail("driver");

    await request(app).post("/api/auth/signup/start").send({
      name: "Test Driver",
      email,
      password: "testpass123",
      university: "NSU",
      defaultRole: "driver",
      vehicle: { make: "Toyota", model: "Axio", color: "White", plate: "DHA-1234", seats: 4 },
    });

    const code = capturedOtps.get(email);
    const verify = await request(app).post("/api/auth/signup/verify").send({ email, code });
    expect(verify.status).toBe(201);
    expect(verify.body.user.vehicleMake).toBe("Toyota");
    expect(verify.body.user.vehicleSeats).toBe(4);
  });

  it("rejects a duplicate signup for an existing account", async () => {
    const res = await request(app).post("/api/auth/signup/start").send({
      name: "Existing Test User",
      email: existingUserEmail,
      password: "whatever123",
      university: "NSU",
      defaultRole: "passenger",
    });
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/reset-password/start + /verify", () => {
  it("rejects a reset request for an unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password/start")
      .send({ email: testEmail("no-account") });
    expect(res.status).toBe(404);
  });

  it("resets the password with the correct OTP and logs in with the new one", async () => {
    const email = testEmail("resetflow");

    await request(app).post("/api/auth/signup/start").send({
      name: "Reset Test",
      email,
      password: "originalpass123",
      university: "NSU",
      defaultRole: "passenger",
    });
    const signupCode = capturedOtps.get(email)!;
    await request(app).post("/api/auth/signup/verify").send({ email, code: signupCode });

    const resetStart = await request(app).post("/api/auth/reset-password/start").send({ email });
    expect(resetStart.status).toBe(200);

    const resetCode = capturedOtps.get(email)!;
    expect(resetCode).toMatch(/^\d{6}$/);

    const badCode = await request(app)
      .post("/api/auth/reset-password/verify")
      .send({ email, code: "111111", newPassword: "newpass456" });
    expect(badCode.status).toBe(400);

    const verify = await request(app)
      .post("/api/auth/reset-password/verify")
      .send({ email, code: resetCode, newPassword: "newpass456" });
    expect(verify.status).toBe(200);

    const oldLogin = await request(app).post("/api/auth/login").send({ email, password: "originalpass123" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post("/api/auth/login").send({ email, password: "newpass456" });
    expect(newLogin.status).toBe(200);
  });
});
