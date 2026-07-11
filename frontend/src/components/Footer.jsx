import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="argus-footer py-4 mt-5">
      <div className="container-fluid px-4">
        <div className="row">
          <div className="col-md-6">
            <h6 className="fw-bold mb-3">Argus AML</h6>
            <p className="small argus-footer-muted mb-0">
              Financial network intelligence for AML investigation and risk detection.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="small mb-0">
              <strong>Copyright © {currentYear} Delta Team</strong>
            </p>
            <p className="small argus-footer-muted">All rights reserved.</p>
          </div>
        </div>
        <hr className="my-3" />
        <div className="text-center">
          <small className="argus-footer-muted">
            Powered by Argus AML | <a href="#privacy" className="argus-footer-muted text-decoration-none">Privacy Policy</a>
          </small>
        </div>
      </div>
    </footer>
  );
} 
