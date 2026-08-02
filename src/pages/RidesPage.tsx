import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createRide, fetchRides, fetchUniversities, joinRide, type Ride } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const DHAKA_LOCATIONS = [
  "Dhanmondi",
  "Mirpur",
  "Uttara",
  "Gulshan",
  "Banani",
  "Mohammadpur",
  "Farmgate",
  "Motijheel",
  "Bashundhara",
  "Rampura",
  "Badda",
  "Mohakhali",
  "Malibagh",
  "Jatrabari",
  "Savar",
  "Shyamoli",
  "Panthapath",
  "Khilgaon",
  "Tejgaon",
  "Nikunja",
  "Baridhara",
  "Wari",
];

const emptyForm = {
  type: "student-driver" as Ride["type"],
  origin: "",
  destination: "",
  pickupPoint: "",
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
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [universities, setUniversities] = useState<string[]>([]);
  const [joinSeats, setJoinSeats] = useState<Record<string, number>>({});

  function loadRides() {
    setLoading(true);
    fetchRides()
      .then((data) => setRides(data.rides))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRides();
    fetchUniversities()
      .then((data) => setUniversities(data.universities))
      .catch(() => setUniversities([]));
  }, []);

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

  async function handleJoin(id: string, remaining: number) {
    if (!token) {
      navigate("/login", { state: { from: "/rides#browse" } });
      return;
    }
    const seats = Math.min(Math.max(joinSeats[id] ?? 1, 1), remaining);
    setError(null);
    try {
      await joinRide(id, seats, token);
      loadRides();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join ride.");
    }
  }

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

            <select
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              style={inputStyle}
              required
            >
              <option value="" disabled>
                Starting from...
              </option>
              {DHAKA_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            <select
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              style={inputStyle}
              required
            >
              <option value="" disabled>
                Going to...
              </option>
              <optgroup label="Universities">
                {universities.map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Areas">
                {DHAKA_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </optgroup>
            </select>

            <select
              value={form.university}
              onChange={(e) => setForm({ ...form, university: e.target.value })}
              style={inputStyle}
              required
            >
              <option value="" disabled>
                University
              </option>
              {universities.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>

            <input
              placeholder="Exact pickup point (e.g. Road 5, House 12, near XYZ landmark)"
              value={form.pickupPoint}
              onChange={(e) => setForm({ ...form, pickupPoint: e.target.value })}
              style={{ ...inputStyle, gridColumn: "1 / -1" }}
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

      {loading ? (
        <p>Loading rides...</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {rides.map((ride) => {
            const remaining = ride.seatsTotal - ride.seatsTaken;
            const full = remaining <= 0;
            const seatsToJoin = Math.min(Math.max(joinSeats[ride.id] ?? 1, 1), Math.max(remaining, 1));
            return (
              <div
                key={ride.id}
                className="ride-card"
                style={{
                  border: "1px solid #ececec",
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {ride.origin} → {ride.destination}
                  </div>
                  <div style={{ color: "#555", fontSize: 14 }}>
                    {ride.university} · {new Date(ride.departureTime).toLocaleString()} ·{" "}
                    {ride.type === "shared-taxi" ? "Shared Taxi Ride" : "Student Driver Ride"}
                  </div>
                  <div style={{ color: "#555", fontSize: 14 }}>
                    Driver: {ride.driverName} · {ride.seatsTaken}/{ride.seatsTotal} seats taken · ৳{ride.farePerSeat}/seat
                  </div>
                  {ride.pickupPoint && (
                    <div style={{ color: "#16a34a", fontSize: 13, marginTop: 2 }}>Pickup: {ride.pickupPoint}</div>
                  )}
                </div>

                {!full && user && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555" }}>
                      Seats
                      <input
                        type="number"
                        min={1}
                        max={remaining}
                        value={seatsToJoin}
                        onChange={(e) =>
                          setJoinSeats({ ...joinSeats, [ride.id]: Number(e.target.value) })
                        }
                        style={{ width: 56, padding: "6px 8px", borderRadius: 6, border: "1px solid #d1d5db" }}
                      />
                    </label>
                    <span style={{ fontSize: 13, color: "#555", whiteSpace: "nowrap" }}>
                      = ৳{seatsToJoin * ride.farePerSeat}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => handleJoin(ride.id, remaining)}
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
                  {full ? "Full" : user ? `Join (৳${seatsToJoin * ride.farePerSeat})` : "Log in to join"}
                </button>
              </div>
            );
          })}
        </div>
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
