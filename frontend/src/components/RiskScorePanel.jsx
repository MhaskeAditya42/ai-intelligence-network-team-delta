import React, { useEffect, useMemo, useState } from "react";

export default function RiskScorePanel({ edgeScores }) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const sorted = useMemo(
    () => [...(edgeScores || [])].sort((a, b) => b.score - a.score),
    [edgeScores]
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const visibleScores = sorted.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [edgeScores]);

  if (!edgeScores) return null;

  return (
    <section className="scenario-panel relationship-scorecard">
      <div className="scenario-panel-header">
        <h2>Relationship scorecard</h2>
        <span className="scenario-panel-meta">Highest score first</span>
      </div>
      <div className="scenario-panel-body p-0">
        <div className="list-group list-group-flush">
          {visibleScores.map((edge, i) => (
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
      {sorted.length > pageSize && (
        <div className="scenario-panel-footer">
          <small>Page {page} of {totalPages}</small>
          <div className="btn-group btn-group-sm" role="group" aria-label="Relationship scorecard pagination">
            <button className="btn btn-outline-secondary" type="button" onClick={() => setPage((current) => current - 1)} disabled={page === 1}>Previous</button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => setPage((current) => current + 1)} disabled={page === totalPages}>Next</button>
          </div>
        </div>
      )}
    </section>
  );
}
