import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import GraphView from "../components/GraphView";
import SARPanel from "../components/SARPanel";
import RiskScorePanel from "../components/RiskScorePanel";
import TransactionToGraphExplainer from "../components/TransactionToGraphExplainer";
import { fetchScenarios, fetchSarReport, fetchGraph, fetchRelationshipScores } from "../api/client";
import { analyzeGraph } from "../utils/graphAnalysis";

export default function ScenarioDetailPage() {
  const { scenarioId } = useParams();
  const [data, setData] = useState(null);
  const [scores, setScores] = useState(null);
  const [error, setError] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Check if this is an uploaded scenario (starts with "uploaded_")
        if (scenarioId && scenarioId.startsWith("uploaded_")) {
          const saved = localStorage.getItem("uploadedScenarios");
          if (saved) {
            const uploadedScenarios = JSON.parse(saved);
            const uploadedScenario = uploadedScenarios.find((s) => s.id === scenarioId);

            if (uploadedScenario && uploadedScenario._uploadedData) {
              // Use uploaded data - don't call API
              const uploadedData = uploadedScenario._uploadedData;

              // Analyze the graph to generate recommendation
              const analysis = analyzeGraph(uploadedData.graph);

              // Debug logging
              console.log("✅ Analyzing uploaded scenario");
              console.log("Scenario:", uploadedData.scenario);
              console.log("Graph analysis:", analysis);
              console.log("Classification:", analysis.recommendation.classification);

              setData({
                recommendation: analysis.recommendation,
                graph: uploadedData.graph,
                scenario: {
                  id: uploadedScenario.id,
                  name: uploadedScenario.name,
                  description: uploadedScenario.description,
                  trigger_entity: uploadedScenario.trigger_entity,
                },
                role_analysis: analysis.role_analysis,
              });
              setScores(analysis.edge_scores);
              setIsUploaded(true);
              return; // Exit early - don't call API
            }
          }
          // If uploaded scenario not found in localStorage
          throw new Error("Uploaded scenario not found. Please re-upload the file.");
        }

        // Otherwise, fetch from API for regular scenarios
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
        setIsUploaded(false);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [scenarioId]);

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

  if (!data) {
    return (
      <div className="container py-5">
        <div className="alert alert-info d-flex align-items-center" role="alert">
          <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
          Loading analysis...
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="container-fluid px-4">
        <Link to="/" className="btn btn-outline-primary btn-sm mb-3">
          ← Back to all scenarios
        </Link>

        <div className="d-flex align-items-center gap-2 mb-2">
          <h1 className="display-5 fw-bold mb-0">{data.scenario.name}</h1>
          {isUploaded && (
            <span className="badge bg-success">📤 Uploaded</span>
          )}
        </div>
        <p className="text-muted lead mb-4">{data.scenario.description}</p>

        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-body p-2">
                <GraphView graphData={data.graph} roleAnalysis={data.role_analysis} edgeScores={scores} width={1000} height={850} />
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <SARPanel recommendation={data.recommendation} />
          </div>

          <div className="col-12">
            <RiskScorePanel edgeScores={scores} />
          </div>

          <div className="col-12">
            <TransactionToGraphExplainer graphData={data.graph} />
          </div>
        </div>
      </div>
    </div>
  );
}