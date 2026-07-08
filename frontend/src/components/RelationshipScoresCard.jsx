import React, { useMemo } from "react";

function formatAmount(amount) {
  if (amount == null) return "N/A";
  return `£${Number(amount).toLocaleString()}`;
}

export default function RelationshipScoresCard({ relationshipScores }) {
  const edgeScores = relationshipScores?.edge_scores || [];

  const summary = useMemo(() => {
    const totalEdges = edgeScores.length;
    const averageScore = totalEdges
      ? edgeScores.reduce((sum, edge) => sum + (edge.score || 0), 0) / totalEdges
      : 0;

    const topEdges = [...edgeScores]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);

    return {
      totalEdges,
      averageScore: averageScore.toFixed(3),
      topEdges,
    };
  }, [edgeScores]);

  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        border: "1px solid #dde2e8",
        borderRadius: "12px",
        padding: "20px",
        minWidth: "320px",
        maxWidth: "420px",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Relationship Score Card</h3>

      <div style={{ display: "grid", rowGap: "10px", marginBottom: "18px" }}>
        <div>
          <strong>Total edges:</strong> {summary.totalEdges}
        </div>
        <div>
          <strong>Average edge risk:</strong> {summary.averageScore}
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <strong style={{ display: "block", marginBottom: "8px" }}>Top risk edges</strong>
        {summary.topEdges.length === 0 ? (
          <div style={{ color: "#666" }}>No edge scores available yet.</div>
        ) : (
          summary.topEdges.map((edge, index) => (
            <div
              key={`${edge.source}-${edge.target}-${index}`}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                marginBottom: "10px",
                backgroundColor: "#ffffff",
              }}
            >
              <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                <strong>{edge.source}</strong> → <strong>{edge.target}</strong>
              </div>
              <div style={{ fontSize: "13px", color: "#4a5568" }}>
                {edge.relation || "Unknown relation"} · {formatAmount(edge.amount)}
              </div>
              <div style={{ marginTop: "6px", fontSize: "13px" }}>
                <strong>Score:</strong> {edge.score ?? "N/A"}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ color: "#475569", fontSize: "13px", lineHeight: "1.5" }}>
        This card pulls the relationship risk scores for the selected scenario and highlights the highest-risk edges in the network.
      </div>
    </div>
  );
}
