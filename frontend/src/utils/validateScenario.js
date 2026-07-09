/**
 * Validates the structure of an uploaded scenario JSON file
 * @param {Object} jsonData - The parsed JSON data
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateScenarioJSON(jsonData) {
  const errors = [];

  // Check top-level structure
  if (!jsonData || typeof jsonData !== "object") {
    errors.push("File must contain a valid JSON object");
    return { isValid: false, errors };
  }

  // Check for required fields
  if (!jsonData.scenario) {
    errors.push("Missing 'scenario' field");
  }
  if (!jsonData.graph) {
    errors.push("Missing 'graph' field");
  }

  // Validate scenario object
  if (jsonData.scenario) {
    if (!jsonData.scenario.id) {
      errors.push("scenario.id is required");
    }
    if (!jsonData.scenario.name) {
      errors.push("scenario.name is required");
    }
    if (!jsonData.scenario.trigger_entity) {
      errors.push("scenario.trigger_entity is required");
    }
  }

  // Validate graph object
  if (jsonData.graph) {
    if (!Array.isArray(jsonData.graph.nodes)) {
      errors.push("graph.nodes must be an array");
    } else if (jsonData.graph.nodes.length === 0) {
      errors.push("graph.nodes array cannot be empty");
    } else {
      // Validate node structure
      jsonData.graph.nodes.forEach((node, idx) => {
        if (!node.id) {
          errors.push(`graph.nodes[${idx}] missing 'id' field`);
        }
      });
    }

    if (!Array.isArray(jsonData.graph.edges)) {
      errors.push("graph.edges must be an array");
    } else {
      // Validate edge structure
      jsonData.graph.edges.forEach((edge, idx) => {
        if (!edge.source) {
          errors.push(`graph.edges[${idx}] missing 'source' field`);
        }
        if (!edge.target) {
          errors.push(`graph.edges[${idx}] missing 'target' field`);
        }
      });
    }
  }

  // Optional validation for recommendation and scores
  if (jsonData.recommendation) {
    if (!jsonData.recommendation.classification) {
      errors.push("recommendation.classification is recommended");
    }
  }

  if (jsonData.edge_scores && !Array.isArray(jsonData.edge_scores)) {
    errors.push("edge_scores must be an array if provided");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Expected JSON file structure for upload:
 * {
 *   "scenario": {
 *     "id": "scenario_001",
 *     "name": "Scenario Name",
 *     "description": "Description",
 *     "trigger_entity": "entity_id"
 *   },
 *   "graph": {
 *     "nodes": [
 *       { "id": "entity_1", "type": "Company" },
 *       { "id": "entity_2", "type": "Account" }
 *     ],
 *     "edges": [
 *       {
 *         "source": "entity_1",
 *         "target": "entity_2",
 *         "amount": 50000,
 *         "relation": "Transfer",
 *         "edge_type": "payment"
 *       }
 *     ]
 *   },
 *   "recommendation": {
 *     "classification": "SAR_FILING_REQUIRED",
 *     "rationale": "Multiple red flags detected",
 *     "risk_indicators": {
 *       "gatekeeper_risk": "Gatekeeper detected",
 *       "cycle_detected": "Yes"
 *     }
 *   },
 *   "role_analysis": {
 *     "gatekeepers": [],
 *     "mules": [],
 *     "ultimate_beneficiaries": []
 *   },
 *   "edge_scores": [
 *     {
 *       "source": "entity_1",
 *       "target": "entity_2",
 *       "score": 0.75,
 *       "relation": "Transfer",
 *       "amount": 50000,
 *       "reasons": ["Reason 1"]
 *     }
 *   ]
 * }
 */
