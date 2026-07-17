import { Search, Users, CarFront } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <Search size={45} color="#16a34a" />,
      title: "Create a Commute",
      desc: "Choose your pickup point, destination, departure time and available seats.",
    },
    {
      icon: <Users size={45} color="#16a34a" />,
      title: "Students Join",
      desc: "Verified university students discover your ride and reserve seats.",
    },
    {
      icon: <CarFront size={45} color="#16a34a" />,
      title: "Travel Together",
      desc: "Meet at the recommended pickup point and enjoy affordable commuting.",
    },
  ];

  return (
    <section
      style={{
        padding: "100px",
        background: "#ffffff",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          fontSize: "48px",
          marginBottom: "60px",
        }}
      >
        How RideMate Works
      </h1>

      <div
        style={{
          display: "flex",
          gap: "35px",
        }}
      >
        {steps.map((step) => (
          <div
            key={step.title}
            style={{
              flex: 1,
              padding: "35px",
              borderRadius: "25px",
              background: "#f8fafc",
              boxShadow: "0 10px 25px rgba(0,0,0,.05)",
            }}
          >
            {step.icon}

            <h2>{step.title}</h2>

            <p
              style={{
                color: "#555",
                lineHeight: "30px",
              }}
            >
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}