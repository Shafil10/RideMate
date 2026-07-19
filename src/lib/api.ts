export interface Ride {
  id: string;
  type: "shared-taxi" | "student-driver";
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

export interface NewRideInput {
  type: Ride["type"];
  origin: string;
  destination: string;
  university: string;
  departureTime: string;
  seatsTotal: number;
  farePerSeat: number;
  driverName: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return res.json();
}

export function fetchRides(): Promise<{ rides: Ride[] }> {
  return request("/rides");
}

export function createRide(input: NewRideInput): Promise<{ ride: Ride }> {
  return request("/rides", { method: "POST", body: JSON.stringify(input) });
}

export function joinRide(id: string): Promise<{ ride: Ride }> {
  return request(`/rides/${id}/join`, { method: "POST" });
}

export function sendChatMessage(message: string): Promise<{ reply: string; topicId: string }> {
  return request("/chatbot/message", { method: "POST", body: JSON.stringify({ message }) });
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  university: string;
}

export function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  return request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}
