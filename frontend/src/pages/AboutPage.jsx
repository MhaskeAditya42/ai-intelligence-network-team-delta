import React from "react";

const TYPE_WEIGHTS = [
  ["DIRECTOR_OF", "0.9"],
  ["CONSULTING_FEE", "0.8"],
  ["SUPPLY_CHAIN_PAYMENT", "0.6"],
  ["VENDOR_PAYMENT", "0.4"],
  ["GREEN_LOAN_DISBURSEMENT", "0.2"],
  ["Unknown type", "0.3"],
];

function PassThroughExample() {
  return (
    <svg className="about-flow" viewBox="0 0 600 150" role="img" aria-label="A two-hop inferred relationship from Account A through Account B to Account C">
      <defs>
        <marker id="about-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
        </marker>
      </defs>
      <path className="about-flow-direct" d="M134 75 H258" markerEnd="url(#about-arrow)" />
      <path className="about-flow-direct" d="M342 75 H466" markerEnd="url(#about-arrow)" />
      <path className="about-flow-inferred" d="M118 112 C235 145, 365 145, 482 112" />
      <circle className="about-flow-node" cx="100" cy="75" r="34" />
      <circle className="about-flow-node" cx="300" cy="75" r="34" />
      <circle className="about-flow-node" cx="500" cy="75" r="34" />
      <text x="100" y="80" textAnchor="middle">A</text>
      <text x="300" y="80" textAnchor="middle">B</text>
      <text x="500" y="80" textAnchor="middle">C</text>
      <text className="about-flow-label" x="196" y="58" textAnchor="middle">£100</text>
      <text className="about-flow-label" x="404" y="58" textAnchor="middle">£80 · 7 days</text>
      <text className="about-flow-caption" x="300" y="143" textAnchor="middle">Inferred A → C: 80% pass-through across two hops</text>
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="argus-page py-5" id="about">
      <div className="container-fluid px-4 about-page">
        <div className="page-heading">
          <span className="eyebrow">Green Financing · Argus AML</span>
          <h1>About this tool</h1>
          <p>Transparent relationship scoring for transaction-network investigations.</p>
        </div>

        <div className="about-grid">
          <section className="about-panel about-overview">
            <h2>What it detects</h2>
            <ul>
              <li>Direct transfers, circular movement, and unusual routes between accounts.</li>
              <li>Potential pass-through layering, where similar funds move rapidly through an intermediary.</li>
              <li>Shared addresses, watchlist exposure, and possible diversion from eligible green activity.</li>
            </ul>
          </section>

          <section className="about-panel about-flow-panel">
            <h2>Two-hop pass-through example</h2>
            <PassThroughExample />
          </section>
        </div>

        <section className="about-panel about-formula-panel">
          <div className="about-section-heading">
            <div>
              <span className="eyebrow">Direct relationships</span>
              <h2>Direct edge score</h2>
            </div>
            <span className="about-score-note">Capped at 1.00</span>
          </div>
          <code className="about-formula">score = min(1.0, cycle + shared_address + exclusion + pass_through + (type_weight × 0.15))</code>
          <div className="about-direct-grid">
            <ul className="about-signal-list">
              <li><strong>Cycle membership</strong><span>+0.35 when the edge is part of a circular flow.</span></li>
              <li><strong>Shared registered address</strong><span>+0.20 when either endpoint belongs to an address cluster.</span></li>
              <li><strong>Watchlist or exclusion</strong><span>+0.25 when the target is watchlisted or excluded.</span></li>
              <li><strong>Pass-through retention</strong><span>+0.15 when more than 85% of source inbound funds are forwarded.</span></li>
              <li><strong>Relationship type</strong><span>Base type weight multiplied by 0.15.</span></li>
            </ul>
            <div className="table-responsive">
              <table className="table table-sm mb-0 about-weight-table">
                <thead><tr><th>Relationship type</th><th>Base weight</th></tr></thead>
                <tbody>{TYPE_WEIGHTS.map(([type, weight]) => <tr key={type}><td><code>{type}</code></td><td>{weight}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="about-panel about-formula-panel">
          <div className="about-section-heading">
            <div>
              <span className="eyebrow">Derived relationships</span>
              <h2>Inferred edge score</h2>
            </div>
            <span className="about-score-note">Inference confidence</span>
          </div>
          <p className="about-copy">Inferred pass-through relationships use the calculated inference confidence directly; they do not use the direct-edge additive formula.</p>
          <code className="about-formula">confidence = min(1.0, (ratio × 0.45) + timing + hop + mule + identifier_match)</code>
          <ul className="about-signal-list about-inferred-list">
            <li><strong>Pass-through ratio</strong><span>min(ratio, 1.0) × 0.45</span></li>
            <li><strong>Timing</strong><span>max(0, 1 − days / time_window) × 0.20</span></li>
            <li><strong>Hop component</strong><span>max(0, 1 − (hops − 1) × 0.15) × 0.05</span></li>
            <li><strong>Mule indicator</strong><span>Up to +0.15 for intermediary account characteristics.</span></li>
            <li><strong>Matched identifiers</strong><span>+0.15 when the source and destination share a verified identifier.</span></li>
          </ul>
          <p className="about-copy mb-0">The scorecard also explains the path, hop count, pass-through ratio, timing, and any matched identifiers so investigators can review the underlying evidence.</p>
        </section>

        <section className="about-panel about-feedback-panel">
          <h2>From score to investigator feedback</h2>
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead className="table-light"><tr><th>Score range</th><th>Risk level</th><th>Suggested action</th></tr></thead>
              <tbody>
                <tr><td>0.00–0.29</td><td>Low</td><td>No action; retain the record.</td></tr>
                <tr><td>0.30–0.59</td><td>Moderate</td><td>Monitor for corroborating activity.</td></tr>
                <tr><td>0.60–0.74</td><td>Elevated</td><td>Due diligence required.</td></tr>
                <tr><td>0.75–1.00</td><td>High</td><td>Escalate for investigation and reporting assessment.</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
