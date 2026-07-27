import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cancelBooking, createRide, fetchRides, joinRide, toggleFavorite, type Ride } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PickupMapPicker, { type LatLng } from "../components/rides/PickupMapPicker";

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
      await createRide(form, token);
      setForm(emptyForm);
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

            <input
              placeholder="Origin"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              style={inputStyle}
              required
            />

            <input
              placeholder="Destination"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              style={inputStyle}
              required
            />

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

            <input
              type="number"
              min={0}
              placeholder="Fare per seat (BDT)"
              value={form.farePerSeat}
              onChange={(e) => setForm({ ...form, farePerSeat: Number(e.target.value) })}
              style={inputStyle}
            />

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
                      Driver: {ride.driverName} · {ride.seatsTaken}/{ride.seatsTotal} seats taken · ৳{ride.farePerSeat}/seat
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
