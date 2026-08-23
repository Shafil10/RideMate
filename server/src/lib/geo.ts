const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteMatch {
  withinRadius: boolean;
  // Fraction along the route (0 = at routeStart, 1 = at routeEnd) that this point
  // is closest to — used to order pickup vs. dropoff along the driver's direction
  // of travel.
  t: number;
  distanceMeters: number;
}

// No routing engine (out of scope for a free-stack project) — approximates the
// driver's route as the straight line routeStart -> routeEnd, and finds how far a
// candidate point sits from that line using a local flat-plane projection (valid
// at city scale, much cheaper than proper spherical segment math).
export function matchToRoute(point: LatLng, routeStart: LatLng, routeEnd: LatLng, radiusMeters = 200): RouteMatch {
  const refLat = routeStart.lat;
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos((refLat * Math.PI) / 180);

  const toXY = (p: LatLng) => ({
    x: (p.lng - routeStart.lng) * metersPerDegLng,
    y: (p.lat - routeStart.lat) * metersPerDegLat,
  });

  const A = toXY(routeStart);
  const B = toXY(routeEnd);
  const P = toXY(point);

  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const lengthSq = dx * dx + dy * dy;

  let t = lengthSq === 0 ? 0 : ((P.x - A.x) * dx + (P.y - A.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = A.x + t * dx;
  const closestY = A.y + t * dy;
  const distanceMeters = Math.hypot(P.x - closestX, P.y - closestY);

  return { withinRadius: distanceMeters <= radiusMeters, t, distanceMeters };
}

// Mirrors src/lib/geo.ts (client) exactly — duplicated intentionally, separate
// packages. The server needs its own copy to compute per-passenger segment fares
// (see routes/rides.ts and routes/rideRequests.ts); previously only the client
// used this to *suggest* a fare, the server just stored whatever was submitted.
const BASE_FARE = 100;
const RATE_PER_KM = 30;
const RUSH_HOUR_MULTIPLIER = 1.3;

export function isRushHour(departureTime: Date): boolean {
  const hour = departureTime.getHours();
  return (hour >= 8 && hour < 10) || (hour >= 17 && hour < 20);
}

export function estimateFairFare(distanceKm: number, departureTime?: Date): number {
  const subtotal = BASE_FARE + distanceKm * RATE_PER_KM;
  const multiplier = departureTime && isRushHour(departureTime) ? RUSH_HOUR_MULTIPLIER : 1;
  return Math.round(subtotal * multiplier);
}
