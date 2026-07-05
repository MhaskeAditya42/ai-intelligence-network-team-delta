import React, { useEffect, useState } from "react";
import GraphView from "./components/GraphView";
import SARPanel from "./components/SARPanel";
import { fetchSarReport, fetchScenarios } from "./api/client";

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [scenario, setScenario] = useState("scenario_config");
  const [entity, setEntity] = useState("Gaurav_Sustainable_Corp");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenarios()
      .then((list) => {
        setScenarios(list);
        if (list.includes("scenario_config")) {
          setScenario("scenario_config");
        } else if (list.length > 0) {
          setScenario(list[0]);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!scenario) return;

    setLoading(true);
    setData(null);
    setError(null);

    fetchSarReport(scenario, entity)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [scenario, entity]);

  if (error) return <div style={{ padding: "20px", color: "red" }}>Error: {error}</div>;
  if (loading || !data) return <div style={{ padding: "20px" }}>Loading network analysis...</div>;

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h1>Network Intelligence Framework</h1>

      <div style={{ marginTop: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
        <label>
          Scenario:
          <select
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
            style={{ marginLeft: "8px" }}
          >
            {scenarios.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Target entity:
          <input
            value={entity}
            onChange={(event) => setEntity(event.target.value)}
            style={{ marginLeft: "8px" }}
          />
        </label>
      </div>

      <p style={{ marginTop: "16px" }}>
        Analyzing: <strong>{data.entity}</strong> (Scenario: {data.scenario})
      </p>

      <div style={{ display: "flex", gap: "24px", marginTop: "20px", flexWrap: "wrap" }}>
        <GraphView graphData={data} roleAnalysis={data.role_analysis} />
        <SARPanel recommendation={data.recommendation} />
      </div>
    </div>
  );
}