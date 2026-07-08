import React, { useEffect, useState } from "react";
import ScenarioCard from "../components/ScenarioCard";
import { fetchScenarios } from "../api/client";

export default function HomePage() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenarios()
      .then(setScenarios)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "32px", fontFamily: "sans-serif" }}>
      <h1>Network Intelligence Framework</h1>
      <p style={{ color: "#666" }}>
        Select a scenario to view its network graph, SAR recommendation, and relationship risk scores.
      </p>

      {loading && <p>Loading scenarios...</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "24px" }}>
        {scenarios.map((s) => (
          <ScenarioCard key={s.id} scenario={s} />
        ))}
      </div>
    </div>
  );
}