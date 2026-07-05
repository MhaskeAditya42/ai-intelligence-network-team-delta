import React from "react";

const CLASSIFICATION_STYLES = {
  SAR_FILING_REQUIRED: { bg: "#fdecea", border: "#e63946", label: "🚨 SAR Filing Required" },
  ENHANCED_DUE_DILIGENCE: { bg: "#fff8e1", border: "#f4a261", label: "⚠️ Enhanced Due Diligence" },
  NO_ACTION_REQUIRED: { bg: "#e8f5e9", border: "#2a9d8f", label: "✅ No Action Required" },
};

export default function SARPanel({ recommendation }) {
  const style = CLASSIFICATION_STYLES[recommendation.classification] || {
    bg: "#f5f5f5",
    border: "#ccc",
    label: recommendation.classification,
  };

  return (
    <div
      style={{
        backgroundColor: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: "8px",
        padding: "16px",
        maxWidth: "500px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{style.label}</h3>
      <p style={{ fontSize: "14px", lineHeight: "1.5" }}>{recommendation.rationale}</p>

      <div style={{ marginTop: "12px" }}>
        {Object.entries(recommendation.risk_indicators || {}).map(([key, value]) =>
          value ? (
            <div key={key} style={{ marginBottom: "10px" }}>
              <strong style={{ fontSize: "13px", textTransform: "capitalize" }}>
                {key.replace(/_/g, " ")}:
              </strong>
              <p style={{ fontSize: "13px", margin: "4px 0", color: "#444" }}>{value}</p>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}