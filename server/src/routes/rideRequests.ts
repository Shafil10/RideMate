import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { matchToRoute } from "../lib/geo.js";
import { computeSegmentFare } from "./rides.js";

const router = Router();

// Initiator + up to this many more — matches a typical car's spare seats.
const MAX_POOL_PARTICIPANTS = 4;

function serializeRequest(request: {
  id: string;
  origin: string;
  originLat: number | null;
  originLng: number | null;
  destination: string;
  destLat: number | null;
  destLng: number | null;
  university: string;
  desiredTime: Date;
  status: string;
  createdAt: Date;
  initiator: { id: string; name: string };
  fulfilledByRideId: string | null;
  participants: {
    id: string;
    pickupPoint: string;
    pickupLat: number | null;
    pickupLng: number | null;
    dropoffPoint: string;
    dropoffLat: number | null;
    dropoffLng: number | null;
    rider: { id: string; name: string };
  }[];
}) {
  return {
    id: request.id,
    origin: request.origin,
    originLat: request.originLat,
    originLng: request.originLng,
    destination: request.destination,
    destLat: request.destLat,
    destLng: request.destLng,
    university: request.university,
    desiredTime: request.desiredTime.toISOString(),
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    initiatorId: request.initiator.id,
    initiatorName: request.initiator.name,
    fulfilledByRideId: request.fulfilledByRideId,
    seatsNeeded: request.participants.length,
    maxParticipants: MAX_POOL_PARTICIPANTS,
    participants: request.participants.map((p) => ({
      id: p.id,
      riderId: p.rider.id,
      riderName: p.rider.name,
      pickupPoint: p.pickupPoint,
      pickupLat: p.pickupLat,
      pickupLng: p.pickupLng,
      dropoffPoint: p.dropoffPoint,
      dropoffLat: p.dropoffLat,
      dropoffLng: p.dropoffLng,
    })),
  };
}

const requestInclude = {
  initiator: { select: { id: true, name: true } },
  participants: { include: { rider: { select: { id: true, name: true } } } },
} as const;

router.post("/", requireAuth, async (req, res) => {
  const {
    origin, originLat, originLng, destination, destLat, destLng, university, desiredTime,
    pickupPoint, pickupLat, pickupLng, dropoffPoint, dropoffLat, dropoffLng,
  } = req.body ?? {};

  if (!origin || !destination || !university || !desiredTime || !pickupPoint || !dropoffPoint) {
    return res.status(400).json({ error: "origin, destination, university, desiredTime, pickupPoint, and dropoffPoint are required." });
  }

  const request = await prisma.rideRequest.create({
    data: {
      origin, destination, university,
      originLat: typeof originLat === "number" ? originLat : null,
      originLng: typeof originLng === "number" ? originLng : null,
      destLat: typeof destLat === "number" ? destLat : null,
      destLng: typeof destLng === "number" ? destLng : null,
      desiredTime: new Date(desiredTime),
      initiatorId: req.user!.sub,
      participants: {
        create: {
          riderId: req.user!.sub,
          pickupPoint: String(pickupPoint).trim(),
          pickupLat: typeof pickupLat === "number" ? pickupLat : null,
          pickupLng: typeof pickupLng === "number" ? pickupLng : null,
          dropoffPoint: String(dropoffPoint).trim(),
          dropoffLat: typeof dropoffLat === "number" ? dropoffLat : null,
          dropoffLng: typeof dropoffLng === "number" ? dropoffLng : null,
        },
      },
    },
    include: requestInclude,
  });

  res.status(201).json({ request: serializeRequest(request) });
});

router.get("/", optionalAuth, async (req, res) => {
  const university = typeof req.query.university === "string" ? req.query.university : undefined;

  const requests = await prisma.rideRequest.findMany({
    where: { status: "open", ...(university ? { university } : {}) },
    include: requestInclude,
    orderBy: { desiredTime: "asc" },
  });

  res.json({ requests: requests.map(serializeRequest) });
});

router.get("/mine", requireAuth, async (req, res) => {
  const userId = req.user!.sub;

  const requests = await prisma.rideRequest.findMany({
    where: { OR: [{ initiatorId: userId }, { participants: { some: { riderId: userId } } }] },
    include: requestInclude,
    orderBy: { desiredTime: "desc" },
  });

  res.json({ requests: requests.map(serializeRequest) });
});

// Driver discovery: given a candidate route, finds open requests whose pickup AND
// dropoff both land within the match radius of that route (see matchToRoute), in
// the right order (pickup before dropoff along the direction of travel).
router.get("/nearby", requireAuth, async (req, res) => {
  const originLat = Number(req.query.originLat);
  const originLng = Number(req.query.originLng);
  const destLat = Number(req.query.destLat);
  const destLng = Number(req.query.destLng);
  const university = typeof req.query.university === "string" ? req.query.university : undefined;

  if (![originLat, originLng, destLat, destLng].every(Number.isFinite)) {
    return res.status(400).json({ error: "originLat, originLng, destLat, destLng are required." });
  }

  const routeStart = { lat: originLat, lng: originLng };
  const routeEnd = { lat: destLat, lng: destLng };

  const candidates = await prisma.rideRequest.findMany({
    where: { status: "open", ...(university ? { university } : {}) },
    include: requestInclude,
  });

  const nearby = candidates.filter((request) =>
    request.participants.every((p) => {
      if (p.pickupLat === null || p.pickupLng === null || p.dropoffLat === null || p.dropoffLng === null) return false;
      const pickupMatch = matchToRoute({ lat: p.pickupLat, lng: p.pickupLng }, routeStart, routeEnd);
      const dropoffMatch = matchToRoute({ lat: p.dropoffLat, lng: p.dropoffLng }, routeStart, routeEnd);
      return pickupMatch.withinRadius && dropoffMatch.withinRadius && dropoffMatch.t > pickupMatch.t;
    }),
  );

  res.json({ requests: nearby.map(serializeRequest) });
});

// Passenger discovery: given the same route a passenger just searched (see
// rides.ts's /nearby, which finds driver-offered rides on that route), this finds
// other students' OPEN pool requests going the same way — matched against the
// request's own origin->destination, the same geometry rides.ts uses — that
// still have a free slot, aren't the searcher's own, and the searcher hasn't
// already joined. Lets a passenger pool onto an existing request instead of
// starting a duplicate one, even when the initiator doesn't own a car.
router.get("/joinable", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const originLat = Number(req.query.originLat);
  const originLng = Number(req.query.originLng);
  const destLat = Number(req.query.destLat);
  const destLng = Number(req.query.destLng);
  const university = typeof req.query.university === "string" ? req.query.university : undefined;

  if (![originLat, originLng, destLat, destLng].every(Number.isFinite)) {
    return res.status(400).json({ error: "originLat, originLng, destLat, destLng are required." });
  }

  const passengerOrigin = { lat: originLat, lng: originLng };
  const passengerDest = { lat: destLat, lng: destLng };

  const candidates = await prisma.rideRequest.findMany({
    where: {
      status: "open",
      initiatorId: { not: userId },
      ...(university ? { university } : {}),
    },
    include: requestInclude,
  });

  const joinable = candidates
    .filter((r) => r.participants.length < MAX_POOL_PARTICIPANTS)
    .filter((r) => !r.participants.some((p) => p.rider.id === userId))
    .filter((r) => r.originLat !== null && r.originLng !== null && r.destLat !== null && r.destLng !== null)
    .filter((r) => {
      const routeStart = { lat: r.originLat!, lng: r.originLng! };
      const routeEnd = { lat: r.destLat!, lng: r.destLng! };
      const originMatch = matchToRoute(passengerOrigin, routeStart, routeEnd);
      const destMatch = matchToRoute(passengerDest, routeStart, routeEnd);
      return originMatch.withinRadius && destMatch.withinRadius && destMatch.t > originMatch.t;
    });

  res.json({ requests: joinable.map(serializeRequest) });
});

router.post("/:id/join", requireAuth, async (req, res) => {
  const { pickupPoint, pickupLat, pickupLng, dropoffPoint, dropoffLat, dropoffLng } = req.body ?? {};

  if (!pickupPoint || !dropoffPoint) {
    return res.status(400).json({ error: "pickupPoint and dropoffPoint are required." });
  }

  const request = await prisma.rideRequest.findUnique({
    where: { id: req.params.id },
    include: { participants: { select: { id: true } } },
  });
  if (!request) {
    return res.status(404).json({ error: "Request not found." });
  }
  if (request.status !== "open") {
    return res.status(409).json({ error: "This request is no longer open." });
  }
  if (request.participants.length >= MAX_POOL_PARTICIPANTS) {
    return res.status(409).json({ error: "This pool request is full." });
  }

  const existing = await prisma.rideRequestParticipant.findUnique({
    where: { requestId_riderId: { requestId: request.id, riderId: req.user!.sub } },
  });
  if (existing) {
    return res.status(409).json({ error: "You've already joined this request." });
  }

  await prisma.rideRequestParticipant.create({
    data: {
      requestId: request.id,
      riderId: req.user!.sub,
      pickupPoint: String(pickupPoint).trim(),
      pickupLat: typeof pickupLat === "number" ? pickupLat : null,
      pickupLng: typeof pickupLng === "number" ? pickupLng : null,
      dropoffPoint: String(dropoffPoint).trim(),
      dropoffLat: typeof dropoffLat === "number" ? dropoffLat : null,
      dropoffLng: typeof dropoffLng === "number" ? dropoffLng : null,
    },
  });

  const updated = await prisma.rideRequest.findUnique({ where: { id: request.id }, include: requestInclude });
  res.json({ request: serializeRequest(updated!) });
});

// Driver fulfills an open request — either attaching it to a Ride they already
// created (rideId), or creating a new Ride on the fly from the request's own
// origin/destination/time plus driver-provided seats/fare. Either way, one real
// Booking is created per pooled participant with a segment-based fare, so the
// existing rating/history/recommendation logic picks it up automatically.
router.post("/:id/fulfill", requireAuth, async (req, res) => {
  const { rideId, type, seatsTotal, farePerSeat } = req.body ?? {};

  const request = await prisma.rideRequest.findUnique({ where: { id: req.params.id }, include: requestInclude });
  if (!request) {
    return res.status(404).json({ error: "Request not found." });
  }
  if (request.status !== "open") {
    return res.status(409).json({ error: "This request is no longer open." });
  }

  let ride = rideId
    ? await prisma.ride.findUnique({ where: { id: String(rideId) } })
    : null;

  if (rideId && !ride) {
    return res.status(404).json({ error: "Ride not found." });
  }
  if (ride && ride.driverId !== req.user!.sub) {
    return res.status(403).json({ error: "You can only fulfill requests with a ride you're driving." });
  }

  const seatsNeeded = request.participants.length;

  if (ride) {
    if (ride.seatsTaken + seatsNeeded > ride.seatsTotal) {
      return res.status(409).json({ error: "Not enough free seats on that ride for this request." });
    }
  } else {
    const seats = Number(seatsTotal);
    if (!Number.isFinite(seats) || seats < seatsNeeded) {
      return res.status(400).json({ error: `seatsTotal must be at least ${seatsNeeded} to fulfill this request.` });
    }
    ride = await prisma.ride.create({
      data: {
        type: type === "shared-taxi" ? "shared-taxi" : "student-driver",
        origin: request.origin,
        originLat: request.originLat,
        originLng: request.originLng,
        destination: request.destination,
        destLat: request.destLat,
        destLng: request.destLng,
        university: request.university,
        departureTime: request.desiredTime,
        seatsTotal: seats,
        farePerSeat: Number(farePerSeat) || 0,
        driverId: req.user!.sub,
      },
    });
  }

  const rideForFare = ride;
  const bookingsData = request.participants.map((p) => ({
    rideId: rideForFare.id,
    riderId: p.riderId,
    pickupPoint: p.pickupPoint,
    pickupLat: p.pickupLat,
    pickupLng: p.pickupLng,
    dropoffPoint: p.dropoffPoint,
    dropoffLat: p.dropoffLat,
    dropoffLng: p.dropoffLng,
    fare: computeSegmentFare(
      rideForFare,
      { lat: p.pickupLat, lng: p.pickupLng },
      { lat: p.dropoffLat, lng: p.dropoffLng },
    ),
  }));

  const [, , updatedRequest] = await prisma.$transaction([
    prisma.booking.createMany({ data: bookingsData }),
    prisma.ride.update({ where: { id: rideForFare.id }, data: { seatsTaken: { increment: seatsNeeded } } }),
    prisma.rideRequest.update({
      where: { id: request.id },
      data: { status: "fulfilled", fulfilledByRideId: rideForFare.id },
      include: requestInclude,
    }),
  ]);

  res.json({ request: serializeRequest(updatedRequest), rideId: rideForFare.id });
});

router.post("/:id/cancel", requireAuth, async (req, res) => {
  const request = await prisma.rideRequest.findUnique({ where: { id: req.params.id } });
  if (!request) {
    return res.status(404).json({ error: "Request not found." });
  }

  if (request.initiatorId === req.user!.sub) {
    const updated = await prisma.rideRequest.update({
      where: { id: request.id },
      data: { status: "cancelled" },
      include: requestInclude,
    });
    return res.json({ request: serializeRequest(updated) });
  }

  const participant = await prisma.rideRequestParticipant.findUnique({
    where: { requestId_riderId: { requestId: request.id, riderId: req.user!.sub } },
  });
  if (!participant) {
    return res.status(404).json({ error: "You're not part of this request." });
  }

  await prisma.rideRequestParticipant.delete({ where: { id: participant.id } });
  const updated = await prisma.rideRequest.findUnique({ where: { id: request.id }, include: requestInclude });
  res.json({ request: serializeRequest(updated!) });
});

export default router;
