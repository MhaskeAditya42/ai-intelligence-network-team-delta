import React from "react";

const CLASSIFICATION_STYLES = {
  SAR_FILING_REQUIRED: { tone: "danger", label: "SAR filing required" },
  ENHANCED_DUE_DILIGENCE: { tone: "warning", label: "Enhanced due diligence" },
  NO_ACTION_REQUIRED: { tone: "success", label: "No action required" },
};

export default function SARPanel({ recommendation }) {
  const style = CLASSIFICATION_STYLES[recommendation.classification] || {
    tone: "secondary",
    label: recommendation.classification,
  };

  return (
    <section className={`scenario-panel sar-panel sar-panel-${style.tone}`} aria-label="SAR recommendation">
      <div className="scenario-panel-header">
        <h2>Recommendation</h2>
        <span className={`sar-status sar-status-${style.tone}`}>{style.label}</span>
      </div>
      <div className="scenario-panel-body">
        <p className="scenario-copy sar-rationale">{recommendation.rationale}</p>

        {recommendation.risk_indicators?.relationship_score_evidence && (
          <div className="scenario-evidence">
            <strong>Relationship score assessment</strong>
            <p>{recommendation.risk_indicators.relationship_score_evidence}</p>
          </div>
        )}

        <div className="scenario-evidence-list">
          {Object.entries(recommendation.risk_indicators || {}).map(([key, value]) =>
            value && key !== "relationship_score_evidence" ? (
              <div key={key} className="scenario-evidence">
                <strong className="text-capitalize">
                  {key.replace(/_/g, " ")}
                </strong>
                <p>{value}</p>
              </div>
            ) : null
          )}
        </div>
      </div>
    </section>
  );
}
