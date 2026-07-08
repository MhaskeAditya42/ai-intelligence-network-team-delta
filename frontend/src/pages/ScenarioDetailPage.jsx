import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import GraphView from "../components/GraphView";
import SARPanel from "../components/SARPanel";
import RiskScorePanel from "../components/RiskScorePanel";
import TransactionToGraphExplainer from "../components/TransactionToGraphExplainer";
import { fetchScenarios, fetchSarReport, fetchGraph, fetchRelationshipScores } from "../api/client";

export default function ScenarioDetailPage() {
  const { scenarioId } = useParams();
  const [data, setData] = useState(null);
  const [scores, setScores] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const scenarios = await fetchScenarios();
        const scenario = scenarios.find((s) => s.id === scenarioId);
        if (!scenario) throw new Error("Scenario not found");

        const [sarData, graphData, scoreData] = await Promise.all([
          fetchSarReport(scenarioId, scenario.trigger_entity),
          fetchGraph(scenarioId, scenario.trigger_entity),
          fetchRelationshipScores(scenarioId),
        ]);

        setData({ ...sarData, graph: graphData.graph, scenario });
        setScores(scoreData.edge_scores);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [scenarioId]);

  if (error) return <div style={{ padding: "24px", color: "red" }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: "24px" }}>Loading analysis...</div>;

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <Link to="/" style={{ fontSize: "14px", color: "#457b9d" }}>
        ← Back to all scenarios
      </Link>

      <h1 style={{ marginTop: "12px" }}>{data.scenario.name}</h1>
      <p style={{ color: "#666" }}>{data.scenario.description}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "20px" }}>
        <div style={{ width: "100%", minHeight: "700px" }}>
          <GraphView graphData={data.graph} roleAnalysis={data.role_analysis} edgeScores={scores} width={920} height={700} />
        </div>

        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "stretch" }}>
          <div style={{ flex: 1, minWidth: "320px" }}>
            <SARPanel recommendation={data.recommendation} />
          </div>
          <div style={{ flex: 1, minWidth: "320px" }}>
            <RiskScorePanel edgeScores={scores} />
          </div>
        </div>

        <div style={{ marginTop: "0" }}>
          <TransactionToGraphExplainer graphData={data.graph} />
        </div>
      </div>
    </div>
  );
}