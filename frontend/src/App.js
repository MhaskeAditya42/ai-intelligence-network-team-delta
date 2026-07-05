import React, { useEffect, useState } from "react";
import GraphView from "./components/GraphView";
import SARPanel from "./components/SARPanel";
import { fetchSarReport } from "./api/client";

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSarReport("scenario_config", "Gaurav_Sustainable_Corp")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div style={{ padding: "20px", color: "red" }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: "20px" }}>Loading network analysis...</div>;

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h1>Network Intelligence Framework</h1>
      <p>
        Analyzing: <strong>{data.entity}</strong> (Scenario: {data.scenario})
      </p>

      <div style={{ display: "flex", gap: "24px", marginTop: "20px", flexWrap: "wrap" }}>
        <GraphView graphData={data} roleAnalysis={data.role_analysis} />
        <SARPanel recommendation={data.recommendation} />
      </div>
    </div>
  );
}