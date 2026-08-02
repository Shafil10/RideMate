import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ridemate123", 10);
  const demoPasswordHash = await bcrypt.hash("demo1234", 10);

  const rafiq = await prisma.user.upsert({
    where: { email: "rafiq@buet.ac.bd" },
    update: {},
    create: { name: "Rafiq Islam", email: "rafiq@buet.ac.bd", passwordHash, university: "BUET" },
  });

  const nusrat = await prisma.user.upsert({
    where: { email: "nusrat@aiub.edu" },
    update: {},
    create: { name: "Nusrat Jahan", email: "nusrat@aiub.edu", passwordHash, university: "AIUB" },
  });

  await prisma.user.upsert({
    where: { email: "demo@ridemate.app" },
    update: {},
    create: { name: "Demo Student", email: "demo@ridemate.app", passwordHash: demoPasswordHash, university: "North South University" },
  });

  const rideCount = await prisma.ride.count();
  if (rideCount === 0) {
    await prisma.ride.createMany({
      data: [
        {
          type: "student-driver",
          origin: "Dhanmondi",
          destination: "BUET",
          pickupPoint: "Dhanmondi 27, in front of Star Kabab",
          university: "BUET",
          departureTime: new Date("2026-07-19T08:00:00.000Z"),
          seatsTotal: 3,
          seatsTaken: 1,
          farePerSeat: 60,
          driverId: rafiq.id,
        },
        {
          type: "shared-taxi",
          origin: "Mirpur 10",
          destination: "NSU",
          pickupPoint: "Mirpur 10 Circle, near Metro Rail station exit 2",
          university: "North South University",
          departureTime: new Date("2026-07-19T07:30:00.000Z"),
          seatsTotal: 4,
          seatsTaken: 2,
          farePerSeat: 45,
          driverId: rafiq.id,
        },
        {
          type: "student-driver",
          origin: "Uttara",
          destination: "AIUB",
          pickupPoint: "Uttara Sector 7, House 12 Road 3",
          university: "AIUB",
          departureTime: new Date("2026-07-19T08:15:00.000Z"),
          seatsTotal: 2,
          seatsTaken: 0,
          farePerSeat: 70,
          driverId: nusrat.id,
        },
      ],
    });
  }

  const statCount = await prisma.stat.count();
  if (statCount === 0) {
    await prisma.stat.createMany({
      data: [
        { value: "4.5M+", label: "University Students", order: 1 },
        { value: "40+", label: "Partner Universities", order: 2 },
        { value: "30%", label: "Average Cost Saved", order: 3 },
        { value: "95%", label: "AI Route Match", order: 4 },
      ],
    });
  }

  const universityCount = await prisma.university.count();
  if (universityCount === 0) {
    await prisma.university.createMany({
      data: [
        { name: "North South University", order: 1 },
        { name: "BRAC University", order: 2 },
        { name: "AIUB", order: 3 },
        { name: "East West University", order: 4 },
        { name: "University of Dhaka", order: 5 },
        { name: "UIU", order: 6 },
        { name: "DIU", order: 7 },
        { name: "IUB", order: 8 },
      ],
    });
  }

  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        { name: "Ayesha Rahman", text: "RideMate reduced my monthly transport cost by almost 35%.", order: 1 },
        { name: "Hasan Ahmed", text: "I met amazing classmates while travelling together every morning.", order: 2 },
        { name: "Sadia Karim", text: "Women-only rides made my daily commute much safer.", order: 3 },
      ],
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
