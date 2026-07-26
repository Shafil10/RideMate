import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function serializeRide(ride: {
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
}) {
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
  };
}

router.get("/", async (_req, res) => {
  const rides = await prisma.ride.findMany({
    include: { driver: { select: { name: true } } },
    orderBy: { departureTime: "asc" },
  });
  res.json({ rides: rides.map(serializeRide) });
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
  const ride = await prisma.ride.findUnique({ where: { id: req.params.id }, include: { driver: { select: { name: true } } } });

  if (!ride) {
    return res.status(404).json({ error: "Ride not found." });
  }

  if (ride.seatsTaken >= ride.seatsTotal) {
    return res.status(409).json({ error: "This ride is already full." });
  }

  const updated = await prisma.ride.update({
    where: { id: ride.id },
    data: { seatsTaken: { increment: 1 } },
    include: { driver: { select: { name: true } } },
  });

  res.json({ ride: serializeRide(updated) });
});

export default router;
