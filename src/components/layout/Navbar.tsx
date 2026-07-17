import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "80px",
        background: "rgba(255,255,255,.85)",
        backdropFilter: "blur(15px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 80px",
        zIndex: 999,
        borderBottom: "1px solid #ececec",
      }}
    >
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div
          style={{
            width: 45,
            height: 45,
            background: "#16a34a",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: "white",
            fontWeight: "bold",
          }}
        >
          R
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: "28px",
          }}
        >
          RideMate
        </h2>
      </Link>

      <div
        style={{
          display: "flex",
          gap: "40px",
          fontWeight: 600,
        }}
      >
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>Home</Link>
        <Link to="/rides" style={{ color: "inherit", textDecoration: "none" }}>Find a Ride</Link>
        <a href="#universities">Universities</a>
        <a href="#about">About</a>
      </div>

      <div
        style={{
          display: "flex",
          gap: "15px",
          alignItems: "center",
        }}
      >
        <button
          style={{
            border: "none",
            background: "#eee",
            padding: "12px 20px",
            borderRadius: "30px",
            cursor: "pointer",
          }}
        >
          Login
        </button>

        <Link
          to="/rides"
          style={{
            border: "none",
            background: "#16a34a",
            color: "white",
            padding: "12px 24px",
            borderRadius: "30px",
            cursor: "pointer",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Create Ride
        </Link>

        <Menu />
      </div>
    </nav>
  );
}