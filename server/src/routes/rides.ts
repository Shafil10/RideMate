import { Router } from "express";
import { rides, generateRideId, type Ride, type RideType } from "../data.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ rides });
});

router.post("/", (req, res) => {
  const { type, origin, destination, university, departureTime, seatsTotal, farePerSeat, driverName } = req.body ?? {};

  if (!origin || !destination || !university || !departureTime || !driverName) {
    return res.status(400).json({ error: "Missing required ride fields." });
  }

  const ride: Ride = {
    id: generateRideId(),
    type: (type as RideType) ?? "student-driver",
    origin,
    destination,
    university,
    departureTime,
    seatsTotal: Number(seatsTotal) || 1,
    seatsTaken: 0,
    farePerSeat: Number(farePerSeat) || 0,
    driverName,
    createdAt: new Date().toISOString(),
  };

  rides.push(ride);
  res.status(201).json({ ride });
});

router.post("/:id/join", (req, res) => {
  const ride = rides.find((r) => r.id === req.params.id);

  if (!ride) {
    return res.status(404).json({ error: "Ride not found." });
  }

  if (ride.seatsTaken >= ride.seatsTotal) {
    return res.status(409).json({ error: "This ride is already full." });
  }

  ride.seatsTaken += 1;
  res.json({ ride });
});

export default router;
