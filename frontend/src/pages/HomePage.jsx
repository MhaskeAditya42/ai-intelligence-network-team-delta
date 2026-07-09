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
    <div className="py-5">
      <div className="container-fluid px-4">
        <h1 className="display-4 fw-bold mb-2">Network Intelligence Framework</h1>
        <p className="lead text-muted mb-4">
          Select a scenario to view its network graph, SAR recommendation, and relationship risk scores.
        </p>

        {loading && (
          <div className="alert alert-info d-flex align-items-center" role="alert">
            <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
            Loading scenarios...
          </div>
        )}

        <div className="row g-4">
          {scenarios.map((s) => (
            <div key={s.id} className="col-lg-6 col-xl-4">
              <ScenarioCard scenario={s} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}