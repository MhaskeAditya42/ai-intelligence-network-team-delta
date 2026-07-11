import React from "react";

const CLASSIFICATION_STYLES = {
  SAR_FILING_REQUIRED: { alertClass: "alert-danger", label: "🚨 SAR Filing Required" },
  ENHANCED_DUE_DILIGENCE: { alertClass: "alert-warning", label: "⚠️ Enhanced Due Diligence" },
  NO_ACTION_REQUIRED: { alertClass: "alert-success", label: "✅ No Action Required" },
};

export default function SARPanel({ recommendation }) {
  const style = CLASSIFICATION_STYLES[recommendation.classification] || {
    alertClass: "alert-secondary",
    label: recommendation.classification,
  };

  return (
    <div className={`alert ${style.alertClass} shadow-sm`} role="alert">
      <h4 className="alert-heading">{style.label}</h4>
      <p className="mb-3">{recommendation.rationale}</p>

      {recommendation.risk_indicators?.relationship_score_evidence && (
        <div className="border-top pt-3 mb-3">
          <strong className="d-block mb-1">Relationship score assessment</strong>
          <p className="mb-0 text-muted small">{recommendation.risk_indicators.relationship_score_evidence}</p>
        </div>
      )}

      <div className="border-top pt-3">
        {Object.entries(recommendation.risk_indicators || {}).map(([key, value]) =>
          value && key !== "relationship_score_evidence" ? (
            <div key={key} className="mb-3">
              <strong className="d-block mb-1 text-capitalize">
                {key.replace(/_/g, " ")}
              </strong>
              <p className="mb-0 text-muted small">{value}</p>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
