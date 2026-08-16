import { Capacitor } from "@capacitor/core";

// On the emulator, "localhost" is tunneled back to the dev machine via `adb reverse`.
// A real phone has no such tunnel — it needs the dev machine's actual LAN IP,
// which must be set in .env (VITE_API_HOST) since it changes per network.
const API_BASE = Capacitor.isNativePlatform()
  ? `http://${import.meta.env.VITE_API_HOST || "localhost"}:4000/api`
  : "/api";

export interface Ride {
  id: string;
  type: "shared-taxi" | "student-driver";
  origin: string;
  originLat: number | null;
  originLng: number | null;
  destination: string;
  destLat: number | null;
  destLng: number | null;
  university: string;
  departureTime: string;
  seatsTotal: number;
  seatsTaken: number;
  farePerSeat: number;
  driverId: string;
  driverName: string;
  driverRating: { average: number; count: number; ridesCompleted: number; label: string | null } | null;
  createdAt: string;
  myBooking: { id: string; pickupPoint: string; pickupLat: number | null; pickupLng: number | null } | null;
  isFavorited: boolean;
}

export interface RideHistoryEntry {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  type: "shared-taxi" | "student-driver";
  isDriver: boolean;
  counterparts: { userId: string; name: string; alreadyRated: boolean }[];
}

export interface NewRideInput {
  type: Ride["type"];
  origin: string;
  originLat?: number | null;
  originLng?: number | null;
  destination: string;
  destLat?: number | null;
  destLng?: number | null;
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

export function fetchRideHistory(token: string): Promise<{ history: RideHistoryEntry[] }> {
  return request("/rides/history", undefined, token);
}

export interface PickupSuggestion {
  pickupPoint: string;
  count: number;
  lat: number | null;
  lng: number | null;
}

export function fetchPickupSuggestions(token: string): Promise<{ suggestions: PickupSuggestion[] }> {
  return request("/rides/pickup-suggestions", undefined, token);
}

export interface RecurringPattern {
  origin: string;
  destination: string;
  university: string;
  count: number;
  typicalHour: number;
}

export function fetchRecurringPatterns(token: string): Promise<{ patterns: RecurringPattern[] }> {
  return request("/rides/recurring", undefined, token);
}

export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

export function searchPlaces(query: string): Promise<{ results: GeocodeResult[] }> {
  return request(`/geocode/search?q=${encodeURIComponent(query)}`);
}

export function reverseGeocode(lat: number, lng: number): Promise<{ label: string | null }> {
  return request(`/geocode/reverse?lat=${lat}&lng=${lng}`);
}

export function submitRating(
  rideId: string,
  ratedUserId: string,
  score: number,
  comment: string | undefined,
  token: string,
): Promise<{ rating: unknown }> {
  return request(
    `/rides/${rideId}/ratings`,
    { method: "POST", body: JSON.stringify({ ratedUserId, score, comment }) },
    token,
  );
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
