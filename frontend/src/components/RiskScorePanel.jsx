import React from "react";

export default function RiskScorePanel({ edgeScores }) {
  if (!edgeScores) return null;

  const sorted = [...edgeScores].sort((a, b) => b.score - a.score);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", width: "420px" }}>
      <h3 style={{ marginTop: 0 }}>Relationship Risk Scores</h3>
      {sorted.map((edge, i) => (
        <div key={i} style={{ marginBottom: "10px", borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>
            {edge.source.replace(/_/g, " ")} → {edge.target.replace(/_/g, " ")}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {edge.relation} · £{edge.amount?.toLocaleString()} · Score: {edge.score}
          </div>
          {edge.reasons?.length > 0 && (
            <ul style={{ fontSize: "11px", color: "#888", margin: "4px 0 0 16px" }}>
              {edge.reasons.map((r, j) => (
                <li key={j}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}