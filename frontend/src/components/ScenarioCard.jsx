import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import { fetchGraph } from "../api/client";

export default function ScenarioCard({ scenario }) {
  const [graphData, setGraphData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is an uploaded scenario
    if (scenario._isUploaded && scenario._uploadedData) {
      // Use uploaded data directly - don't call API
      const uploadedGraph = scenario._uploadedData.graph;
      setGraphData({
        nodes: uploadedGraph.nodes.map((n) => ({ id: n.id })),
        links: uploadedGraph.edges.map((e) => ({
          source: e.source,
          target: e.target,
          amount: e.amount,
          edgeType: e.edge_type || e.relation,
        })),
      });
      return;
    }

    // For API scenarios, call fetchGraph endpoint
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
      className="card h-100 shadow-sm cursor-pointer transition-all"
      style={{ cursor: "pointer" }}
      onMouseEnter={(e) => e.currentTarget.classList.add("shadow-lg")}
      onMouseLeave={(e) => e.currentTarget.classList.remove("shadow-lg")}
    >
      <div style={{ height: "280px", overflow: "hidden", position: "relative" }} className="bg-light">
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
          <div className="d-flex align-items-center justify-content-center h-100 text-muted">
            <small>Loading graph...</small>
          </div>
        )}
      </div>
      <div className="card-body p-3">
        <h5 className="card-title mb-0 text-center">{scenario.name}</h5>
      </div>
    </div>
  );
}