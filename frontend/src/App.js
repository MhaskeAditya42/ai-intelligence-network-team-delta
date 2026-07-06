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
    <div className="container py-4" style={{ fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Network Intelligence</h1>
        <small className="text-muted">Minimalist analysis dashboard</small>
      </div>

      <div className="row gy-3">
        <div className="col-12 col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex gap-3 mb-3 flex-wrap">
                <div>
                  <label className="form-label mb-1 small fw-bold">Scenario</label>
                  <select className="form-select form-select-sm" value={scenario} onChange={(e) => setScenario(e.target.value)}>
                    {scenarios.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                    <label className="form-label mb-1 small fw-bold">Target entity</label>
                  <input className="form-control form-control-sm" value={entity} onChange={(e) => setEntity(e.target.value)} />
                </div>
              </div>

              <p className="mb-2 text-muted small">
                Analyzing: <strong className="text-body">{data.entity}</strong> <span className="text-muted">(Scenario: {data.scenario})</span>
              </p>

              <GraphView graphData={data} roleAnalysis={data.role_analysis} />
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <SARPanel recommendation={{ ...data.recommendation, scorecard: data.scorecard }} />
        </div>
      </div>
    </div>
  );
}