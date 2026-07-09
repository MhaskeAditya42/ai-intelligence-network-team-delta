import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-4 mt-5 border-top">
      <div className="container-fluid px-4">
        <div className="row">
          <div className="col-md-6">
            <h6 className="fw-bold mb-3">Network Intelligence Framework</h6>
            <p className="small text-muted mb-0">
              Advanced financial network analysis for Green Financing compliance and risk detection.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="small mb-0">
              <strong>Copyright © {currentYear} Delta Team</strong>
            </p>
            <p className="small text-muted">All rights reserved.</p>
          </div>
        </div>
        <hr className="my-3 bg-secondary" />
        <div className="text-center">
          <small className="text-muted">
            Powered by AI Intelligence Network | <a href="#privacy" className="text-muted text-decoration-none">Privacy Policy</a>
          </small>
        </div>
      </div>
    </footer>
  );
} 
