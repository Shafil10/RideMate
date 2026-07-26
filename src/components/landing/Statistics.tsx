import { useEffect, useState } from "react";
import { fetchStats, type Stat } from "../../lib/api";

const fallbackStats: Stat[] = [
  { value: "4.5M+", label: "University Students" },
  { value: "40+", label: "Partner Universities" },
  { value: "30%", label: "Average Cost Saved" },
  { value: "95%", label: "AI Route Match" },
];

export default function Statistics() {
  const [stats, setStats] = useState<Stat[]>(fallbackStats);

  useEffect(() => {
    fetchStats()
      .then((data) => setStats(data.stats))
      .catch(() => setStats(fallbackStats));
  }, []);

  return (
    <section
      className="rm-section"
      style={{
        background: "#16a34a",
        color: "white",
      }}
    >
      <div
        className="rm-row"
        style={{
          justifyContent: "space-around",
        }}
      >
        {stats.map((item) => (
          <div key={item.label} style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "52px", margin: 0 }}>{item.value}</h1>
            <p style={{ fontSize: "18px", opacity: 0.9 }}>{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
