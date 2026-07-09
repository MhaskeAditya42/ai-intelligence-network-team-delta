import React from "react";

export default function TransactionToGraphExplainer({ graphData }) {
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-light border-bottom">
        <h5 className="card-title mb-0">How This Graph Is Built From Transactional Data</h5>
      </div>
      <div className="card-body">
        <p className="text-muted mb-4">
          In production, this graph is constructed by traversing a bank's core transaction ledger —
          each row below becomes a directed edge; each unique account/customer becomes a node.
        </p>

        <div className="row g-4 align-items-start">
          <div className="col-lg-5">
            <h6 className="mb-3 fw-bold">Raw Transaction Table</h6>
            <div className="table-responsive">
              <table className="table table-sm table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Source</th>
                    <th>Destination</th>
                    <th>Amount</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {graphData.edges.map((e, i) => (
                    <tr key={i}>
                      <td className="small">{e.source}</td>
                      <td className="small">{e.target}</td>
                      <td className="small">£{e.amount?.toLocaleString()}</td>
                      <td className="small">{e.edge_type || e.relation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-lg-2 d-flex align-items-center justify-content-center">
            <div className="fs-1 text-muted-subtle">→</div>
          </div>

          <div className="col-lg-5">
            <h6 className="mb-3 fw-bold">Resulting Graph Structure</h6>
            <p className="text-muted small mb-0">
              <strong className="text-dark">{graphData.nodes.length} nodes</strong> (accounts/entities), <strong className="text-dark">{graphData.edges.length} directed edges</strong> (transactions).
              Each source→destination row above becomes exactly one directed edge, weighted by amount and
              labeled by transaction type — enabling cycle detection, shortest-path exclusion checks, and
              address-density clustering that a flat table cannot express.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}