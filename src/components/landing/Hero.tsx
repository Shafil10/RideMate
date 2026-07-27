import { CarFront, Users, Leaf, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Hero() {
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleCreateCommute() {
    if (user) {
      navigate("/rides#create");
    } else {
      navigate("/login", { state: { from: "/rides#create" } });
    }
  }

  function handleExploreRides() {
    navigate("/rides#browse");
  }

  return (
    <section
      className="hero-section"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom right,#ecfdf5,#ffffff,#dcfce7)",
      }}
    >
      {/* LEFT */}

      <div className="hero-left">
        <div
          style={{
            display: "inline-block",
            background: "#dcfce7",
            color: "#15803d",
            padding: "10px 20px",
            borderRadius: "30px",
            fontWeight: 700,
            marginBottom: 25,
          }}
        >
          Bangladesh's First University Carpool Platform
        </div>

        <h1
          className="hero-title"
          style={{
            margin: 0,
          }}
        >
          Travel Together.
          <br />
          Save Together.
        </h1>

        <p
          style={{
            color: "#666",
            fontSize: "22px",
            lineHeight: "36px",
            marginTop: 25,
            maxWidth: 520,
          }}
        >
          RideMate helps university students create or join planned
          rides, split transport costs fairly, and build safer,
          greener campus communities.
        </p>

        <div className="hero-buttons" style={{ marginTop: 40 }}>
          <button
            onClick={handleCreateCommute}
            style={{
              padding: "18px 36px",
              background: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "40px",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            Create a Commute
          </button>

          <button
            onClick={handleExploreRides}
            style={{
              padding: "18px 36px",
              background: "white",
              border: "2px solid #16a34a",
              color: "#16a34a",
              borderRadius: "40px",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            Explore Rides
          </button>
        </div>

        <div className="hero-stats" style={{ marginTop: 60 }}>
          <div>
            <h2 style={{ color: "#16a34a", margin: 0 }}>40+</h2>
            <p>Universities</p>
          </div>

          <div>
            <h2 style={{ color: "#16a34a", margin: 0 }}>4.5M+</h2>
            <p>Students</p>
          </div>

          <div>
            <h2 style={{ color: "#16a34a", margin: 0 }}>30%</h2>
            <p>Average Savings</p>
          </div>
        </div>
      </div>

      {/* RIGHT */}

      <div className="hero-right">
        <div
          className="hero-preview-card"
          style={{
            background: "white",
            borderRadius: "35px",
            boxShadow: "0 30px 60px rgba(0,0,0,.12)",
            padding: "35px",
          }}
        >
          <h2>Today's Ride</h2>

          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              borderRadius: "20px",
              background: "#f3f4f6",
            }}
          >
            <CarFront color="#16a34a" size={60} />

            <h3>Dhanmondi → Bashundhara</h3>

            <p>7:30 AM</p>

            <p>Seats Available : 3 / 4</p>

            <hr />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Estimated Cost</span>

              <strong>৳120</strong>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginTop: "25px",
            }}
          >
            <div
              style={{
                background: "#dcfce7",
                borderRadius: "20px",
                padding: "20px",
              }}
            >
              <Users color="#15803d" />

              <h3>Trusted Circle</h3>

              <p>12 Friends</p>
            </div>

            <div
              style={{
                background: "#dbeafe",
                borderRadius: "20px",
                padding: "20px",
              }}
            >
              <Leaf color="green" />

              <h3>CO₂ Saved</h3>

              <p>142 kg</p>
            </div>

            <div
              style={{
                background: "#ede9fe",
                borderRadius: "20px",
                padding: "20px",
              }}
            >
              <Sparkles color="#7c3aed" />

              <h3>AI Match</h3>

              <p>96%</p>
            </div>

            <div
              style={{
                background: "#fee2e2",
                borderRadius: "20px",
                padding: "20px",
              }}
            >
              <h3>Trust Score</h3>

              <h1
                style={{
                  margin: 0,
                  color: "#16a34a",
                }}
              >
                98
              </h1>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}