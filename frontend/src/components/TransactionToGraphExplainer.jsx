import React from "react";

export default function TransactionToGraphExplainer({ graphData }) {
  return (
    <section className="scenario-panel relationship-method-panel">
      <div className="scenario-panel-header">
        <h2>How relationships are constructed</h2>
      </div>
      <div className="scenario-panel-body">
        <p className="scenario-copy mb-3">
          The network starts with transaction-ledger records: each account becomes a node and each payment becomes a directed, direct edge.
        </p>
        <ul className="scenario-list mb-0">
          <li><strong>Direct edges</strong> retain the payment amount and transaction type.</li>
          <li><strong>Inferred edges</strong> are added only when funds move through an intermediary at a similar amount within the configured time window.</li>
          <li>Scores combine relationship type, circular flows, shared identifiers or addresses, watchlist exposure, and pass-through behaviour.</li>
          <li>This view currently contains <strong>{graphData.nodes.length} accounts</strong> and <strong>{graphData.edges.length} relationships</strong>.</li>
        </ul>
      </div>
    </section>
  );
}
