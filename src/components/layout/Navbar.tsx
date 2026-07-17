import { Menu } from "lucide-react";

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
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
      </div>

      <div
        style={{
          display: "flex",
          gap: "40px",
          fontWeight: 600,
        }}
      >
        <a href="#">Home</a>
        <a href="#">Features</a>
        <a href="#">Community</a>
        <a href="#">Universities</a>
        <a href="#">About</a>
      </div>

      <div
        style={{
          display: "flex",
          gap: "15px",
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

        <button
          style={{
            border: "none",
            background: "#16a34a",
            color: "white",
            padding: "12px 24px",
            borderRadius: "30px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Create Ride
        </button>

        <Menu />
      </div>
    </nav>
  );
}