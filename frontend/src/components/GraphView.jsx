import React, { useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";

const ROLE_COLORS = {
  gatekeeper: "#e63946",
  mule: "#f4a261",
    ultimate_beneficiary: "#e63950", //"#9d4edd",
  default: "#457b9d",
};

function getNodeColor(nodeId, roleAnalysis) {
  if (!roleAnalysis) return ROLE_COLORS.default;
  const isUBO = roleAnalysis.ultimate_beneficiaries?.some((u) => u.entity === nodeId);
  const isGatekeeperEntity = roleAnalysis.gatekeepers?.some((g) => g.linked_entities.includes(nodeId));
  const isMule = roleAnalysis.mules?.some((m) => m.entity === nodeId);

  if (isUBO) return ROLE_COLORS.ultimate_beneficiary;
  if (isGatekeeperEntity) return ROLE_COLORS.gatekeeper;
  if (isMule) return ROLE_COLORS.mule;
  return ROLE_COLORS.default;
}

function getEdgeColor(score) {
  if (score === undefined) return "#999";
  if (score > 0.6) return "#e63946";
  if (score > 0.3) return "#f4a261";
  return "#a8dadc";
}

export default function GraphView({ graphData, roleAnalysis, edgeScores, width = 900, height = 560 }) {
  const scoreMap = useMemo(() => {
    const map = {};
    (edgeScores || []).forEach((e) => {
      map[`${e.source}->${e.target}`] = e.score;
    });
    return map;
  }, [edgeScores]);

  const formattedData = useMemo(() => {
    return {
      nodes: graphData.nodes.map((n) => ({
        id: n.id,
        ...n,
        color: getNodeColor(n.id, roleAnalysis),
      })),
      links: graphData.edges.map((e) => ({
        source: e.source,
        target: e.target,
        relation: e.relation,
        amount: e.amount,
        score: scoreMap[`${e.source}->${e.target}`],
      })),
    };
  }, [graphData, roleAnalysis, scoreMap]);

  return (
    <div className="border rounded p-5 bg-white">
      <ForceGraph2D
        graphData={formattedData}
        width={width}
        height={height}
        nodeLabel={(node) => `${node.id}\nType: ${node.type || "N/A"}`}
        linkDirectionalArrowLength={12}
        linkDirectionalArrowRelPos={1}
        linkWidth={(link) => 3.5 + (link.score || 0.2) * 6}
        linkColor={(link) => getEdgeColor(link.score)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.id.replace(/_/g, " ");
          const fontSize = 11 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 14, 0, 2 * Math.PI, false);
          ctx.fill();
          ctx.fillStyle = "#222";
          ctx.fillText(label, node.x + 16, node.y + 3);
        }}
        linkCanvasObjectMode={() => "after"}
        linkCanvasObject={(link, ctx, globalScale) => {
          // Show destination, amount, and edge type directly on the edge midpoint
          const start = link.source;
          const end = link.target;
          if (typeof start !== "object" || typeof end !== "object") return;

          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;

          const label = `${link.relation || ""} · £${(link.amount || 0).toLocaleString()}`;
          const fontSize = 9 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          const textWidth = ctx.measureText(label).width;
          ctx.fillRect(midX - textWidth / 2 - 2, midY - fontSize / 2 - 1, textWidth + 4, fontSize + 2);
          ctx.fillStyle = "#333";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, midX, midY);
        }}
      />
      <div className="small text-muted mt-2">
        🔴 High risk edge · 🟠 Medium risk · 🔵 Low risk — thickness reflects composite risk score
      </div>
    </div>
  );
}