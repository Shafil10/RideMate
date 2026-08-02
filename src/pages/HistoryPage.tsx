import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyBookings, type Booking } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function HistoryPage() {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMyBookings(token)
      .then((data) => setBookings(data.bookings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (!user) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "120px 24px 80px", textAlign: "center" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Log in to see your purchase history</h1>
        <Link
          to="/login"
          state={{ from: "/history" }}
          style={{
            display: "inline-block",
            marginTop: 8,
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
    );
  }

  const totalSpent = bookings.reduce((sum, b) => sum + b.pricePaid, 0);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "120px 24px 80px" }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Purchase History</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>
        Every ride you've joined and paid for, most recent first.
      </p>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: 8, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading your history...</p>
      ) : bookings.length === 0 ? (
        <div style={{ background: "#f9fafb", padding: 24, borderRadius: 16, textAlign: "center" }}>
          <p style={{ color: "#555", marginBottom: 12 }}>You haven't joined any rides yet.</p>
          <Link to="/rides#browse" style={{ color: "#16a34a", fontWeight: 700, textDecoration: "none" }}>
            Browse available rides →
          </Link>
        </div>
      ) : (
        <>
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 12,
              padding: "14px 20px",
              marginBottom: 24,
              fontWeight: 700,
              color: "#14532d",
            }}
          >
            Total spent: ৳{totalSpent} across {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {bookings.map((b) => (
              <div
                key={b.id}
                style={{
                  border: "1px solid #ececec",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {b.ride.origin} → {b.ride.destination}
                  </div>
                  <div style={{ color: "#555", fontSize: 14 }}>
                    {b.ride.university} · {new Date(b.ride.departureTime).toLocaleString()} ·{" "}
                    {b.ride.type === "shared-taxi" ? "Shared Taxi Ride" : "Student Driver Ride"}
                  </div>
                  <div style={{ color: "#555", fontSize: 14 }}>
                    Driver: {b.ride.driverName} · {b.seats} seat{b.seats === 1 ? "" : "s"} booked
                  </div>
                  {b.ride.pickupPoint && (
                    <div style={{ color: "#16a34a", fontSize: 13, marginTop: 2 }}>Pickup: {b.ride.pickupPoint}</div>
                  )}
                  <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>
                    Booked {new Date(b.createdAt).toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    background: "#16a34a",
                    color: "white",
                    padding: "10px 18px",
                    borderRadius: 24,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  ৳{b.pricePaid}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
