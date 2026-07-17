export type RideType = "shared-taxi" | "student-driver";

export interface Ride {
  id: string;
  type: RideType;
  origin: string;
  destination: string;
  university: string;
  departureTime: string;
  seatsTotal: number;
  seatsTaken: number;
  farePerSeat: number;
  driverName: string;
  createdAt: string;
}

export const rides: Ride[] = [
  {
    id: "r1",
    type: "student-driver",
    origin: "Dhanmondi",
    destination: "BUET",
    university: "BUET",
    departureTime: "2026-07-19T08:00:00.000Z",
    seatsTotal: 3,
    seatsTaken: 1,
    farePerSeat: 60,
    driverName: "Rafiq",
    createdAt: "2026-07-17T10:00:00.000Z",
  },
  {
    id: "r2",
    type: "shared-taxi",
    origin: "Mirpur 10",
    destination: "NSU",
    university: "North South University",
    departureTime: "2026-07-19T07:30:00.000Z",
    seatsTotal: 4,
    seatsTaken: 2,
    farePerSeat: 45,
    driverName: "Shared (Pathao Split)",
    createdAt: "2026-07-17T11:30:00.000Z",
  },
  {
    id: "r3",
    type: "student-driver",
    origin: "Uttara",
    destination: "AIUB",
    university: "AIUB",
    departureTime: "2026-07-19T08:15:00.000Z",
    seatsTotal: 2,
    seatsTaken: 0,
    farePerSeat: 70,
    driverName: "Nusrat",
    createdAt: "2026-07-17T09:15:00.000Z",
  },
];

let nextId = rides.length + 1;

export function generateRideId(): string {
  return `r${nextId++}`;
}
