import React, { useEffect, useState } from "react";
import ScenarioCard from "../components/ScenarioCard";
import FileUploadSection from "../components/FileUploadSection";
import { fetchScenarios } from "../api/client";

export default function HomePage() {
  const [scenarios, setScenarios] = useState([]);
  const [uploadedScenarios, setUploadedScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    // Load API scenarios
    fetchScenarios()
      .then(setScenarios)
      .finally(() => setLoading(false));

    // Load uploaded scenarios from localStorage
    const saved = localStorage.getItem("uploadedScenarios");
    if (saved) {
      try {
        setUploadedScenarios(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved scenarios:", e);
      }
    }
  }, []);

  const handleFileUpload = (jsonData, fileName) => {
    try {
      // Validate JSON structure
      if (!jsonData.scenario || !jsonData.graph) {
        setUploadError(
          "Invalid file structure. Must contain 'scenario' and 'graph' fields."
        );
        return;
      }

      // Create scenario object
      const newScenario = {
        id: `uploaded_${Date.now()}`,
        name: jsonData.scenario?.name || fileName.replace(".json", ""),
        description: jsonData.scenario?.description || "Uploaded scenario",
        trigger_entity: jsonData.scenario?.trigger_entity || "unknown",
        _isUploaded: true,
        _uploadedData: jsonData,
      };

      // Add to uploaded scenarios
      const updated = [newScenario, ...uploadedScenarios];
      setUploadedScenarios(updated);

      // Save to localStorage
      localStorage.setItem("uploadedScenarios", JSON.stringify(updated));

      // Clear error
      setUploadError(null);
    } catch (error) {
      setUploadError("Error processing file: " + error.message);
    }
  };

  const handleError = (message) => {
    setUploadError(message);
  };

  const handleClearUploaded = () => {
    if (window.confirm("Are you sure you want to clear all uploaded scenarios? This action cannot be undone.")) {
      setUploadedScenarios([]);
      localStorage.removeItem("uploadedScenarios");
    }
  };

  const allScenarios = [...uploadedScenarios, ...scenarios];

  return (
    <div className="py-5">
      <div className="container-fluid px-4">
        <h1 className="display-4 fw-bold mb-2">Network Intelligence Framework</h1>
        <p className="lead text-muted mb-4">
          Select a scenario to view its network graph, SAR recommendation, and relationship risk scores.
        </p>

        {uploadError && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <strong>Upload Error:</strong> {uploadError}
            <button
              type="button"
              className="btn-close"
              onClick={() => setUploadError(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        <FileUploadSection onFileUpload={handleFileUpload} onError={handleError} />

        {loading && (
          <div className="alert alert-info d-flex align-items-center" role="alert">
            <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
            Loading scenarios...
          </div>
        )}

        {uploadedScenarios.length > 0 && (
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="text-primary mb-0">📤 Uploaded Scenarios ({uploadedScenarios.length})</h5>
              <button
                onClick={handleClearUploaded}
                className="btn btn-outline-danger btn-sm"
                title="Delete all uploaded scenarios"
              >
                <i className="bi bi-trash"></i> Clear All
              </button>
            </div>
            <div className="row g-4 mb-4">
              {uploadedScenarios.map((s) => (
                <div key={s.id} className="col-lg-6 col-xl-4">
                  <ScenarioCard scenario={s} />
                </div>
              ))}
            </div>
            <hr className="my-4" />
          </div>
        )}

        <h5 className="text-muted mb-3">📊 Available Scenarios ({scenarios.length})</h5>
        <div className="row g-4">
          {scenarios.map((s) => (
            <div key={s.id} className="col-lg-6 col-xl-4">
              <ScenarioCard scenario={s} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}