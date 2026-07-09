/**
 * Analyzes a graph structure to detect suspicious patterns and generate SAR recommendations
 * @param {Object} graph - Graph object with nodes and edges
 * @returns {Object} - Analysis results with recommendation, risk_indicators, role_analysis, edge_scores
 */

export function analyzeGraph(graph) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  if (nodes.length === 0 || edges.length === 0) {
    return {
      recommendation: {
        classification: "NO_ACTION_REQUIRED",
        rationale: "Insufficient graph data for analysis",
        risk_indicators: {},
      },
      role_analysis: { gatekeepers: [], mules: [], ultimate_beneficiaries: [] },
      edge_scores: [],
    };
  }

  // Initialize analysis
  const analysis = {
    cycles: [],
    gatekeepers: [],
    mules: [],
    anomalies: [],
    highRiskEdges: [],
  };

  // Build adjacency list for cycle detection
  const adjacencyList = {};
  nodes.forEach((node) => {
    adjacencyList[node.id] = [];
  });

  edges.forEach((edge) => {
    adjacencyList[edge.source]?.push(edge.target);
  });

  // Detect cycles using DFS
  const visited = new Set();
  const recursionStack = new Set();
  const cyclesFound = [];

  const dfs = (node, path = []) => {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    for (const neighbor of adjacencyList[node] || []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        // Cycle detected
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);
        cycle.push(neighbor);
        cyclesFound.push(cycle);
      }
    }

    recursionStack.delete(node);
  };

  // Run cycle detection for all nodes
  Object.keys(adjacencyList).forEach((nodeId) => {
    if (!visited.has(nodeId)) {
      dfs(nodeId);
    }
  });

  analysis.cycles = cyclesFound;

  // Analyze node degrees to identify suspicious entities
  const inDegree = {};
  const outDegree = {};

  nodes.forEach((node) => {
    inDegree[node.id] = 0;
    outDegree[node.id] = 0;
  });

  edges.forEach((edge) => {
    outDegree[edge.source] = (outDegree[edge.source] || 0) + 1;
    inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
  });

  // Identify gatekeepers (high connectivity, intermediary behavior)
  const avgDegree = edges.length / nodes.length;
  nodes.forEach((node) => {
    const totalDegree = (inDegree[node.id] || 0) + (outDegree[node.id] || 0);
    if (totalDegree > avgDegree * 1.5) {
      analysis.gatekeepers.push({
        entity: node.id,
        linked_entities: [
          ...Object.keys(inDegree).filter(
            (n) => edges.some((e) => e.target === node.id && e.source === n)
          ),
          ...Object.keys(outDegree).filter(
            (n) => edges.some((e) => e.source === node.id && e.target === n)
          ),
        ],
      });
    }
  });

  // Identify mules (high through-flow, minimal storage)
  nodes.forEach((node) => {
    const incoming = edges.filter((e) => e.target === node.id).length;
    const outgoing = edges.filter((e) => e.source === node.id).length;

    if (incoming > 0 && outgoing > 0 && incoming + outgoing > avgDegree) {
      // Check if amounts flow through relatively unchanged
      const inAmount = edges
        .filter((e) => e.target === node.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const outAmount = edges
        .filter((e) => e.source === node.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      if (Math.abs(inAmount - outAmount) / Math.max(inAmount, outAmount) < 0.2) {
        analysis.mules.push({ entity: node.id });
      }
    }
  });

  // Calculate risk scores for each edge
  const edgeScores = edges.map((edge) => {
    let score = 0;
    const reasons = [];

    // Risk from cycle involvement
    const edgeInCycle = analysis.cycles.some((cycle) => {
      const cycleStr = cycle.join("->");
      return cycleStr.includes(`${edge.source}->${edge.target}`);
    });

    if (edgeInCycle) {
      score += 0.3;
      reasons.push("Part of circular transaction pattern");
    }

    // Risk from gatekeeper involvement
    const sourceIsGatekeeper = analysis.gatekeepers.some((g) => g.entity === edge.source);
    const targetIsGatekeeper = analysis.gatekeepers.some((g) => g.entity === edge.target);

    if (sourceIsGatekeeper || targetIsGatekeeper) {
      score += 0.25;
      reasons.push("Involves gatekeeper entity");
    }

    // Risk from mule involvement
    const sourceIsMule = analysis.mules.some((m) => m.entity === edge.source);
    const targetIsMule = analysis.mules.some((m) => m.entity === edge.target);

    if (sourceIsMule || targetIsMule) {
      score += 0.2;
      reasons.push("Involves mule entity");
    }

    // Amount-based risk (very large or very small amounts)
    const allAmounts = edges.map((e) => e.amount || 0).filter((a) => a > 0);
    if (allAmounts.length > 0) {
      const avgAmount = allAmounts.reduce((a, b) => a + b) / allAmounts.length;
      const maxAmount = Math.max(...allAmounts);

      if (edge.amount > maxAmount * 0.8) {
        score += 0.15;
        reasons.push("Unusually large transaction amount");
      }
    }

    // Cap score at 1.0
    score = Math.min(score, 1.0);

    if (score > 0.6) {
      analysis.highRiskEdges.push(edge);
    }

    return {
      source: edge.source,
      target: edge.target,
      score: parseFloat(score.toFixed(2)),
      relation: edge.relation || edge.edge_type || "Unknown",
      amount: edge.amount || 0,
      reasons,
    };
  });

  // Determine overall classification
  let classification = "NO_ACTION_REQUIRED";
  let rationale = "Transaction pattern shows normal financial activity.";
  const riskIndicators = {};

  // Check for high-risk conditions
  if (analysis.cycles.length > 0) {
    riskIndicators.cycle_detected = `${analysis.cycles.length} circular transaction pattern(s) detected`;
  }

  if (analysis.gatekeepers.length > 0) {
    riskIndicators.gatekeeper_risk = `${analysis.gatekeepers.length} gatekeeper entit${analysis.gatekeepers.length > 1 ? "ies" : "y"} identified`;
  }

  if (analysis.mules.length > 0) {
    riskIndicators.mule_entities = `${analysis.mules.length} mule entit${analysis.mules.length > 1 ? "ies" : "y"} detected`;
  }

  const highRiskCount = edgeScores.filter((e) => e.score > 0.6).length;
  const mediumRiskCount = edgeScores.filter((e) => e.score > 0.3 && e.score <= 0.6).length;

  if (highRiskCount > 0) {
    riskIndicators.high_risk_edges = `${highRiskCount} high-risk edge(s) (score > 0.6)`;
  }

  if (mediumRiskCount > 0) {
    riskIndicators.medium_risk_edges = `${mediumRiskCount} medium-risk edge(s)`;
  }

  // Determine SAR classification based on risk factors
  const totalRiskFactors =
    (analysis.cycles.length > 0 ? 1 : 0) +
    (analysis.gatekeepers.length > 0 ? 1 : 0) +
    (analysis.mules.length > 0 ? 1 : 0) +
    (highRiskCount > 0 ? 1 : 0);

  if (
    analysis.cycles.length > 1 ||
    highRiskCount > 2 ||
    (analysis.gatekeepers.length > 1 && analysis.cycles.length > 0)
  ) {
    classification = "SAR_FILING_REQUIRED";
    rationale = `Multiple suspicious patterns detected: ${
      analysis.cycles.length > 0 ? "circular flows, " : ""
    }${analysis.gatekeepers.length > 0 ? "gatekeeper entities, " : ""}${
      analysis.mules.length > 0 ? "mule entities, " : ""
    }and high-risk relationships. SAR filing is recommended.`;
  } else if (totalRiskFactors >= 2 || (mediumRiskCount > 0 && analysis.gatekeepers.length > 0)) {
    classification = "ENHANCED_DUE_DILIGENCE";
    rationale = `Moderate risk indicators detected. Additional investigation recommended to verify legitimacy of transaction patterns and entity relationships.`;
  } else if (highRiskCount > 0) {
    classification = "ENHANCED_DUE_DILIGENCE";
    rationale = `Some high-risk relationships detected. Enhanced due diligence required before approval.`;
  } else if (mediumRiskCount > 0) {
    classification = "NO_ACTION_REQUIRED";
    rationale = `Low to moderate risk detected. Transaction patterns appear consistent with normal business operations.`;
  }

  return {
    recommendation: {
      classification,
      rationale,
      risk_indicators: riskIndicators,
    },
    role_analysis: {
      gatekeepers: analysis.gatekeepers,
      mules: analysis.mules,
      ultimate_beneficiaries: [], // Could be enhanced with additional logic
    },
    edge_scores: edgeScores,
  };
}
