import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ScenarioCard from "../components/ScenarioCard";
import { fetchScenarios } from "../api/client";

export default function HomePage() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenarios()
      .then((data) => {
        // Filter out the consolidated graph from individual scenario cards
        const filtered = data.filter(s => s.id !== "Consolidated_All_Transactions");
        setScenarios(filtered);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-5">
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="display-4 fw-bold mb-2">Network Intelligence Framework</h1>
            <p className="lead text-muted mb-0">
              Select a scenario to view its network graph, SAR recommendation, and relationship risk scores.
            </p>
          </div>
          <Link to="/consolidated" className="btn btn-primary btn-lg">
            📊 View Consolidated Graph
          </Link>
        </div>

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