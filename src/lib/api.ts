import { Capacitor } from "@capacitor/core";

// On the emulator, "localhost" is tunneled back to the dev machine via `adb reverse`.
// A real phone has no such tunnel — it needs the dev machine's actual LAN IP,
// which must be set in .env (VITE_API_HOST) since it changes per network.
//
// On the web, "/api" relies on Vite's dev-server proxy (vite.config.ts) and only
// works when the frontend and backend are on the same origin — true in local dev,
// not true once the frontend is a static deploy (Vercel) talking to a separately
// hosted backend (Render). VITE_API_BASE_URL overrides it with the real backend
// URL for that case; unset in local dev, so "/api" + the proxy keeps working there.
const API_BASE = Capacitor.isNativePlatform()
  ? `http://${import.meta.env.VITE_API_HOST || "localhost"}:4000/api`
  : import.meta.env.VITE_API_BASE_URL || "/api";

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
  driverVehicle: { make: string | null; model: string | null; color: string | null; plate: string | null; seats: number | null } | null;
  createdAt: string;
  myBooking: {
    id: string;
    pickupPoint: string;
    pickupLat: number | null;
    pickupLng: number | null;
    dropoffPoint?: string | null;
    dropoffLat?: number | null;
    dropoffLng?: number | null;
    fare?: number | null;
  } | null;
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

export function fetchNearbyRides(
  route: { originLat: number; originLng: number; destLat: number; destLng: number; university?: string; desiredTime?: string },
  token: string,
): Promise<{ rides: Ride[] }> {
  const qs = new URLSearchParams({
    originLat: String(route.originLat),
    originLng: String(route.originLng),
    destLat: String(route.destLat),
    destLng: String(route.destLng),
    ...(route.university ? { university: route.university } : {}),
    ...(route.desiredTime ? { desiredTime: route.desiredTime } : {}),
  });
  return request(`/rides/nearby?${qs.toString()}`, undefined, token);
}

export interface RideBooking {
  id: string;
  riderId: string;
  riderName: string;
  pickupPoint: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffPoint: string | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  fare: number;
}

export interface DriverRide extends Ride {
  bookings: RideBooking[];
}

export function fetchMyOfferedRides(token: string): Promise<{ rides: DriverRide[] }> {
  return request("/rides/mine", undefined, token);
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

export interface FrequentPlace {
  label: string;
  count: number;
  lat: number | null;
  lng: number | null;
}

export function fetchFrequentPlaces(token: string): Promise<{ places: FrequentPlace[] }> {
  return request("/rides/frequent-places", undefined, token);
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

export interface JoinRideInput {
  pickupPoint: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffPoint?: string | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
}

export function joinRide(id: string, input: JoinRideInput, token: string): Promise<{ ride: Ride }> {
  return request(`/rides/${id}/join`, { method: "POST", body: JSON.stringify(input) }, token);
}

export function cancelBooking(id: string, token: string): Promise<{ ride: Ride; cancellationFee: number }> {
  return request(`/rides/${id}/cancel`, { method: "POST" }, token);
}

export function toggleFavorite(id: string, token: string): Promise<{ isFavorited: boolean }> {
  return request(`/rides/${id}/favorite`, { method: "POST" }, token);
}

export interface RideRequestParticipant {
  id: string;
  riderId: string;
  riderName: string;
  pickupPoint: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffPoint: string;
  dropoffLat: number | null;
  dropoffLng: number | null;
}

export interface RideRequest {
  id: string;
  origin: string;
  originLat: number | null;
  originLng: number | null;
  destination: string;
  destLat: number | null;
  destLng: number | null;
  university: string;
  desiredTime: string;
  status: "open" | "fulfilled" | "cancelled";
  createdAt: string;
  initiatorId: string;
  initiatorName: string;
  fulfilledByRideId: string | null;
  seatsNeeded: number;
  maxParticipants: number;
  participants: RideRequestParticipant[];
}

export interface NewRideRequestInput {
  origin: string;
  originLat?: number | null;
  originLng?: number | null;
  destination: string;
  destLat?: number | null;
  destLng?: number | null;
  university: string;
  desiredTime: string;
  pickupPoint: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffPoint: string;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
}

export function createRideRequest(input: NewRideRequestInput, token: string): Promise<{ request: RideRequest }> {
  return request("/ride-requests", { method: "POST", body: JSON.stringify(input) }, token);
}

export function fetchRideRequests(university?: string): Promise<{ requests: RideRequest[] }> {
  const qs = university ? `?university=${encodeURIComponent(university)}` : "";
  return request(`/ride-requests${qs}`);
}

export function fetchMyRideRequests(token: string): Promise<{ requests: RideRequest[] }> {
  return request("/ride-requests/mine", undefined, token);
}

export function fetchNearbyRideRequests(
  route: { originLat: number; originLng: number; destLat: number; destLng: number; university?: string },
  token: string,
): Promise<{ requests: RideRequest[] }> {
  const qs = new URLSearchParams({
    originLat: String(route.originLat),
    originLng: String(route.originLng),
    destLat: String(route.destLat),
    destLng: String(route.destLng),
    ...(route.university ? { university: route.university } : {}),
  });
  return request(`/ride-requests/nearby?${qs.toString()}`, undefined, token);
}

export function fetchJoinablePoolRequests(
  route: { originLat: number; originLng: number; destLat: number; destLng: number; university?: string },
  token: string,
): Promise<{ requests: RideRequest[] }> {
  const qs = new URLSearchParams({
    originLat: String(route.originLat),
    originLng: String(route.originLng),
    destLat: String(route.destLat),
    destLng: String(route.destLng),
    ...(route.university ? { university: route.university } : {}),
  });
  return request(`/ride-requests/joinable?${qs.toString()}`, undefined, token);
}

export interface JoinRideRequestInput {
  pickupPoint: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffPoint: string;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
}

export function joinRideRequest(
  id: string,
  input: JoinRideRequestInput,
  token: string,
): Promise<{ request: RideRequest }> {
  return request(`/ride-requests/${id}/join`, { method: "POST", body: JSON.stringify(input) }, token);
}

export function fulfillRideRequest(
  id: string,
  input: { rideId?: string; type?: Ride["type"]; seatsTotal?: number; farePerSeat?: number },
  token: string,
): Promise<{ request: RideRequest; rideId: string }> {
  return request(`/ride-requests/${id}/fulfill`, { method: "POST", body: JSON.stringify(input) }, token);
}

export function cancelRideRequest(id: string, token: string): Promise<{ request: RideRequest }> {
  return request(`/ride-requests/${id}/cancel`, { method: "POST" }, token);
}

export function sendChatMessage(
  message: string,
  sessionId: string,
  token?: string | null,
): Promise<{ reply: string; topicId: string }> {
  return request("/chatbot/message", { method: "POST", body: JSON.stringify({ message, sessionId }) }, token);
}

export type UserRole = "passenger" | "driver";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  university: string;
  defaultRole: UserRole;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  vehiclePlate: string | null;
  vehicleSeats: number | null;
}

export interface VehicleInput {
  make: string;
  model: string;
  color: string;
  plate: string;
  seats: number;
}

export function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  return request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function startSignup(input: {
  name: string;
  email: string;
  password: string;
  defaultRole: UserRole;
  vehicle?: VehicleInput;
}): Promise<{ message: string; email: string }> {
  return request("/auth/signup/start", { method: "POST", body: JSON.stringify(input) });
}

export function verifySignup(email: string, code: string): Promise<{ token: string; user: AuthUser }> {
  return request("/auth/signup/verify", { method: "POST", body: JSON.stringify({ email, code }) });
}

export function startPasswordReset(email: string): Promise<{ message: string; email: string }> {
  return request("/auth/reset-password/start", { method: "POST", body: JSON.stringify({ email }) });
}

export function verifyPasswordReset(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ token: string; user: AuthUser }> {
  return request("/auth/reset-password/verify", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  });
}

export function updateDefaultRole(defaultRole: UserRole, token: string): Promise<{ user: AuthUser }> {
  return request("/auth/me", { method: "PATCH", body: JSON.stringify({ defaultRole }) }, token);
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
