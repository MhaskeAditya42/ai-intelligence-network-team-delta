import React from "react";

export default function TransactionToGraphExplainer({ graphData }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "20px", background: "#fafafa" }}>
      <h3 style={{ marginTop: 0 }}>How This Graph Is Built From Transactional Data</h3>
      <p style={{ fontSize: "13px", color: "#666" }}>
        In production, this graph is constructed by traversing a bank's core transaction ledger —
        each row below becomes a directed edge; each unique account/customer becomes a node.
      </p>

      <div style={{ display: "flex", gap: "24px", marginTop: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: "1", minWidth: "320px" }}>
          <h4 style={{ fontSize: "13px" }}>Raw Transaction Table</h4>
          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#eee", textAlign: "left" }}>
                <th style={{ padding: "6px" }}>Source</th>
                <th style={{ padding: "6px" }}>Destination</th>
                <th style={{ padding: "6px" }}>Amount</th>
                <th style={{ padding: "6px" }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {graphData.edges.map((e, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "6px" }}>{e.source}</td>
                  <td style={{ padding: "6px" }}>{e.target}</td>
                  <td style={{ padding: "6px" }}>£{e.amount?.toLocaleString()}</td>
                  <td style={{ padding: "6px" }}>{e.edge_type || e.relation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", fontSize: "24px", color: "#999" }}>
          →
        </div>

        <div style={{ flex: "1", minWidth: "280px" }}>
          <h4 style={{ fontSize: "13px" }}>Resulting Graph Structure</h4>
          <p style={{ fontSize: "12px", color: "#666" }}>
            {graphData.nodes.length} nodes (accounts/entities), {graphData.edges.length} directed edges (transactions).
            Each source→destination row above becomes exactly one directed edge, weighted by amount and
            labeled by transaction type — enabling cycle detection, shortest-path exclusion checks, and
            address-density clustering that a flat table cannot express.
          </p>
        </div>
      </div>
    </div>
  );
}