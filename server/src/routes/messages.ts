import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const MAX_MESSAGE_LENGTH = 1000;

// Verifies the caller is actually allowed to message `otherUserId` about
// `rideId` — either the caller is the ride's driver and otherUserId is a
// rider with a confirmed booking on it, or the caller is that rider and
// otherUserId is the driver. Returns null (and the route 404/403s) otherwise,
// so a thread can never be opened between two people who were never actually
// matched on this ride.
async function assertConnected(rideId: string, callerId: string, otherUserId: string) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    select: { id: true, driverId: true },
  });
  if (!ride) return null;

  if (ride.driverId === callerId) {
    const booking = await prisma.booking.findFirst({
      where: { rideId, riderId: otherUserId, status: "confirmed" },
      select: { id: true },
    });
    return booking ? ride : null;
  }

  if (ride.driverId === otherUserId) {
    const booking = await prisma.booking.findFirst({
      where: { rideId, riderId: callerId, status: "confirmed" },
      select: { id: true },
    });
    return booking ? ride : null;
  }

  return null;
}

router.get("/:rideId/:otherUserId", requireAuth, async (req, res) => {
  const { rideId, otherUserId } = req.params;
  const callerId = req.user!.sub;

  const ride = await assertConnected(rideId, callerId, otherUserId);
  if (!ride) {
    return res.status(403).json({ error: "You can only message someone you're matched with on a ride." });
  }

  const messages = await prisma.message.findMany({
    where: {
      rideId,
      OR: [
        { senderId: callerId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: callerId },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  res.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      isMine: m.senderId === callerId,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

router.post("/:rideId/:otherUserId", requireAuth, async (req, res) => {
  const { rideId, otherUserId } = req.params;
  const callerId = req.user!.sub;
  const { body } = req.body ?? {};

  const trimmed = typeof body === "string" ? body.trim() : "";
  if (!trimmed) {
    return res.status(400).json({ error: "A message body is required." });
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Messages can't be longer than ${MAX_MESSAGE_LENGTH} characters.` });
  }

  const ride = await assertConnected(rideId, callerId, otherUserId);
  if (!ride) {
    return res.status(403).json({ error: "You can only message someone you're matched with on a ride." });
  }

  const message = await prisma.message.create({
    data: { rideId, senderId: callerId, recipientId: otherUserId, body: trimmed },
  });

  res.status(201).json({
    message: {
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      isMine: true,
      createdAt: message.createdAt.toISOString(),
    },
  });
});

export default router;
