import React, { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import GraphView from "../components/GraphView";
import SARPanel from "../components/SARPanel";
import RiskScorePanel from "../components/RiskScorePanel";
import TransactionToGraphExplainer from "../components/TransactionToGraphExplainer";
import { fetchScenarios, fetchSarReport, fetchGraph, fetchRelationshipScores } from "../api/client";

export default function ScenarioDetailPage() {
  const { scenarioId } = useParams();
  const [searchParams] = useSearchParams();
  const batchDate = searchParams.get("batch_date") || undefined;
  const [data, setData] = useState(null);
  const [scores, setScores] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const scenarios = await fetchScenarios(batchDate);
        const scenario = scenarios.find((s) => s.id === scenarioId);
        if (!scenario) throw new Error("Scenario not found");

        const [sarData, graphData, scoreData] = await Promise.all([
          fetchSarReport(scenarioId, scenario.trigger_entity, batchDate),
          fetchGraph(scenarioId, scenario.trigger_entity, batchDate),
          fetchRelationshipScores(scenarioId, batchDate),
        ]);

        setData({ ...sarData, graph: graphData.graph, scenario });
        setScores(scoreData.edge_scores);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [scenarioId, batchDate]);

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
        <Link to={batchDate ? `/?batch_date=${batchDate}` : "/"} className="btn btn-outline-primary btn-sm mb-3">
          ← Back to {batchDate ? `${batchDate} batch` : "all scenarios"}
        </Link>

        <h1 className="display-5 fw-bold mb-2">{data.scenario.name}</h1>
        <p className="text-muted lead mb-4">{data.scenario.description}</p>

        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-body p-2">
                <GraphView graphData={data.graph} roleAnalysis={data.role_analysis} edgeScores={scores} width={1000} height={500} />
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
