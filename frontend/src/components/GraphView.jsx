import React, { useMemo, useRef, useState, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
const ROLE_COLORS = {
    gatekeeper: "#e63946",      // red
    mule: "#f4a261",            // orange
    ultimate_beneficiary: "#9d4edd", // purple
    default: "#457b9d",         // blue
};
function getNodeColor(nodeId, roleAnalysis) {
    const gatekeepers = roleAnalysis?.gatekeepers || [];
    const ultimateBeneficiaries = roleAnalysis?.ultimate_beneficiaries || [];
    const mules = roleAnalysis?.mules || [];

    const isGatekeeperEntity = gatekeepers.some((g) =>
        g.linked_entities?.includes(nodeId)
    );
    const isUBO = ultimateBeneficiaries.some((u) => u.entity === nodeId);
    const isMule = mules.some((m) => m.entity === nodeId);

    if (isUBO) return ROLE_COLORS.ultimate_beneficiary;
    if (isGatekeeperEntity) return ROLE_COLORS.gatekeeper;
    if (isMule) return ROLE_COLORS.mule;
    return ROLE_COLORS.default;
}
export default function GraphView({ graphData, roleAnalysis }) {
    const containerRef = useRef(null);
    const [size, setSize] = useState({ width: 700, height: 500 });

    useEffect(() => {
        function update() {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            setSize({ width: Math.max(600, Math.floor(rect.width)), height: Math.max(400, Math.floor(rect.height)) });
        }
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const formattedData = useMemo(() => {
        const nodes = graphData?.nodes || [];
        const edges = graphData?.edges || [];

        return {
            nodes: nodes.map((n) => ({
                id: n.id,
                ...n,
                color: getNodeColor(n.id, roleAnalysis),
            })),
            links: edges.map((e) => ({
                source: e.source,
                target: e.target,
                relation: e.relation,
                amount: e.amount,
            })),
        };
    }, [graphData, roleAnalysis]);

    return (
        <div ref={containerRef} style={{ width: "100%", height: "650px", border: "1px solid #ddd", borderRadius: 8 }}>
            <ForceGraph2D
                graphData={formattedData}
                nodeLabel={(node) => `${node.id}\nType: ${node.type || "N/A"}`}
                linkLabel={(link) => `${link.relation}\n£${link.amount?.toLocaleString() || 0}`}
                nodeAutoColorBy={undefined}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                linkColor={() => "#999"}
                width={size.width}
                height={size.height}
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.id.replace(/_/g, " ");
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.fillStyle = node.color;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.fillStyle = "#333";
                    ctx.fillText(label, node.x + 8, node.y + 3);
                }}
            // ...other props unchanged...
            />
        </div>
    );
}