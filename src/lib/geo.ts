const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const BASE_FARE = 100;
const RATE_PER_KM = 30;

// Dhaka's typical school/office rush windows. No live traffic feed — this is an
// explainable time-of-day heuristic, not a black-box prediction.
const RUSH_HOUR_MULTIPLIER = 1.3;

export function isRushHour(departureTime: Date): boolean {
  const hour = departureTime.getHours();
  return (hour >= 8 && hour < 10) || (hour >= 17 && hour < 20);
}

// Fully automatic: recalculates live from distance and departure time, no manual
// input required. (A per-minute wait-time meter belongs on a live, in-progress
// ride, not a pre-ride estimate — dropped after user testing found it confusing.)
export function estimateFairFare(distanceKm: number, departureTime?: Date): number {
  const subtotal = BASE_FARE + distanceKm * RATE_PER_KM;
  const multiplier = departureTime && isRushHour(departureTime) ? RUSH_HOUR_MULTIPLIER : 1;
  return Math.round(subtotal * multiplier);
}
