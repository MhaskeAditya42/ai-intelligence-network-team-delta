import React from "react";

const CLASSIFICATION_STYLES = {
  SAR_FILING_REQUIRED: { alertClass: "alert-danger", label: "🚨 SAR Filing Required" },
  ENHANCED_DUE_DILIGENCE: { alertClass: "alert-warning", label: "⚠️ Enhanced Due Diligence" },
  NO_ACTION_REQUIRED: { alertClass: "alert-success", label: "✅ No Action Required" },
};

export default function SARPanel({ recommendation }) {
  // Debug logging
  React.useEffect(() => {
    console.log("🔍 SARPanel received recommendation:", recommendation);
  }, [recommendation]);

  // Handle undefined recommendation
  if (!recommendation) {
    return (
      <div className="alert alert-info shadow-sm" role="alert">
        <h4 className="alert-heading">ℹ️ No Recommendation Available</h4>
        <p className="mb-0">Recommendation data is not available for this scenario.</p>
      </div>
    );
  }

  const style = CLASSIFICATION_STYLES[recommendation.classification] || {
    alertClass: "alert-secondary",
    label: recommendation.classification || "Unknown Classification",
  };

  return (
    <div className={`alert ${style.alertClass} shadow-sm`} role="alert">
      <h4 className="alert-heading">{style.label}</h4>
      <p className="mb-3">{recommendation.rationale || "No rationale provided"}</p>

      <div className="border-top pt-3">
        {Object.entries(recommendation.risk_indicators || {}).map(([key, value]) =>
          value ? (
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