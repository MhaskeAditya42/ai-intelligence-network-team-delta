import React from "react";

export default function GraphExplanationPanel() {
  return (
    <aside className="scenario-panel graph-explanation-panel">
      <div className="scenario-panel-header">
        <h2>Reading this network</h2>
      </div>
      <div className="scenario-panel-body">
        <ul className="scenario-list mb-3">
          <li>Nodes are accounts or customers in the scenario.</li>
          <li>Solid arrows are direct transfers recorded in the transaction data.</li>
          <li>Dotted arrows are inferred relationships, not direct payments.</li>
          <li>The number on each arrow is its relationship score.</li>
        </ul>
        <h3 className="scenario-subheading">Two-hop relationship strength</h3>
        <p className="scenario-copy mb-0">
          We check whether Account A sent money to B, and B then sent a similar amount to C soon afterwards. If so, A and C are treated as connected even when there is no direct transaction between them. A closer amount match, faster onward payment, and supporting account details increase confidence.
        </p>
      </div>
    </aside>
  );
}
