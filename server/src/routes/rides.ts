import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();

const CANCELLATION_FEE = 50;

function serializeRide(
  ride: {
    id: string;
    type: string;
    origin: string;
    destination: string;
    university: string;
    departureTime: Date;
    seatsTotal: number;
    seatsTaken: number;
    farePerSeat: number;
    createdAt: Date;
    driver: { name: string };
  },
  myBooking?: { id: string; pickupPoint: string } | null,
) {
  return {
    id: ride.id,
    type: ride.type,
    origin: ride.origin,
    destination: ride.destination,
    university: ride.university,
    departureTime: ride.departureTime.toISOString(),
    seatsTotal: ride.seatsTotal,
    seatsTaken: ride.seatsTaken,
    farePerSeat: ride.farePerSeat,
    driverName: ride.driver.name,
    createdAt: ride.createdAt.toISOString(),
    myBooking: myBooking ?? null,
  };
}

router.get("/", optionalAuth, async (req, res) => {
  const rides = await prisma.ride.findMany({
    include: {
      driver: { select: { name: true } },
      bookings: { where: { status: "confirmed" }, select: { id: true, pickupPoint: true, riderId: true } },
    },
    orderBy: { departureTime: "asc" },
  });

  res.json({
    rides: rides.map((ride) => {
      const myBooking = req.user ? ride.bookings.find((b) => b.riderId === req.user!.sub) : undefined;
      return serializeRide(ride, myBooking);
    }),
  });
});

router.post("/", requireAuth, async (req, res) => {
  const { type, origin, destination, university, departureTime, seatsTotal, farePerSeat } = req.body ?? {};

  if (!origin || !destination || !university || !departureTime) {
    return res.status(400).json({ error: "Missing required ride fields." });
  }

  const ride = await prisma.ride.create({
    data: {
      type: type === "shared-taxi" ? "shared-taxi" : "student-driver",
      origin,
      destination,
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
  const { pickupPoint } = req.body ?? {};

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
      data: { rideId: ride.id, riderId: req.user!.sub, pickupPoint: String(pickupPoint).trim() },
    }),
    prisma.ride.update({
      where: { id: ride.id },
      data: { seatsTaken: { increment: 1 } },
      include: { driver: { select: { name: true } } },
    }),
  ]);

  res.json({ ride: serializeRide(updated, { id: booking.id, pickupPoint: booking.pickupPoint }) });
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

export default router;
