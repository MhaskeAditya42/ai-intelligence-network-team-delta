import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Header() {
  const [logoUnavailable, setLogoUnavailable] = useState(false);

  return (
    <nav className="navbar navbar-expand-lg argus-navbar">
      <div className="container-fluid px-4">
        <Link className="navbar-brand argus-brand" to="/" aria-label="Argus AML home">
          {logoUnavailable ? (
            <span className="hsbc-logo-fallback" aria-label="HSBC logo placeholder">LOGO</span>
          ) : (
            <img
              className="hsbc-logo"
              src="/assets/hsbc_logo.png"
              alt="HSBC logo"
              onError={() => setLogoUnavailable(true)}
            />
          )}
          <span>
            <strong>Green Financing <span className="argus-brand-divider">·</span> Argus AML</strong>
            <small>Financial crime intelligence</small>
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/about">
                About
              </NavLink>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#contact">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
