import React from "react";

const BADGE_VARIANTS = {
  SAR_FILING_REQUIRED: "danger",
  ENHANCED_DUE_DILIGENCE: "warning",
  NO_ACTION_REQUIRED: "success",
};

export default function SARPanel({ recommendation }) {
  const variant = BADGE_VARIANTS[recommendation.classification] || "secondary";

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title mb-0">Assessment</h5>
          <span className={`badge bg-${variant} text-white`}>{recommendation.classification}</span>
        </div>

        <p className="card-text small text-muted">{recommendation.rationale}</p>

              {recommendation.scorecard && recommendation.scorecard.length > 0 && (
                  <div className="mt-3">
                      <h6 className="mb-2">ScoreCard</h6>
                      <ul className="list-group list-group-flush">
                          {recommendation.scorecard.slice(0, 10).map((row) => (
                              <li key={row.entity} className="list-group-item py-2">
                                  <div className="d-flex align-items-center">
                                      <div className="flex-shrink-0 me-2" style={{ width: 36 }}>{row.score}</div>
                                      <div className="flex-grow-1 me-2">
                                          <div className="progress" style={{ height: 8, borderRadius: 6 }}>
                                              <div
                                                  className={`progress-bar ${row.score >= 70 ? "bg-danger" : row.score >= 40 ? "bg-warning" : "bg-success"}`}
                                                  role="progressbar"
                                                  style={{ width: `${row.score}%` }}
                                                  aria-valuenow={row.score}
                                                  aria-valuemin="0"
                                                  aria-valuemax="100"
                                              />
                                          </div>
                                          <div className="small text-muted mt-1">{row.entity}</div>
                                      </div>
                                  </div>
                              </li>
                          ))}
                      </ul>
                      <div className="small text-muted mt-2">Top nodes by relationship strength</div>
                  </div>
              )}
        <div className="mt-2">
          {Object.entries(recommendation.risk_indicators || {}).map(([key, value]) =>
            value ? (
              <div key={key} className="mb-2">
                <div className="small text-uppercase text-muted">{key.replace(/_/g, " ")}</div>
                <div className="small text-body">{value}</div>
              </div>
            ) : null
          )}
        </div>

      </div>
    </div>
  );
}
