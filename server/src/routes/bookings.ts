import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/mine", requireAuth, async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { riderId: req.user!.sub },
    orderBy: { createdAt: "desc" },
    include: {
      ride: {
        include: { driver: { select: { name: true } } },
      },
    },
  });

  res.json({
    bookings: bookings.map((b) => ({
      id: b.id,
      seats: b.seats,
      pricePaid: b.pricePaid,
      createdAt: b.createdAt.toISOString(),
      ride: {
        id: b.ride.id,
        type: b.ride.type,
        origin: b.ride.origin,
        destination: b.ride.destination,
        pickupPoint: b.ride.pickupPoint,
        university: b.ride.university,
        departureTime: b.ride.departureTime.toISOString(),
        driverName: b.ride.driver.name,
      },
    })),
  });
});

export default router;
