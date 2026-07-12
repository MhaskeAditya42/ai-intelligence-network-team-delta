import React, { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import GraphView from "../components/GraphView";
import SARPanel from "../components/SARPanel";
import RiskScorePanel from "../components/RiskScorePanel";
import TransactionToGraphExplainer from "../components/TransactionToGraphExplainer";
import GraphExplanationPanel from "../components/GraphExplanationPanel";
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
    <div className="scenario-detail-page py-4">
      <div className="container-fluid px-4">
        <div className="scenario-detail-toolbar">
          <Link to={batchDate ? `/?batch_date=${batchDate}` : "/"} className="btn btn-outline-primary btn-sm scenario-back-link">
            ← Back to {batchDate ? `${batchDate} month` : "all scenarios"}
          </Link>
        </div>

        <header className="scenario-detail-heading">
          <span className="eyebrow">Scenario investigation</span>
          <h1>{data.scenario.name}</h1>
          <p>{data.scenario.description}</p>
        </header>

        <main className="scenario-detail-layout">
          <section className="scenario-top-grid" aria-label="Network and recommendation">
            <div className="scenario-panel scenario-graph-panel">
              <GraphView graphData={data.graph} roleAnalysis={data.role_analysis} edgeScores={scores} width={1000} height={500} />
            </div>
            <SARPanel recommendation={data.recommendation} />
          </section>

          <section className="scenario-support-grid" aria-label="Relationship scoring and methodology">
            <GraphExplanationPanel />
            <RiskScorePanel edgeScores={scores} />
            <TransactionToGraphExplainer graphData={data.graph} />
          </section>
        </main>
      </div>
    </div>
  );
}
