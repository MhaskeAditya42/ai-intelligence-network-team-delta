import React from "react";
import { useNavigate } from "react-router-dom";

export default function ScenarioCard({ scenario, batchDate }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/scenario/${scenario.id}${batchDate ? `?batch_date=${batchDate}` : ""}`)}
      className="scenario-card h-100"
    >
      <div className="scenario-visual" aria-hidden="true">
        <span /><span /><span /><i /><i /><i />
      </div>
      <div className="p-3">
        <span className="scenario-chip">Network case</span>
        <h5 className="mb-2 mt-2">{scenario.name}</h5>
        <p className="small text-muted mb-3">{scenario.node_count} entities · {scenario.edge_count} relationships</p>
        <span className="scenario-link">Open investigation →</span>
      </div>
    </div>
  );
}
