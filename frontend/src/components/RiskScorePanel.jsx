import React from "react";

export default function RiskScorePanel({ edgeScores }) {
  if (!edgeScores) return null;

  const sorted = [...edgeScores].sort((a, b) => b.score - a.score);

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-primary text-white">
        <h5 className="card-title mb-0">Relationship Risk Scores</h5>
      </div>
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {sorted.map((edge, i) => (
            <div key={i} className="list-group-item">
              <div className="d-flex w-100 justify-content-between align-items-start mb-2">
                <div className="fw-bold small">
                  {edge.source.replace(/_/g, " ")} → {edge.target.replace(/_/g, " ")}
                </div>
                <span className={`badge bg-${edge.score > 0.6 ? "danger" : edge.score > 0.3 ? "warning" : "info"}`}>
                  {edge.score.toFixed(2)}
                </span>
              </div>
              <p className="text-muted small mb-2">
                {edge.relation}
                {edge.edge_type === "inferred"
                  ? ` · ${edge.hops} hops · ${(edge.pass_through_ratio * 100).toFixed(0)}% pass-through`
                  : ` · £${edge.amount?.toLocaleString()}`}
              </p>
              {edge.reasons?.length > 0 && (
                <ul className="small text-muted mb-0 ps-3">
                  {edge.reasons.map((r, j) => (
                    <li key={j}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
