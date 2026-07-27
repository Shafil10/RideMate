import { BrainCircuit } from "lucide-react";

export default function AISection() {
  const features = [
    "AI Route Matching",
    "Fair Fare Calculation",
    "Reliability Prediction",
    "Smart Pickup Suggestions",
    "Recurring Ride Prediction",
    "Traffic-aware Cost Estimation",
  ];

  return (
    <section
      className="rm-section"
      style={{
        background:
          "linear-gradient(135deg,#16a34a,#22c55e)",
        color: "white",
      }}
    >
      <h1 className="rm-heading">
        AI Powered RideMate
      </h1>

      <div className="rm-grid-3">
        {features.map((item) => (
          <div
            key={item}
            style={{
              background: "rgba(255,255,255,.12)",
              backdropFilter: "blur(15px)",
              padding: "30px",
              borderRadius: "20px",
            }}
          >
            <BrainCircuit size={45} />

            <h2>{item}</h2>

            <p>
              Intelligent algorithms help students find the safest,
              cheapest and most reliable rides.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}