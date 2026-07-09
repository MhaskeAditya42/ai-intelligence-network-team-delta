import React, { useRef } from "react";
import { validateScenarioJSON } from "../utils/validateScenario";

export default function FileUploadSection({ onFileUpload, onError }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".json")) {
      onError("Please upload a JSON file (.json)");
      fileInputRef.current.value = "";
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      onError("File size must be less than 5MB");
      fileInputRef.current.value = "";
      return;
    }

    // Read and parse file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);

        // Validate JSON structure
        const validation = validateScenarioJSON(jsonData);
        if (!validation.isValid) {
          const errorMessages = validation.errors.join(", ");
          onError(`Invalid file structure: ${errorMessages}`);
          fileInputRef.current.value = "";
          return;
        }

        // Debug logging
        console.log("✅ File uploaded successfully");
        console.log("Scenario:", jsonData.scenario);
        console.log("Graph nodes:", jsonData.graph?.nodes?.length || 0);
        console.log("Graph edges:", jsonData.graph?.edges?.length || 0);
        console.log("Recommendation:", jsonData.recommendation);
        console.log("Edge scores:", jsonData.edge_scores?.length || 0);

        onFileUpload(jsonData, file.name);
        fileInputRef.current.value = "";
      } catch (error) {
        console.error("❌ Error parsing JSON:", error);
        onError("Invalid JSON file. Please check the file format.");
        fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      onError("Error reading file. Please try again.");
      fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="card shadow-sm mb-4 border-primary">
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-auto">
            <span className="badge bg-primary p-2">📤 UPLOAD</span>
          </div>
          <div className="col">
            <label className="form-label mb-0 fw-bold text-primary">
              Upload Custom Scenario (JSON)
            </label>
            <p className="text-muted small mb-0">
              Upload a JSON file to add a custom scenario and visualize its network graph. Check browser console (F12) for upload details.
            </p>
          </div>
          <div className="col-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="form-control form-control-sm"
              style={{ width: "200px" }}
              title="Upload JSON scenario file"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
