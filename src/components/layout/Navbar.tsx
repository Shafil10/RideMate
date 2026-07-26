import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav
      className="navbar"
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
        zIndex: 999,
        borderBottom: "1px solid #ececec",
      }}
    >
      <Link
        to="/"
        onClick={closeMenu}
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
            flexShrink: 0,
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
        className="navbar-links"
        style={{
          fontWeight: 600,
        }}
      >
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>Home</Link>
        <Link to="/rides" style={{ color: "inherit", textDecoration: "none" }}>Find a Ride</Link>
        <a href="#universities">Universities</a>
        <a href="#about">About</a>
      </div>

      <div className="navbar-actions">
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="navbar-user-name" style={{ fontWeight: 600, fontSize: 14 }}>Hi, {user.name.split(" ")[0]}</span>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              style={{
                border: "none",
                background: "#eee",
                padding: "12px 20px",
                borderRadius: "30px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            style={{
              border: "none",
              background: "#eee",
              padding: "12px 20px",
              borderRadius: "30px",
              cursor: "pointer",
              textDecoration: "none",
              color: "inherit",
              fontWeight: 400,
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "nowrap",
            }}
          >
            Login
          </Link>
        )}

        <Link
          to={user ? "/rides#create" : "/login"}
          state={user ? undefined : { from: "/rides#create" }}
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
            whiteSpace: "nowrap",
          }}
        >
          Create Ride
        </Link>
      </div>

      <button
        className="navbar-menu-btn"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X /> : <Menu />}
      </button>

      <div className={`navbar-mobile-panel${menuOpen ? " open" : ""}`}>
        <Link to="/" onClick={closeMenu} style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>Home</Link>
        <Link to="/rides" onClick={closeMenu} style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>Find a Ride</Link>
        <a href="#universities" onClick={closeMenu} style={{ fontWeight: 600 }}>Universities</a>
        <a href="#about" onClick={closeMenu} style={{ fontWeight: 600 }}>About</a>

        <div style={{ height: 1, background: "#ececec", margin: "4px 0" }} />

        {user ? (
          <button
            onClick={() => {
              logout();
              closeMenu();
              navigate("/");
            }}
            style={{ textAlign: "left", background: "none", border: "none", padding: 0, fontWeight: 600, fontSize: 16, cursor: "pointer" }}
          >
            Logout
          </button>
        ) : (
          <Link to="/login" onClick={closeMenu} style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>
            Login
          </Link>
        )}

        <Link
          to={user ? "/rides#create" : "/login"}
          state={user ? undefined : { from: "/rides#create" }}
          onClick={closeMenu}
          style={{
            background: "#16a34a",
            color: "white",
            padding: "12px 20px",
            borderRadius: "30px",
            fontWeight: 700,
            textDecoration: "none",
            textAlign: "center",
          }}
        >
          Create Ride
        </Link>
      </div>
    </nav>
  );
}
