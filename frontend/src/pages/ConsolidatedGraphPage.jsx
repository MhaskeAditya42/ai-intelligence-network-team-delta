import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import { fetchGraph } from "../api/client";

// Color by scenario
const SCENARIO_COLORS = {
  "UBO_Concealment_Shell_Network": "#e63946",
  "Complex_SAR_Layered_Green_Bond_Proceeds": "#f4a261",
  "Gatekeeper_Facilitated_Fraud": "#2a9d8f",
  "Greenwashing_Certification_Fraud": "#e76f51",
  "Carbon_Credit_Double_Counting": "#264653",
  "Green_Subsidy_Diversion": "#e9c46a",
  "Circular_Trading_Round_Tripping": "#f4a261",
  "Trade_Based_Money_Laundering_Green_Goods": "#e63946",
  "Structuring_Smurfing_MSME_Network": "#457b9d",
  "Related_Party_MSME_Round_Robin": "#a8dadc",
};

function getScenarioColor(scenario) {
  return SCENARIO_COLORS[scenario] || "#999";
}

export default function ConsolidatedGraphPage() {
  const [graphData, setGraphData] = useState(null);
  const [nodeToScenarios, setNodeToScenarios] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadConsolidatedGraph() {
      try {
        const response = await fetchGraph("Consolidated_All_Transactions", "IND_001");
        const graph = response.graph;
        
        // Build a mapping: node -> list of scenarios it appears in
        const nodeScenarioMap = {};
        graph.edges.forEach(edge => {
          const scenario = edge.scenario || edge.relation;
          if (scenario) {
            // Map source node to scenario
            if (!nodeScenarioMap[edge.source]) {
              nodeScenarioMap[edge.source] = new Set();
            }
            nodeScenarioMap[edge.source].add(scenario);
            
            // Map target node to scenario
            if (!nodeScenarioMap[edge.target]) {
              nodeScenarioMap[edge.target] = new Set();
            }
            nodeScenarioMap[edge.target].add(scenario);
          }
        });
        
        // Convert Sets to Arrays
        Object.keys(nodeScenarioMap).forEach(key => {
          nodeScenarioMap[key] = Array.from(nodeScenarioMap[key]);
        });
        
        setGraphData(graph);
        setNodeToScenarios(nodeScenarioMap);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadConsolidatedGraph();
  }, []);

  const handleNodeClick = (node) => {
    const scenarios = nodeToScenarios[node.id];
    if (scenarios && scenarios.length > 0) {
      // Navigate to the first scenario this node belongs to
      navigate(`/scenario/${scenarios[0]}`);
    }
  };

  const handleLinkClick = (link) => {
    // Navigate to the scenario this edge belongs to
    if (link.scenario) {
      navigate(`/scenario/${link.scenario}`);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="alert alert-info d-flex align-items-center" role="alert">
          <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
          Loading consolidated network graph...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!graphData) return null;

  // Format data for visualization
  const formattedData = {
    nodes: graphData.nodes.map((n) => ({
      id: n.id,
      ...n,
      scenarios: nodeToScenarios[n.id] || [],
    })),
    links: graphData.edges.map((e) => ({
      source: e.source,
      target: e.target,
      relation: e.relation || e.relationship,
      amount: e.amount,
      scenario: e.scenario,
      color: getScenarioColor(e.scenario),
    })),
  };

  return (
    <div className="py-4">
      <div className="container-fluid px-4">
        <Link to="/" className="btn btn-outline-primary btn-sm mb-3">
          ← Back to scenarios
        </Link>

        <h1 className="display-5 fw-bold mb-2">Consolidated Network Graph</h1>
        <p className="text-muted lead mb-4">
          All scenarios merged into a single network. Click on any node or edge to navigate to its scenario.
        </p>

        <div className="row">
          <div className="col-lg-9">
            <div className="card shadow-sm border-0">
              <div className="card-body p-2">
                <ForceGraph2D
                  graphData={formattedData}
                  width={1200}
                  height={700}
                  nodeLabel={(node) => 
                    `${node.id}\nType: ${node.type || "N/A"}\nScenarios: ${(node.scenarios || []).join(", ")}`
                  }
                  linkLabel={(link) => 
                    `${link.relation || ""}\nAmount: £${(link.amount || 0).toLocaleString()}\nScenario: ${link.scenario || "N/A"}`
                  }
                  linkDirectionalArrowLength={8}
                  linkDirectionalArrowRelPos={1}
                  linkWidth={2}
                  linkColor={(link) => link.color}
                  nodeColor={() => "#457b9d"}
                  onNodeClick={handleNodeClick}
                  onLinkClick={handleLinkClick}
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.id.replace(/_/g, " ");
                    const fontSize = 10 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.fillStyle = "#457b9d";
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.fillStyle = "#222";
                    ctx.fillText(label, node.x + 14, node.y + 3);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="col-lg-3">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title mb-3">Scenarios Included</h5>
                <div className="small">
                  {Object.keys(SCENARIO_COLORS).map((scenario) => (
                    <div key={scenario} className="mb-2 d-flex align-items-center">
                      <div 
                        style={{ 
                          width: "12px", 
                          height: "12px", 
                          backgroundColor: SCENARIO_COLORS[scenario],
                          marginRight: "8px",
                          borderRadius: "2px"
                        }}
                      ></div>
                      <span className="text-truncate" title={scenario}>
                        {scenario.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
                <hr />
                <div className="alert alert-light p-2 small mb-0">
                  <strong>💡 Tip:</strong> Click on nodes or edges to explore the specific scenario details.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
