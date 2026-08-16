import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  cancelBooking,
  createRide,
  fetchPickupSuggestions,
  fetchRecommendedRides,
  fetchRecurringPatterns,
  fetchRideHistory,
  fetchRides,
  joinRide,
  submitRating,
  toggleFavorite,
  type PickupSuggestion,
  type RecurringPattern,
  type Ride,
  type RideHistoryEntry,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PickupMapPicker, { type LatLng } from "../components/rides/PickupMapPicker";
import { haversineKm, estimateFairFare, isRushHour } from "../lib/geo";

const CANCELLATION_FEE = 50;

function timeOfDayMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function timeStringToMinutes(t: string): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

const emptyForm = {
  type: "student-driver" as Ride["type"],
  origin: "",
  destination: "",
  university: "",
  departureTime: "",
  seatsTotal: 3,
  farePerSeat: 50,
};

export default function RidesPage() {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedRides, setRecommendedRides] = useState<Ride[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [joiningRideId, setJoiningRideId] = useState<string | null>(null);
  const [pickupPoint, setPickupPoint] = useState("");
  const [pickupLocation, setPickupLocation] = useState<LatLng | null>(null);
  const [busyRideId, setBusyRideId] = useState<string | null>(null);
  const [favBusyId, setFavBusyId] = useState<string | null>(null);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [originLocation, setOriginLocation] = useState<LatLng | null>(null);
  const [destLocation, setDestLocation] = useState<LatLng | null>(null);
  const [showOriginMap, setShowOriginMap] = useState(false);
  const [showDestMap, setShowDestMap] = useState(false);
  const [fareManuallySet, setFareManuallySet] = useState(false);
  const [waitMinutes, setWaitMinutes] = useState(0);
  const [rideHistory, setRideHistory] = useState<RideHistoryEntry[]>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<PickupSuggestion[]>([]);
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringPattern[]>([]);
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, { score: number; comment: string }>>({});
  const [ratingBusyKey, setRatingBusyKey] = useState<string | null>(null);

  const suggestedFare = useMemo(() => {
    if (!originLocation || !destLocation) return null;
    const distanceKm = haversineKm(originLocation.lat, originLocation.lng, destLocation.lat, destLocation.lng);
    const departure = form.departureTime ? new Date(form.departureTime) : undefined;
    const tripFare = estimateFairFare(distanceKm, waitMinutes, departure);
    const perSeat =
      form.type === "student-driver" ? Math.round(tripFare / Math.max(1, form.seatsTotal)) : tripFare;
    return { distanceKm, tripFare, fare: perSeat, isRush: departure ? isRushHour(departure) : false };
  }, [originLocation, destLocation, waitMinutes, form.type, form.seatsTotal, form.departureTime]);

  useEffect(() => {
    if (suggestedFare && !fareManuallySet) {
      setForm((f) => ({ ...f, farePerSeat: suggestedFare.fare }));
    }
  }, [suggestedFare, fareManuallySet]);

  function loadRides() {
    setLoading(true);
    fetchRides(token)
      .then((data) => setRides(data.rides))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) {
      setRecommendedRides([]);
      return;
    }
    fetchRecommendedRides(token)
      .then((data) => setRecommendedRides(data.rides))
      .catch(() => setRecommendedRides([]));
  }, [token, rides]);

  function loadRideHistory() {
    if (!token) {
      setRideHistory([]);
      return;
    }
    fetchRideHistory(token)
      .then((data) => setRideHistory(data.history))
      .catch(() => setRideHistory([]));
  }

  useEffect(() => {
    loadRideHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) {
      setPickupSuggestions([]);
      return;
    }
    fetchPickupSuggestions(token)
      .then((data) => setPickupSuggestions(data.suggestions))
      .catch(() => setPickupSuggestions([]));
  }, [token]);

  useEffect(() => {
    if (!token) {
      setRecurringPatterns([]);
      return;
    }
    fetchRecurringPatterns(token)
      .then((data) => setRecurringPatterns(data.patterns))
      .catch(() => setRecurringPatterns([]));
  }, [token]);

  function applyPickupSuggestion(s: PickupSuggestion) {
    setPickupPoint(s.pickupPoint);
    if (s.lat !== null && s.lng !== null) setPickupLocation({ lat: s.lat, lng: s.lng });
  }

  function applyRecurringPattern(p: RecurringPattern) {
    setForm((f) => ({ ...f, origin: p.origin, destination: p.destination, university: p.university }));
    document.getElementById("create")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function formatHour(hour: number): string {
    const period = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12} ${period}`;
  }

  async function handleSubmitRating(rideId: string, ratedUserId: string) {
    if (!token) return;
    const key = `${rideId}:${ratedUserId}`;
    const draft = ratingDrafts[key] ?? { score: 5, comment: "" };
    setRatingBusyKey(key);
    setError(null);
    try {
      await submitRating(rideId, ratedUserId, draft.score, draft.comment || undefined, token);
      setNotice("Thanks for the feedback!");
      loadRideHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit rating.");
    } finally {
      setRatingBusyKey(null);
    }
  }

  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash, loading]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      await createRide(
        {
          ...form,
          originLat: originLocation?.lat ?? null,
          originLng: originLocation?.lng ?? null,
          destLat: destLocation?.lat ?? null,
          destLng: destLocation?.lng ?? null,
        },
        token,
      );
      setForm(emptyForm);
      setOriginLocation(null);
      setDestLocation(null);
      setShowOriginMap(false);
      setShowDestMap(false);
      setFareManuallySet(false);
      loadRides();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ride.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleJoinClick(id: string) {
    if (!token) {
      navigate("/login", { state: { from: "/rides#browse" } });
      return;
    }
    setError(null);
    setNotice(null);
    setPickupPoint("");
    setPickupLocation(null);
    setJoiningRideId(id);
  }

  async function handleConfirmJoin(id: string) {
    if (!token || !pickupPoint.trim()) {
      setError("Enter a pickup point on the ride's route before confirming.");
      return;
    }
    setBusyRideId(id);
    setError(null);
    try {
      await joinRide(id, pickupPoint.trim(), token, pickupLocation);
      setJoiningRideId(null);
      setPickupPoint("");
      setPickupLocation(null);
      setNotice("Seat reserved. See you at the pickup point!");
      loadRides();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join ride.");
    } finally {
      setBusyRideId(null);
    }
  }

  async function handleToggleFavorite(id: string) {
    if (!token) {
      navigate("/login", { state: { from: "/rides#browse" } });
      return;
    }
    setFavBusyId(id);
    try {
      const { isFavorited } = await toggleFavorite(id, token);
      setRides((prev) => prev.map((r) => (r.id === id ? { ...r, isFavorited } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update favorite.");
    } finally {
      setFavBusyId(null);
    }
  }

  async function handleCancelBooking(id: string) {
    if (!token) return;
    const confirmed = window.confirm(
      `Cancel your booking on this ride? A ৳${CANCELLATION_FEE} compensation fee applies for cancelling after booking.`,
    );
    if (!confirmed) return;

    setBusyRideId(id);
    setError(null);
    try {
      const { cancellationFee } = await cancelBooking(id, token);
      setNotice(`Booking cancelled. Compensation fee charged: ৳${cancellationFee}.`);
      loadRides();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking.");
    } finally {
      setBusyRideId(null);
    }
  }

  const visibleRides = useMemo(() => {
    const fromMin = timeStringToMinutes(timeFrom);
    const toMin = timeStringToMinutes(timeTo);
    return rides.filter((ride) => {
      if (favoritesOnly && !ride.isFavorited) return false;
      if (fromMin === null && toMin === null) return true;
      const rideMin = timeOfDayMinutes(ride.departureTime);
      if (fromMin !== null && toMin !== null) {
        return fromMin <= toMin ? rideMin >= fromMin && rideMin <= toMin : rideMin >= fromMin || rideMin <= toMin;
      }
      if (fromMin !== null) return rideMin >= fromMin;
      return rideMin <= (toMin as number);
    });
  }, [rides, timeFrom, timeTo, favoritesOnly]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "120px 24px 80px" }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Find or Offer a Ride</h1>
      <p style={{ color: "#555", marginBottom: 32 }}>
        Browse live rides from students on your route, or create your own.
      </p>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: 8, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {notice && (
        <div style={{ background: "#dcfce7", color: "#166534", padding: "12px 16px", borderRadius: 8, marginBottom: 24 }}>
          {notice}
        </div>
      )}

      {recurringPatterns.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {recurringPatterns.map((p) => (
            <div
              key={`${p.origin}|${p.destination}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 12,
                padding: "12px 16px",
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 13, color: "#1e3a8a" }}>
                🔁 You've ridden <strong>{p.origin} → {p.destination}</strong> around{" "}
                <strong>{formatHour(p.typicalHour)}</strong> {p.count} times — looks like a regular commute.
              </div>
              <button
                type="button"
                onClick={() => applyRecurringPattern(p)}
                style={{
                  background: "#1d4ed8",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Use this route
              </button>
            </div>
          ))}
        </div>
      )}

      <div id="create" style={{ scrollMarginTop: 100 }}>
        {user ? (
          <form
            onSubmit={handleCreate}
            className="ride-form-grid"
            style={{
              background: "#f9fafb",
              padding: 24,
              borderRadius: 16,
              marginBottom: 40,
            }}
          >
            <h2 style={{ gridColumn: "1 / -1", fontSize: 20, margin: 0 }}>Create a Ride</h2>
            <p style={{ gridColumn: "1 / -1", margin: "-6px 0 4px", fontSize: 13, color: "#555" }}>
              Creating as <strong>{user.name}</strong> ({user.university})
            </p>

            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Ride["type"] })}
              style={inputStyle}
            >
              <option value="student-driver">Student Driver Ride</option>
              <option value="shared-taxi">Shared Taxi Ride</option>
            </select>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  placeholder="Origin"
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOriginMap((v) => !v)}
                  style={pinToggleStyle(!!originLocation)}
                >
                  {originLocation ? "📍 Pinned" : "📍 Pin"}
                </button>
              </div>
              {showOriginMap && <PickupMapPicker value={originLocation} onChange={setOriginLocation} />}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  placeholder="Destination"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowDestMap((v) => !v)}
                  style={pinToggleStyle(!!destLocation)}
                >
                  {destLocation ? "📍 Pinned" : "📍 Pin"}
                </button>
              </div>
              {showDestMap && <PickupMapPicker value={destLocation} onChange={setDestLocation} />}
            </div>

            <input
              placeholder="University"
              value={form.university}
              onChange={(e) => setForm({ ...form, university: e.target.value })}
              style={inputStyle}
              required
            />

            <input
              type="datetime-local"
              value={form.departureTime}
              onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
              style={inputStyle}
              required
            />

            <input
              type="number"
              min={1}
              placeholder="Seats total"
              value={form.seatsTotal}
              onChange={(e) => setForm({ ...form, seatsTotal: Number(e.target.value) })}
              style={inputStyle}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <input
                type="number"
                min={0}
                placeholder="Expected wait time (minutes)"
                value={waitMinutes}
                onChange={(e) => setWaitMinutes(Number(e.target.value))}
                style={inputStyle}
              />
              <span style={{ fontSize: 11.5, color: "#8b968f" }}>
                Only if you expect to wait — e.g. picking up multiple people along the way
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <input
                type="number"
                min={0}
                placeholder="Fare per seat (BDT)"
                value={form.farePerSeat}
                onChange={(e) => {
                  setFareManuallySet(true);
                  setForm({ ...form, farePerSeat: Number(e.target.value) });
                }}
                style={inputStyle}
              />
              {suggestedFare && (
                <span style={{ fontSize: 11.5, color: "#8b968f" }}>
                  {form.type === "student-driver" ? (
                    <>
                      Suggested: ৳{suggestedFare.tripFare} total for {suggestedFare.distanceKm.toFixed(1)} km, split
                      across {form.seatsTotal} seat{form.seatsTotal === 1 ? "" : "s"} → ৳{suggestedFare.fare}/seat
                    </>
                  ) : (
                    <>
                      Suggested: ৳{suggestedFare.fare} for {suggestedFare.distanceKm.toFixed(1)} km
                    </>
                  )}
                  {suggestedFare.isRush && (
                    <>
                      {" "}
                      <span style={{ color: "#b45309", fontWeight: 700 }}>
                        includes +30% rush-hour pricing
                      </span>
                    </>
                  )}{" "}
                  (pin both origin and destination for a fair-fare estimate) — edit above to set your own price
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                gridColumn: "1 / -1",
                background: "#16a34a",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: 30,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {submitting ? "Creating..." : "Create Ride"}
            </button>
          </form>
        ) : (
          <div
            style={{
              background: "#f9fafb",
              padding: 24,
              borderRadius: 16,
              marginBottom: 40,
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Log in to create a ride</h2>
            <p style={{ color: "#555", marginBottom: 16, fontSize: 14 }}>
              We use your account so other students know who's driving.
            </p>
            <Link
              to="/login"
              state={{ from: "/rides#create" }}
              style={{
                display: "inline-block",
                background: "#16a34a",
                color: "white",
                padding: "12px 24px",
                borderRadius: 30,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Log in
            </Link>
          </div>
        )}
      </div>

      {token && recommendedRides.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Recommended for you</h2>
          <p style={{ color: "#8b968f", fontSize: 13, marginBottom: 16 }}>
            Matched to routes you've ridden before
          </p>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4 }}>
            {recommendedRides.map((ride) => (
              <div
                key={ride.id}
                style={{
                  minWidth: 240,
                  flex: "0 0 auto",
                  border: "1px solid #bbf7d0",
                  background: "#f0fdf4",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {ride.origin} → {ride.destination}
                </div>
                <div style={{ color: "#555", fontSize: 13, marginTop: 4 }}>
                  {new Date(ride.departureTime).toLocaleString()}
                </div>
                <div style={{ color: "#555", fontSize: 13 }}>
                  ৳{ride.farePerSeat}/seat · {ride.seatsTotal - ride.seatsTaken} seats left
                </div>
                <button
                  onClick={() => handleJoinClick(ride.id)}
                  style={{
                    marginTop: 10,
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 20,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Join
                </button>

                {joiningRideId === ride.id && (
                  <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    <PickupMapPicker value={pickupLocation} onChange={setPickupLocation} />
                    {pickupSuggestions.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {pickupSuggestions.map((s) => (
                          <button
                            key={s.pickupPoint}
                            type="button"
                            onClick={() => applyPickupSuggestion(s)}
                            style={{
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              color: "#166534",
                              borderRadius: 14,
                              padding: "4px 10px",
                              fontSize: 12,
                              cursor: "pointer",
                            }}
                          >
                            📍 {s.pickupPoint} ({s.count}×)
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      autoFocus
                      placeholder="Pickup point label"
                      value={pickupPoint}
                      onChange={(e) => setPickupPoint(e.target.value)}
                      style={{ ...inputStyle, fontSize: 13 }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleConfirmJoin(ride.id)}
                        disabled={busyRideId === ride.id}
                        style={{
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: 20,
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        {busyRideId === ride.id ? "Confirming..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => {
                          setJoiningRideId(null);
                          setPickupPoint("");
                          setPickupLocation(null);
                        }}
                        style={{ background: "none", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer" }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {token && rideHistory.some((h) => h.counterparts.some((c) => !c.alreadyRated)) && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Rate your past rides</h2>
          <p style={{ color: "#8b968f", fontSize: 13, marginBottom: 16 }}>
            Your feedback builds trust scores for drivers and riders across RideMate
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {rideHistory
              .filter((h) => h.counterparts.some((c) => !c.alreadyRated))
              .map((h) =>
                h.counterparts
                  .filter((c) => !c.alreadyRated)
                  .map((c) => {
                    const key = `${h.id}:${c.userId}`;
                    const draft = ratingDrafts[key] ?? { score: 5, comment: "" };
                    const busy = ratingBusyKey === key;
                    return (
                      <div
                        key={key}
                        style={{
                          border: "1px solid #fde68a",
                          background: "#fffbeb",
                          borderRadius: 12,
                          padding: 16,
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {h.origin} → {h.destination}
                        </div>
                        <div style={{ color: "#555", fontSize: 13, marginBottom: 8 }}>
                          {new Date(h.departureTime).toLocaleDateString()} · Rate {h.isDriver ? "rider" : "driver"}{" "}
                          <strong>{c.name}</strong>
                        </div>
                        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() =>
                                setRatingDrafts((d) => ({ ...d, [key]: { ...draft, score: n } }))
                              }
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 22,
                                lineHeight: 1,
                                padding: 0,
                                color: n <= draft.score ? "#f59e0b" : "#d1d5db",
                              }}
                              aria-label={`${n} star${n === 1 ? "" : "s"}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <input
                          placeholder="Optional comment"
                          value={draft.comment}
                          onChange={(e) =>
                            setRatingDrafts((d) => ({ ...d, [key]: { ...draft, comment: e.target.value } }))
                          }
                          style={{ ...inputStyle, fontSize: 13, marginBottom: 8 }}
                        />
                        <button
                          onClick={() => handleSubmitRating(h.id, c.userId)}
                          disabled={busy}
                          style={{
                            background: "#16a34a",
                            color: "white",
                            border: "none",
                            padding: "8px 18px",
                            borderRadius: 20,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          {busy ? "Submitting..." : "Submit rating"}
                        </button>
                      </div>
                    );
                  }),
              )}
          </div>
        </div>
      )}

      <h2 id="browse" style={{ fontSize: 20, marginBottom: 16, scrollMarginTop: 100 }}>
        Available Rides
      </h2>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-end",
          background: "#f9fafb",
          padding: "16px 20px",
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <label style={{ display: "grid", gap: 4, fontSize: 12.5, fontWeight: 600, color: "#555" }}>
          Departing after
          <input type="time" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 12.5, fontWeight: 600, color: "#555" }}>
          Departing before
          <input type="time" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} style={inputStyle} />
        </label>
        {(timeFrom || timeTo) && (
          <button
            onClick={() => {
              setTimeFrom("");
              setTimeTo("");
            }}
            style={{ background: "none", border: "1px solid #d1d5db", borderRadius: 20, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Clear time filter
          </button>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: "#555", marginBottom: 2 }}>
          <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
          ★ Favorites only
        </label>
        <span style={{ fontSize: 12.5, color: "#8b968f", marginBottom: 2 }}>
          Showing {visibleRides.length} of {rides.length} rides
        </span>
      </div>

      {loading ? (
        <p>Loading rides...</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {visibleRides.map((ride) => {
            const full = ride.seatsTaken >= ride.seatsTotal;
            const busy = busyRideId === ride.id;
            return (
              <div
                key={ride.id}
                className="ride-card"
                style={{
                  border: "1px solid #ececec",
                  borderRadius: 12,
                  padding: 20,
                  flexDirection: "column",
                  alignItems: "stretch",
                }}
              >
                <div className="ride-card" style={{ padding: 0, border: "none" }}>
                  <div>
                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => handleToggleFavorite(ride.id)}
                        disabled={favBusyId === ride.id}
                        aria-label={ride.isFavorited ? "Remove from favorites" : "Add to favorites"}
                        title={ride.isFavorited ? "Remove from favorites" : "Add to favorites"}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 18,
                          lineHeight: 1,
                          padding: 0,
                          color: ride.isFavorited ? "#f59e0b" : "#d1d5db",
                        }}
                      >
                        {ride.isFavorited ? "★" : "☆"}
                      </button>
                      {ride.origin} → {ride.destination}
                    </div>
                    <div style={{ color: "#555", fontSize: 14 }}>
                      {ride.university} · {new Date(ride.departureTime).toLocaleString()} ·{" "}
                      {ride.type === "shared-taxi" ? "Shared Taxi Ride" : "Student Driver Ride"}
                    </div>
                    <div style={{ color: "#555", fontSize: 14 }}>
                      Driver: {ride.driverName}{" "}
                      {ride.driverRating ? (
                        <span style={{ color: "#b45309" }}>
                          ★ {ride.driverRating.average.toFixed(1)} ({ride.driverRating.count})
                          {ride.driverRating.label && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                color: ride.driverRating.label === "Highly reliable" ? "#166534" : "#991b1b",
                                background: ride.driverRating.label === "Highly reliable" ? "#dcfce7" : "#fee2e2",
                                padding: "2px 8px",
                                borderRadius: 10,
                              }}
                            >
                              {ride.driverRating.label}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>· New driver</span>
                      )}{" "}
                      · {ride.seatsTaken}/{ride.seatsTotal} seats taken · ৳{ride.farePerSeat}/seat
                    </div>
                    {ride.myBooking && (
                      <div style={{ color: "#166534", fontSize: 14, marginTop: 6, fontWeight: 600 }}>
                        Your pickup point: {ride.myBooking.pickupPoint}
                      </div>
                    )}
                  </div>

                  {ride.myBooking ? (
                    <button
                      onClick={() => handleCancelBooking(ride.id)}
                      disabled={busy}
                      style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: 24,
                        fontWeight: 700,
                        cursor: busy ? "default" : "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {busy ? "Cancelling..." : `Cancel booking (৳${CANCELLATION_FEE} fee)`}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinClick(ride.id)}
                      disabled={full}
                      style={{
                        background: full ? "#e5e7eb" : "#16a34a",
                        color: full ? "#6b7280" : "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: 24,
                        fontWeight: 700,
                        cursor: full ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {full ? "Full" : user ? "Join" : "Log in to join"}
                    </button>
                  )}
                </div>

                {joiningRideId === ride.id && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid #ececec",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <PickupMapPicker value={pickupLocation} onChange={setPickupLocation} />

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <input
                        autoFocus
                        placeholder="Pickup point label (e.g. Mirpur 10 main road)"
                        value={pickupPoint}
                        onChange={(e) => setPickupPoint(e.target.value)}
                        style={{ ...inputStyle, flex: "1 1 260px" }}
                      />
                      <button
                        onClick={() => handleConfirmJoin(ride.id)}
                        disabled={busy}
                        style={{
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          padding: "10px 20px",
                          borderRadius: 24,
                          fontWeight: 700,
                          cursor: busy ? "default" : "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {busy ? "Confirming..." : "Confirm seat"}
                      </button>
                      <button
                        onClick={() => {
                          setJoiningRideId(null);
                          setPickupPoint("");
                          setPickupLocation(null);
                        }}
                        style={{
                          background: "none",
                          border: "1px solid #d1d5db",
                          padding: "10px 20px",
                          borderRadius: 24,
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Dismiss
                    </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && rides.length > 0 && visibleRides.length === 0 && (
        <p style={{ color: "#8b968f", textAlign: "center", marginTop: 24 }}>
          No rides match your filters right now. Try widening the time range or turning off "Favorites only".
        </p>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
};

function pinToggleStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "#dcfce7" : "#eef2f0",
    border: "1px solid " + (active ? "#16a34a" : "#d1d5db"),
    borderRadius: 8,
    padding: "0 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}
