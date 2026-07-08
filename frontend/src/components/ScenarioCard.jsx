import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import { fetchGraph } from "../api/client";

export default function ScenarioCard({ scenario }) {
  const [graphData, setGraphData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGraph(scenario.id, scenario.trigger_entity)
      .then((data) =>
        setGraphData({
          nodes: data.graph.nodes.map((n) => ({ id: n.id })),
          links: data.graph.edges.map((e) => ({
            source: e.source,
            target: e.target,
            amount: e.amount,
            edgeType: e.edge_type || e.relation,
          })),
        })
      )
      .catch(() => setGraphData(null));
  }, [scenario]);

  return (
    <div
      onClick={() => navigate(`/scenario/${scenario.id}`)}
      style={{
        borderRadius: "12px",
        padding: "10px",
        cursor: "pointer",
        width: "420px",
        transition: "box-shadow 0.2s",
        background: "#f7f8fb",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div style={{ height: "280px", background: "#f7f8fb", borderRadius: "10px", overflow: "hidden" }}>
        {graphData ? (
          <ForceGraph2D
            graphData={graphData}
            width={400}
            height={280}
            nodeRelSize={4}
            enableZoomPanInteraction={false}
            enableNodeDrag={false}
            linkColor={() => "#7b8ea3"}
            nodeColor={() => "#457b9d"}
            cooldownTicks={80}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#aaa" }}>
            Loading graph...
          </div>
        )}
      </div>
      <div style={{ marginTop: "10px", textAlign: "center" }}>
        <h3 style={{ fontSize: "16px", margin: 0, color: "#1f2937" }}>{scenario.name}</h3>
      </div>
    </div>
  );
}