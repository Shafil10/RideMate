import { Capacitor } from "@capacitor/core";

const API_BASE = Capacitor.isNativePlatform() ? "http://localhost:4000/api" : "/api";

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
  myBooking: { id: string; pickupPoint: string; pickupLat: number | null; pickupLng: number | null } | null;
  isFavorited: boolean;
}

export interface NewRideInput {
  type: Ride["type"];
  origin: string;
  destination: string;
  university: string;
  departureTime: string;
  seatsTotal: number;
  farePerSeat: number;
}

async function request<T>(path: string, options?: RequestInit, token?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
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

export function fetchRides(token?: string | null): Promise<{ rides: Ride[] }> {
  return request("/rides", undefined, token);
}

export function fetchRecommendedRides(token: string): Promise<{ rides: Ride[] }> {
  return request("/rides/recommended", undefined, token);
}

export function createRide(input: NewRideInput, token: string): Promise<{ ride: Ride }> {
  return request("/rides", { method: "POST", body: JSON.stringify(input) }, token);
}

export function joinRide(
  id: string,
  pickupPoint: string,
  token: string,
  location?: { lat: number; lng: number } | null,
): Promise<{ ride: Ride }> {
  return request(
    `/rides/${id}/join`,
    { method: "POST", body: JSON.stringify({ pickupPoint, pickupLat: location?.lat, pickupLng: location?.lng }) },
    token,
  );
}

export function cancelBooking(id: string, token: string): Promise<{ ride: Ride; cancellationFee: number }> {
  return request(`/rides/${id}/cancel`, { method: "POST" }, token);
}

export function toggleFavorite(id: string, token: string): Promise<{ isFavorited: boolean }> {
  return request(`/rides/${id}/favorite`, { method: "POST" }, token);
}

export function sendChatMessage(
  message: string,
  sessionId: string,
  token?: string | null,
): Promise<{ reply: string; topicId: string }> {
  return request("/chatbot/message", { method: "POST", body: JSON.stringify({ message, sessionId }) }, token);
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
