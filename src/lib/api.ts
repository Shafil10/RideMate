export interface Ride {
  id: string;
  type: "shared-taxi" | "student-driver";
  origin: string;
  destination: string;
  pickupPoint: string | null;
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
  pickupPoint: string;
  university: string;
  departureTime: string;
  seatsTotal: number;
  farePerSeat: number;
}

async function request<T>(path: string, options?: RequestInit, token?: string | null): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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

export function createRide(input: NewRideInput, token: string): Promise<{ ride: Ride }> {
  return request("/rides", { method: "POST", body: JSON.stringify(input) }, token);
}

export function joinRide(id: string, seats: number, token: string): Promise<{ ride: Ride }> {
  return request(`/rides/${id}/join`, { method: "POST", body: JSON.stringify({ seats }) }, token);
}

export function sendChatMessage(
  message: string,
  token?: string | null,
): Promise<{ reply: string; topicId: string; suggestions: string[] }> {
  return request("/chatbot/message", { method: "POST", body: JSON.stringify({ message }) }, token);
}

export function fetchChatbotSuggestions(): Promise<{ suggestions: string[] }> {
  return request("/chatbot/suggestions");
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

export function signup(
  name: string,
  email: string,
  password: string,
  university: string,
): Promise<{ token: string; user: AuthUser }> {
  return request("/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password, university }) });
}

export interface Booking {
  id: string;
  seats: number;
  pricePaid: number;
  createdAt: string;
  ride: {
    id: string;
    type: Ride["type"];
    origin: string;
    destination: string;
    pickupPoint: string | null;
    university: string;
    departureTime: string;
    driverName: string;
  };
}

export function fetchMyBookings(token: string): Promise<{ bookings: Booking[] }> {
  return request("/bookings/mine", undefined, token);
}

export interface Stat {
  value: string;
  label: string;
}

export function fetchStats(): Promise<{ stats: Stat[] }> {
  return request("/content/stats");
}

export function fetchUniversities(): Promise<{ universities: string[] }> {
  return request("/content/universities");
}

export interface Testimonial {
  name: string;
  text: string;
}

export function fetchTestimonials(): Promise<{ testimonials: Testimonial[] }> {
  return request("/content/testimonials");
}
