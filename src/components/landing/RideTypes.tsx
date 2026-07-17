import { CarTaxiFront, CarFront } from "lucide-react";

export default function RideTypes() {
  return (
    <section
      style={{
        padding: "100px",
        background: "#f8fafc",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          fontSize: "48px",
          marginBottom: "60px",
        }}
      >
        Two Ways to Ride
      </h1>

      <div
        style={{
          display: "flex",
          gap: "40px",
        }}
      >
        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: "25px",
            padding: "40px",
            boxShadow: "0 15px 30px rgba(0,0,0,.06)",
          }}
        >
          <CarTaxiFront size={60} color="#16a34a" />

          <h2>Shared Taxi Ride</h2>

          <p>
            Book an Uber, Pathao or inDrive and invite students travelling the
            same route to split the fare fairly.
          </p>

          <button
            style={{
              marginTop: "20px",
              background: "#16a34a",
              color: "white",
              border: "none",
              padding: "14px 30px",
              borderRadius: "30px",
            }}
          >
            Learn More
          </button>
        </div>

        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: "25px",
            padding: "40px",
            boxShadow: "0 15px 30px rgba(0,0,0,.06)",
          }}
        >
          <CarFront size={60} color="#16a34a" />

          <h2>Student Driver Ride</h2>

          <p>
            Students with personal vehicles can offer available seats to recover
            fuel costs while helping fellow students commute.
          </p>

          <button
            style={{
              marginTop: "20px",
              background: "#16a34a",
              color: "white",
              border: "none",
              padding: "14px 30px",
              borderRadius: "30px",
            }}
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}