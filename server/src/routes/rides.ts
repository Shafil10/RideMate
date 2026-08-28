import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { haversineKm, matchToRoute, estimateFairFare } from "../lib/geo.js";

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
    driver: {
      name: string;
      vehicleMake: string | null;
      vehicleModel: string | null;
      vehicleColor: string | null;
      vehiclePlate: string | null;
      vehicleSeats: number | null;
    };
  },
  myBooking?: {
    id: string;
    pickupPoint: string;
    pickupLat: number | null;
    pickupLng: number | null;
    dropoffPoint?: string | null;
    dropoffLat?: number | null;
    dropoffLng?: number | null;
    fare?: number | null;
  } | null,
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
    driverVehicle:
      ride.driver.vehicleMake || ride.driver.vehicleModel || ride.driver.vehiclePlate
        ? {
            make: ride.driver.vehicleMake,
            model: ride.driver.vehicleModel,
            color: ride.driver.vehicleColor,
            plate: ride.driver.vehiclePlate,
            seats: ride.driver.vehicleSeats,
          }
        : null,
    createdAt: ride.createdAt.toISOString(),
    myBooking: myBooking ?? null,
    isFavorited,
  };
}

router.get("/", optionalAuth, async (req, res) => {
  const rides = await prisma.ride.findMany({
    include: {
      driver: { select: { name: true, vehicleMake: true, vehicleModel: true, vehicleColor: true, vehiclePlate: true, vehicleSeats: true } },
      bookings: {
        where: { status: "confirmed" },
        select: {
          id: true, pickupPoint: true, pickupLat: true, pickupLng: true,
          dropoffPoint: true, dropoffLat: true, dropoffLng: true, fare: true, riderId: true,
        },
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

// A driver's own rides with the full passenger list (not just the caller's own
// booking, unlike GET / and /recommended) — powers the per-passenger fare
// breakdown on the "My Offered Rides" screen.
router.get("/mine", requireAuth, async (req, res) => {
  const userId = req.user!.sub;

  const rides = await prisma.ride.findMany({
    where: { driverId: userId },
    include: {
      driver: { select: { name: true, vehicleMake: true, vehicleModel: true, vehicleColor: true, vehiclePlate: true, vehicleSeats: true } },
      bookings: {
        where: { status: "confirmed" },
        select: {
          id: true, riderId: true, pickupPoint: true, pickupLat: true, pickupLng: true,
          dropoffPoint: true, dropoffLat: true, dropoffLng: true, fare: true,
          rider: { select: { name: true } },
        },
      },
    },
    orderBy: { departureTime: "desc" },
  });

  res.json({
    rides: rides.map((ride) => ({
      ...serializeRide(ride),
      bookings: ride.bookings.map((b) => ({
        id: b.id,
        riderId: b.riderId,
        riderName: b.rider.name,
        pickupPoint: b.pickupPoint,
        pickupLat: b.pickupLat,
        pickupLng: b.pickupLng,
        dropoffPoint: b.dropoffPoint,
        dropoffLat: b.dropoffLat,
        dropoffLng: b.dropoffLng,
        fare: b.fare ?? ride.farePerSeat,
      })),
    })),
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
      driver: { select: { name: true, vehicleMake: true, vehicleModel: true, vehicleColor: true, vehiclePlate: true, vehicleSeats: true } },
      bookings: {
        where: { status: "confirmed" },
        select: {
          id: true, riderId: true, pickupPoint: true, pickupLat: true, pickupLng: true,
          dropoffPoint: true, dropoffLat: true, dropoffLng: true, fare: true,
        },
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

// Ad-hoc search: a passenger types an origin+destination they want *right now*
// (not their booking history, unlike /recommended) and this finds already-offered
// rides whose own route passes near both points, in the right order — the same
// matchToRoute geometry /ride-requests/nearby uses for driver-side matching,
// just inverted: here the *ride's* origin->destination is the route being tested,
// and the passenger's typed points are the candidates.
router.get("/nearby", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const originLat = Number(req.query.originLat);
  const originLng = Number(req.query.originLng);
  const destLat = Number(req.query.destLat);
  const destLng = Number(req.query.destLng);
  const university = typeof req.query.university === "string" ? req.query.university : undefined;
  const desiredTime = typeof req.query.desiredTime === "string" ? new Date(req.query.desiredTime) : null;

  if (![originLat, originLng, destLat, destLng].every(Number.isFinite)) {
    return res.status(400).json({ error: "originLat, originLng, destLat, destLng are required." });
  }

  const passengerOrigin = { lat: originLat, lng: originLng };
  const passengerDest = { lat: destLat, lng: destLng };

  const candidates = await prisma.ride.findMany({
    where: {
      departureTime: { gte: new Date() },
      ...(university ? { university } : {}),
    },
    include: {
      driver: { select: { name: true, vehicleMake: true, vehicleModel: true, vehicleColor: true, vehiclePlate: true, vehicleSeats: true } },
      bookings: {
        where: { status: "confirmed" },
        select: {
          id: true, riderId: true, pickupPoint: true, pickupLat: true, pickupLng: true,
          dropoffPoint: true, dropoffLat: true, dropoffLng: true, fare: true,
        },
      },
      favorites: { where: { userId }, select: { id: true } },
    },
  });

  const matches = candidates
    .filter((ride) => ride.seatsTaken < ride.seatsTotal)
    .filter((ride) => ride.originLat !== null && ride.originLng !== null && ride.destLat !== null && ride.destLng !== null)
    .filter((ride) => {
      const routeStart = { lat: ride.originLat!, lng: ride.originLng! };
      const routeEnd = { lat: ride.destLat!, lng: ride.destLng! };
      const originMatch = matchToRoute(passengerOrigin, routeStart, routeEnd);
      const destMatch = matchToRoute(passengerDest, routeStart, routeEnd);
      return originMatch.withinRadius && destMatch.withinRadius && destMatch.t > originMatch.t;
    })
    .sort((a, b) =>
      desiredTime
        ? Math.abs(a.departureTime.getTime() - desiredTime.getTime()) - Math.abs(b.departureTime.getTime() - desiredTime.getTime())
        : a.departureTime.getTime() - b.departureTime.getTime(),
    );

  const ratingMap = await getRatingSummaries(matches.map((ride) => ride.driverId));

  res.json({
    rides: matches.map((ride) => {
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
    include: { driver: { select: { name: true, vehicleMake: true, vehicleModel: true, vehicleColor: true, vehiclePlate: true, vehicleSeats: true } } },
  });

  res.status(201).json({ ride: serializeRide(ride) });
});

// Computes a fair per-passenger fare from how much of the driver's route this
// rider actually uses. Falls back to the ride's flat farePerSeat when we don't
// have enough coordinates to place the rider on the route — e.g. a caller that
// hasn't been rebuilt to send a dropoff point yet, or a ride with no pinned
// origin/destination. This keeps existing point-to-point joins unchanged.
export function computeSegmentFare(
  ride: { originLat: number | null; originLng: number | null; destLat: number | null; destLng: number | null; departureTime: Date; farePerSeat: number },
  pickup: { lat: number | null; lng: number | null },
  dropoff: { lat: number | null; lng: number | null } | null,
): number | null {
  if (
    ride.originLat === null || ride.originLng === null || ride.destLat === null || ride.destLng === null ||
    pickup.lat === null || pickup.lng === null || !dropoff || dropoff.lat === null || dropoff.lng === null
  ) {
    return null;
  }

  const routeStart = { lat: ride.originLat, lng: ride.originLng };
  const routeEnd = { lat: ride.destLat, lng: ride.destLng };
  const routeDistanceKm = haversineKm(routeStart.lat, routeStart.lng, routeEnd.lat, routeEnd.lng);

  const pickupMatch = matchToRoute({ lat: pickup.lat, lng: pickup.lng }, routeStart, routeEnd);
  const dropoffMatch = matchToRoute({ lat: dropoff.lat, lng: dropoff.lng }, routeStart, routeEnd);

  if (dropoffMatch.t <= pickupMatch.t) return null; // dropoff isn't ahead of pickup — can't be a valid segment

  const segmentKm = routeDistanceKm * (dropoffMatch.t - pickupMatch.t);
  return estimateFairFare(segmentKm, ride.departureTime);
}

router.post("/:id/join", requireAuth, async (req, res) => {
  const { pickupPoint, pickupLat, pickupLng, dropoffPoint, dropoffLat, dropoffLng } = req.body ?? {};

  if (!pickupPoint || !String(pickupPoint).trim()) {
    return res.status(400).json({ error: "A pickup point on the ride's route is required." });
  }

  const ride = await prisma.ride.findUnique({ where: { id: req.params.id }, include: { driver: { select: { name: true, vehicleMake: true, vehicleModel: true, vehicleColor: true, vehiclePlate: true, vehicleSeats: true } } } });

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

  const pickupLatNum = typeof pickupLat === "number" ? pickupLat : null;
  const pickupLngNum = typeof pickupLng === "number" ? pickupLng : null;
  const dropoffLatNum = typeof dropoffLat === "number" ? dropoffLat : null;
  const dropoffLngNum = typeof dropoffLng === "number" ? dropoffLng : null;
  const hasDropoff = dropoffPoint && String(dropoffPoint).trim();

  const fare = computeSegmentFare(
    ride,
    { lat: pickupLatNum, lng: pickupLngNum },
    hasDropoff ? { lat: dropoffLatNum, lng: dropoffLngNum } : null,
  );

  const [booking, updated] = await prisma.$transaction([
    prisma.booking.create({
      data: {
        rideId: ride.id,
        riderId: req.user!.sub,
        pickupPoint: String(pickupPoint).trim(),
        pickupLat: pickupLatNum,
        pickupLng: pickupLngNum,
        dropoffPoint: hasDropoff ? String(dropoffPoint).trim() : null,
        dropoffLat: hasDropoff ? dropoffLatNum : null,
        dropoffLng: hasDropoff ? dropoffLngNum : null,
        fare,
      },
    }),
    prisma.ride.update({
      where: { id: ride.id },
      data: { seatsTaken: { increment: 1 } },
      include: { driver: { select: { name: true, vehicleMake: true, vehicleModel: true, vehicleColor: true, vehiclePlate: true, vehicleSeats: true } } },
    }),
  ]);

  res.json({
    ride: serializeRide(updated, {
      id: booking.id,
      pickupPoint: booking.pickupPoint,
      pickupLat: booking.pickupLat,
      pickupLng: booking.pickupLng,
      dropoffPoint: booking.dropoffPoint,
      dropoffLat: booking.dropoffLat,
      dropoffLng: booking.dropoffLng,
      fare: booking.fare ?? ride.farePerSeat,
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
      include: { driver: { select: { name: true, vehicleMake: true, vehicleModel: true, vehicleColor: true, vehiclePlate: true, vehicleSeats: true } } },
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

// Frequent places (pickup AND drop-off points from past confirmed bookings,
// deduped and ranked by how often visited) — powers the "Where to?" quick-select
// dropdown so passengers don't have to retype places they go often.
router.get("/frequent-places", requireAuth, async (req, res) => {
  const userId = req.user!.sub;

  const bookings = await prisma.booking.findMany({
    where: { riderId: userId, status: "confirmed" },
    select: {
      pickupPoint: true, pickupLat: true, pickupLng: true,
      dropoffPoint: true, dropoffLat: true, dropoffLng: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const counts = new Map<string, { count: number; lat: number | null; lng: number | null }>();
  const tally = (label: string | null, lat: number | null, lng: number | null) => {
    if (!label) return;
    const existing = counts.get(label);
    if (existing) existing.count += 1;
    else counts.set(label, { count: 1, lat, lng });
  };
  for (const b of bookings) {
    tally(b.pickupPoint, b.pickupLat, b.pickupLng);
    tally(b.dropoffPoint, b.dropoffLat, b.dropoffLng);
  }

  const places = [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([label, info]) => ({ label, count: info.count, lat: info.lat, lng: info.lng }));

  res.json({ places });
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
