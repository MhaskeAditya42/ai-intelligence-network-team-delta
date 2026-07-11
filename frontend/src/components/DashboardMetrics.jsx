import React, { useMemo } from "react";
import { Card, LineChart, Metric, ProgressBar, SparkAreaChart, Text } from "@tremor/react";

const TREND_DATA = [
  { day: "Mon", value: 3 }, { day: "Tue", value: 5 }, { day: "Wed", value: 4 },
  { day: "Thu", value: 7 }, { day: "Fri", value: 6 }, { day: "Sat", value: 8 },
];

export default function DashboardMetrics({ scenarios }) {
  const metrics = useMemo(() => {
    const entities = scenarios.reduce((total, scenario) => total + (scenario.node_count || 0), 0);
    const edges = scenarios.reduce((total, scenario) => total + (scenario.edge_count || 0), 0);
    const density = entities ? Math.min(100, Math.round((edges / entities) * 100)) : 0;
    return { entities, density, sarCount: Math.max(0, Math.ceil(scenarios.length * 0.28)) };
  }, [scenarios]);

  return (
    <section className="metric-grid" aria-label="Batch metrics">
      <Card className="metric-card">
        <Text>Flagged entities</Text>
        <Metric>{metrics.entities}</Metric>
        <SparkAreaChart data={TREND_DATA} categories={["value"]} index="day" colors={["#0F6E56"]} className="metric-spark metric-spark-teal" />
        <span className="metric-note">Across the selected batch</span>
      </Card>
      <Card className="metric-card">
        <Text>SAR recommendations</Text>
        <Metric>{metrics.sarCount}</Metric>
        <LineChart data={TREND_DATA} categories={["value"]} index="day" colors={["#D85A30"]} showLegend={false} showXAxis={false} showYAxis={false} showGridLines={false} className="metric-line" />
        <span className="metric-note">Items needing escalation</span>
      </Card>
      <Card className="metric-card">
        <Text>Network density</Text>
        <Metric>{metrics.density}%</Metric>
        <ProgressBar value={metrics.density} color="#378ADD" className="metric-progress" />
        <span className="metric-note">Relationships per entity</span>
      </Card>
    </section>
  );
}
