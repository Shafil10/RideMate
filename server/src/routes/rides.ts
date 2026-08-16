import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { haversineKm } from "../lib/geo.js";

const router = Router();

const CANCELLATION_FEE = 50;

// A driver needs a handful of ratings before a reliability label means anything —
// below this, we show the raw stars only rather than a label that would be noise.
const MIN_RATINGS_FOR_LABEL = 3;

function reliabilityLabel(average: number, count: number): string | null {
  if (count < MIN_RATINGS_FOR_LABEL) return null;
  if (average >= 4.5) return "Highly reliable";
  if (average < 3.5) return "Mixed feedback";
  return null;
}

async function getRatingSummaries(
  userIds: string[],
): Promise<Map<string, { average: number; count: number; ridesCompleted: number; label: string | null }>> {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return new Map();

  const [grouped, completedCounts] = await Promise.all([
    prisma.rating.groupBy({
      by: ["ratedId"],
      where: { ratedId: { in: uniqueIds } },
      _avg: { score: true },
      _count: { score: true },
    }),
    prisma.ride.groupBy({
      by: ["driverId"],
      where: { driverId: { in: uniqueIds }, departureTime: { lt: new Date() } },
      _count: { id: true },
    }),
  ]);

  const completedMap = new Map(completedCounts.map((c) => [c.driverId, c._count.id]));

  const map = new Map<string, { average: number; count: number; ridesCompleted: number; label: string | null }>();
  for (const g of grouped) {
    const average = Math.round((g._avg.score ?? 0) * 10) / 10;
    const count = g._count.score;
    map.set(g.ratedId, {
      average,
      count,
      ridesCompleted: completedMap.get(g.ratedId) ?? 0,
      label: reliabilityLabel(average, count),
    });
  }
  return map;
}

function serializeRide(
  ride: {
    id: string;
    type: string;
    origin: string;
    originLat: number | null;
    originLng: number | null;
    destination: string;
    destLat: number | null;
    destLng: number | null;
    university: string;
    departureTime: Date;
    seatsTotal: number;
    seatsTaken: number;
    farePerSeat: number;
    createdAt: Date;
    driverId: string;
    driver: { name: string };
  },
  myBooking?: { id: string; pickupPoint: string; pickupLat: number | null; pickupLng: number | null } | null,
  isFavorited = false,
  driverRating?: { average: number; count: number; ridesCompleted: number; label: string | null } | null,
) {
  return {
    id: ride.id,
    type: ride.type,
    origin: ride.origin,
    originLat: ride.originLat,
    originLng: ride.originLng,
    destination: ride.destination,
    destLat: ride.destLat,
    destLng: ride.destLng,
    university: ride.university,
    departureTime: ride.departureTime.toISOString(),
    seatsTotal: ride.seatsTotal,
    seatsTaken: ride.seatsTaken,
    farePerSeat: ride.farePerSeat,
    driverId: ride.driverId,
    driverName: ride.driver.name,
    driverRating: driverRating ?? null,
    createdAt: ride.createdAt.toISOString(),
    myBooking: myBooking ?? null,
    isFavorited,
  };
}

router.get("/", optionalAuth, async (req, res) => {
  const rides = await prisma.ride.findMany({
    include: {
      driver: { select: { name: true } },
      bookings: {
        where: { status: "confirmed" },
        select: { id: true, pickupPoint: true, pickupLat: true, pickupLng: true, riderId: true },
      },
      favorites: req.user ? { where: { userId: req.user.sub }, select: { id: true } } : false,
    },
    orderBy: { departureTime: "asc" },
  });

  const ratingMap = await getRatingSummaries(rides.map((r) => r.driverId));

  res.json({
    rides: rides.map((ride) => {
      const myBooking = req.user ? ride.bookings.find((b) => b.riderId === req.user!.sub) : undefined;
      const isFavorited = "favorites" in ride ? ride.favorites.length > 0 : false;
      return serializeRide(ride, myBooking, isFavorited, ratingMap.get(ride.driverId) ?? null);
    }),
  });
});

router.get("/recommended", requireAuth, async (req, res) => {
  const userId = req.user!.sub;

  const [pastBookings, user] = await Promise.all([
    prisma.booking.findMany({
      where: { riderId: userId },
      include: { ride: { select: { origin: true, originLat: true, originLng: true, destination: true, destLat: true, destLng: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { university: true } }),
  ]);

  const originCounts = new Map<string, number>();
  const destCounts = new Map<string, number>();
  const originPoints: { lat: number; lng: number }[] = [];
  const destPoints: { lat: number; lng: number }[] = [];
  for (const b of pastBookings) {
    originCounts.set(b.ride.origin, (originCounts.get(b.ride.origin) ?? 0) + 1);
    destCounts.set(b.ride.destination, (destCounts.get(b.ride.destination) ?? 0) + 1);
    if (b.ride.originLat !== null && b.ride.originLng !== null) originPoints.push({ lat: b.ride.originLat, lng: b.ride.originLng });
    if (b.ride.destLat !== null && b.ride.destLng !== null) destPoints.push({ lat: b.ride.destLat, lng: b.ride.destLng });
  }

  // Rides within this radius of a route the rider has taken before count as "on the way".
  const PROXIMITY_RADIUS_KM = 3;

  function proximityScore(points: { lat: number; lng: number }[], lat: number | null, lng: number | null): number {
    if (lat === null || lng === null || points.length === 0) return 0;
    const nearestKm = Math.min(...points.map((p) => haversineKm(p.lat, p.lng, lat, lng)));
    if (nearestKm > PROXIMITY_RADIUS_KM) return 0;
    return 2 * (1 - nearestKm / PROXIMITY_RADIUS_KM);
  }

  const candidates = await prisma.ride.findMany({
    where: { driverId: { not: userId }, departureTime: { gte: new Date() } },
    include: {
      driver: { select: { name: true } },
      bookings: {
        where: { status: "confirmed" },
        select: { id: true, riderId: true, pickupPoint: true, pickupLat: true, pickupLng: true },
      },
      favorites: { where: { userId }, select: { id: true } },
    },
    orderBy: { departureTime: "asc" },
  });

  const scored = candidates
    .filter((ride) => ride.seatsTaken < ride.seatsTotal)
    .filter((ride) => !ride.bookings.some((b) => b.riderId === userId))
    .map((ride) => {
      let score = originCounts.get(ride.origin) ?? 0;
      score += destCounts.get(ride.destination) ?? 0;
      score += proximityScore(originPoints, ride.originLat, ride.originLng);
      score += proximityScore(destPoints, ride.destLat, ride.destLng);
      if (user?.university === ride.university) score += 0.5;
      return { ride, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.ride.departureTime.getTime() - b.ride.departureTime.getTime())
    .slice(0, 5);

  const ratingMap = await getRatingSummaries(scored.map(({ ride }) => ride.driverId));

  res.json({
    rides: scored.map(({ ride }) => {
      const myBooking = ride.bookings.find((b) => b.riderId === userId);
      return serializeRide(ride, myBooking, ride.favorites.length > 0, ratingMap.get(ride.driverId) ?? null);
    }),
  });
});

router.post("/", requireAuth, async (req, res) => {
  const { type, origin, originLat, originLng, destination, destLat, destLng, university, departureTime, seatsTotal, farePerSeat } =
    req.body ?? {};

  if (!origin || !destination || !university || !departureTime) {
    return res.status(400).json({ error: "Missing required ride fields." });
  }

  const ride = await prisma.ride.create({
    data: {
      type: type === "shared-taxi" ? "shared-taxi" : "student-driver",
      origin,
      originLat: typeof originLat === "number" ? originLat : null,
      originLng: typeof originLng === "number" ? originLng : null,
      destination,
      destLat: typeof destLat === "number" ? destLat : null,
      destLng: typeof destLng === "number" ? destLng : null,
      university,
      departureTime: new Date(departureTime),
      seatsTotal: Number(seatsTotal) || 1,
      farePerSeat: Number(farePerSeat) || 0,
      driverId: req.user!.sub,
    },
    include: { driver: { select: { name: true } } },
  });

  res.status(201).json({ ride: serializeRide(ride) });
});

router.post("/:id/join", requireAuth, async (req, res) => {
  const { pickupPoint, pickupLat, pickupLng } = req.body ?? {};

  if (!pickupPoint || !String(pickupPoint).trim()) {
    return res.status(400).json({ error: "A pickup point on the ride's route is required." });
  }

  const ride = await prisma.ride.findUnique({ where: { id: req.params.id }, include: { driver: { select: { name: true } } } });

  if (!ride) {
    return res.status(404).json({ error: "Ride not found." });
  }

  if (ride.seatsTaken >= ride.seatsTotal) {
    return res.status(409).json({ error: "This ride is already full." });
  }

  const existing = await prisma.booking.findFirst({
    where: { rideId: ride.id, riderId: req.user!.sub, status: "confirmed" },
  });

  if (existing) {
    return res.status(409).json({ error: "You already have a booking on this ride." });
  }

  const [booking, updated] = await prisma.$transaction([
    prisma.booking.create({
      data: {
        rideId: ride.id,
        riderId: req.user!.sub,
        pickupPoint: String(pickupPoint).trim(),
        pickupLat: typeof pickupLat === "number" ? pickupLat : null,
        pickupLng: typeof pickupLng === "number" ? pickupLng : null,
      },
    }),
    prisma.ride.update({
      where: { id: ride.id },
      data: { seatsTaken: { increment: 1 } },
      include: { driver: { select: { name: true } } },
    }),
  ]);

  res.json({
    ride: serializeRide(updated, {
      id: booking.id,
      pickupPoint: booking.pickupPoint,
      pickupLat: booking.pickupLat,
      pickupLng: booking.pickupLng,
    }),
  });
});

router.post("/:id/cancel", requireAuth, async (req, res) => {
  const booking = await prisma.booking.findFirst({
    where: { rideId: req.params.id, riderId: req.user!.sub, status: "confirmed" },
  });

  if (!booking) {
    return res.status(404).json({ error: "You don't have an active booking on this ride." });
  }

  const [, updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "cancelled", cancellationFee: CANCELLATION_FEE, cancelledAt: new Date() },
    }),
    prisma.ride.update({
      where: { id: req.params.id },
      data: { seatsTaken: { decrement: 1 } },
      include: { driver: { select: { name: true } } },
    }),
  ]);

  res.json({ ride: serializeRide(updated, null), cancellationFee: CANCELLATION_FEE });
});

router.post("/:id/favorite", requireAuth, async (req, res) => {
  const existing = await prisma.favorite.findUnique({
    where: { userId_rideId: { userId: req.user!.sub, rideId: req.params.id } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return res.json({ isFavorited: false });
  }

  const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
  if (!ride) {
    return res.status(404).json({ error: "Ride not found." });
  }

  await prisma.favorite.create({ data: { userId: req.user!.sub, rideId: req.params.id } });
  res.json({ isFavorited: true });
});

// A route needs to repeat at least this many times before we call it "recurring" —
// below this it's just coincidence, not a pattern worth surfacing.
const MIN_OCCURRENCES_FOR_PATTERN = 3;

router.get("/recurring", requireAuth, async (req, res) => {
  const userId = req.user!.sub;

  const bookings = await prisma.booking.findMany({
    where: { riderId: userId, status: "confirmed" },
    include: { ride: { select: { origin: true, destination: true, university: true, departureTime: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const groups = new Map<
    string,
    { origin: string; destination: string; university: string; hours: number[]; count: number }
  >();

  for (const b of bookings) {
    const key = `${b.ride.origin}|${b.ride.destination}`;
    const hour = b.ride.departureTime.getHours();
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.hours.push(hour);
    } else {
      groups.set(key, {
        origin: b.ride.origin,
        destination: b.ride.destination,
        university: b.ride.university,
        hours: [hour],
        count: 1,
      });
    }
  }

  const patterns = [...groups.values()]
    .filter((g) => g.count >= MIN_OCCURRENCES_FOR_PATTERN)
    .map((g) => {
      const avgHour = Math.round(g.hours.reduce((a, b) => a + b, 0) / g.hours.length);
      return {
        origin: g.origin,
        destination: g.destination,
        university: g.university,
        count: g.count,
        typicalHour: avgHour,
      };
    })
    .sort((a, b) => b.count - a.count);

  res.json({ patterns });
});

router.get("/pickup-suggestions", requireAuth, async (req, res) => {
  const userId = req.user!.sub;

  const bookings = await prisma.booking.findMany({
    where: { riderId: userId, status: "confirmed" },
    select: { pickupPoint: true, pickupLat: true, pickupLng: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const counts = new Map<string, { count: number; lat: number | null; lng: number | null }>();
  for (const b of bookings) {
    const existing = counts.get(b.pickupPoint);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(b.pickupPoint, { count: 1, lat: b.pickupLat, lng: b.pickupLng });
    }
  }

  const suggestions = [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([pickupPoint, info]) => ({ pickupPoint, count: info.count, lat: info.lat, lng: info.lng }));

  res.json({ suggestions });
});

router.get("/history", requireAuth, async (req, res) => {
  const userId = req.user!.sub;

  const rides = await prisma.ride.findMany({
    where: {
      departureTime: { lt: new Date() },
      OR: [{ driverId: userId }, { bookings: { some: { riderId: userId, status: "confirmed" } } }],
    },
    include: {
      driver: { select: { id: true, name: true } },
      bookings: {
        where: { status: "confirmed" },
        select: { riderId: true, rider: { select: { name: true } } },
      },
    },
    orderBy: { departureTime: "desc" },
  });

  const rideIds = rides.map((r) => r.id);
  const myRatings = await prisma.rating.findMany({
    where: { rideId: { in: rideIds }, raterId: userId },
    select: { rideId: true, ratedId: true },
  });
  const alreadyRated = new Set(myRatings.map((r) => `${r.rideId}:${r.ratedId}`));

  const history = rides.map((ride) => {
    const isDriver = ride.driverId === userId;
    const counterparts = isDriver
      ? ride.bookings.map((b) => ({
          userId: b.riderId,
          name: b.rider.name,
          alreadyRated: alreadyRated.has(`${ride.id}:${b.riderId}`),
        }))
      : [
          {
            userId: ride.driver.id,
            name: ride.driver.name,
            alreadyRated: alreadyRated.has(`${ride.id}:${ride.driver.id}`),
          },
        ];

    return {
      id: ride.id,
      origin: ride.origin,
      destination: ride.destination,
      departureTime: ride.departureTime.toISOString(),
      type: ride.type,
      isDriver,
      counterparts,
    };
  });

  res.json({ history });
});

router.post("/:id/ratings", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const { ratedUserId, score, comment } = req.body ?? {};

  const numericScore = Number(score);
  if (!ratedUserId || !Number.isInteger(numericScore) || numericScore < 1 || numericScore > 5) {
    return res.status(400).json({ error: "A ratedUserId and an integer score from 1 to 5 are required." });
  }

  const ride = await prisma.ride.findUnique({
    where: { id: req.params.id },
    include: { bookings: { where: { status: "confirmed" }, select: { riderId: true } } },
  });

  if (!ride) {
    return res.status(404).json({ error: "Ride not found." });
  }

  if (ride.departureTime > new Date()) {
    return res.status(400).json({ error: "You can only rate a ride after it has departed." });
  }

  const isDriver = ride.driverId === userId;
  const isRider = ride.bookings.some((b) => b.riderId === userId);

  if (!isDriver && !isRider) {
    return res.status(403).json({ error: "You didn't take part in this ride." });
  }

  const validTarget = isDriver
    ? ride.bookings.some((b) => b.riderId === ratedUserId)
    : ratedUserId === ride.driverId;

  if (!validTarget) {
    return res.status(400).json({ error: "You can only rate someone you actually rode with on this trip." });
  }

  if (ratedUserId === userId) {
    return res.status(400).json({ error: "You can't rate yourself." });
  }

  try {
    const rating = await prisma.rating.create({
      data: {
        rideId: ride.id,
        raterId: userId,
        ratedId: ratedUserId,
        score: numericScore,
        comment: typeof comment === "string" && comment.trim() ? comment.trim() : null,
      },
    });
    res.status(201).json({ rating });
  } catch {
    res.status(409).json({ error: "You've already rated this person for this ride." });
  }
});

export default router;
