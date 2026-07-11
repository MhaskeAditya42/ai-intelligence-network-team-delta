import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

const NODE_STYLES = {
  person: { fill: "#5DCAA5", label: "#04342C", stroke: "#0F6E56" },
  entity: { fill: "#85B7EB", label: "#042C53", stroke: "#378ADD" },
  flagged: { fill: "#F0997B", label: "#4A1B0C", stroke: "#D85A30" },
};

function isFlagged(nodeId, roleAnalysis) {
  return roleAnalysis?.ultimate_beneficiaries?.some((item) => item.entity === nodeId)
    || roleAnalysis?.gatekeepers?.some((item) => item.linked_entities?.includes(nodeId))
    || roleAnalysis?.mules?.some((item) => item.entity === nodeId);
}

function nodeCategory(node, roleAnalysis) {
  if (isFlagged(node.id, roleAnalysis) || node.watchlist_hit) return "flagged";
  return ["Individual", "Person", "Natural_Person"].includes(node.type) ? "person" : "entity";
}

export default function GraphView({ graphData = { nodes: [], edges: [] }, roleAnalysis, edgeScores, height = 500 }) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [containerWidth, setContainerWidth] = useState(320);

  const graphPayload = useMemo(() => {
    const scoreMap = new Map((edgeScores || []).map((edge) => [
      `${edge.source}->${edge.target}:${edge.edge_type || "direct"}`,
      edge.score,
    ]));
    const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
    const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];

    return {
      nodes: nodes.map((node) => ({
        ...node,
        id: node.id,
        data: { ...node, category: nodeCategory(node, roleAnalysis) },
      })),
      links: edges.map((edge, index) => ({
        id: `${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        data: {
          ...edge,
          score: scoreMap.get(`${edge.source}->${edge.target}:${edge.edge_type || "direct"}`) || 0,
        },
      })),
    };
  }, [graphData, roleAnalysis, edgeScores]);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const container = containerRef.current;

    const updateSize = () => {
      setContainerWidth(Math.max(container.clientWidth, 320));
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current.d3Force("charge")?.strength(-220);
    graphRef.current.d3Force("link")?.distance?.(140);
    graphRef.current.zoomToFit(400, 80);
  }, [graphPayload]);

  const drawNode = (node, ctx, globalScale) => {
    const style = NODE_STYLES[node.data?.category || nodeCategory(node, roleAnalysis)] || NODE_STYLES.entity;
    const radius = 8;

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = style.fill;
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = style.label;
    ctx.font = `${11 / globalScale}px Sans-Serif`;
    ctx.fillText(node.id.replace(/[_-]/g, " "), node.x, node.y + 20 / globalScale);
  };

  return (
    <div className="argus-graph-shell">
      <div ref={containerRef} className="argus-graph-canvas" style={{ height }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphPayload}
          width={containerWidth}
          height={height}
          nodeCanvasObject={drawNode}
          nodeLabel={(node) => node.data?.name || node.id}
          linkColor={(link) => {
            if (link.data?.edge_type === "inferred") return link.data.confidence_score >= 0.75 ? "#D85A30" : "#F59E0B";
            return link.data?.score > 0.6 ? "#D85A30" : "#9CA6AF";
          }}
          linkWidth={(link) => (link.data?.edge_type === "inferred" ? 2.2 : (link.data?.score > 0.6 ? 2.4 : 1.2))}
          linkLineDash={(link) => (link.data?.edge_type === "inferred" ? [5, 4] : null)}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={0.85}
          onNodeClick={(node) => setSelectedNode(node.data || node)}
          onEngineStop={() => graphRef.current?.zoomToFit(400, 80)}
          cooldownTicks={100}
        />
      </div>
      <div className="graph-legend">
        <span><i className="legend-person" />Person</span>
        <span><i className="legend-entity" />Organization</span>
        <span><i className="legend-flagged" />Flagged</span>
        <span><b />Flagged transaction path</span>
        <span><b className="legend-inferred" />Inferred pass-through path</span>
      </div>
      {selectedNode && (
        <aside className="node-detail" aria-live="polite">
          <div>
            <span className="eyebrow">Selected entity</span>
            <strong>{selectedNode.name || selectedNode.id}</strong>
            <small>{selectedNode.type || "Entity"} · {selectedNode.id}</small>
          </div>
          <button type="button" onClick={() => setSelectedNode(null)} aria-label="Close selected entity">×</button>
        </aside>
      )}
    </div>
  );
}
