import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ScenarioCard from "../components/ScenarioCard";
import { fetchBatchDates, fetchScenarios } from "../api/client";

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [scenarios, setScenarios] = useState([]);
  const [batchDates, setBatchDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get("batch_date") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatchDates()
      .then(setBatchDates)
      .catch(() => setBatchDates([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchScenarios(selectedDate || undefined)
      .then(setScenarios)
      .catch(() => setScenarios([]))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  return (
    <div className="py-5">
      <div className="container-fluid px-4">
        <h1 className="display-4 fw-bold mb-2">Network Intelligence Framework</h1>
        <p className="lead text-muted mb-4">
          Choose a processing date to view that day's batch, then open a network for its risk analysis.
        </p>

        <div className="row align-items-end mb-4">
          <div className="col-sm-5 col-md-4 col-lg-3">
            <label htmlFor="batch-date" className="form-label fw-semibold">Processing date</label>
            <input
              id="batch-date"
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              list="available-batch-dates"
            />
            <datalist id="available-batch-dates">
              {batchDates.map((batchDate) => <option key={batchDate} value={batchDate} />)}
            </datalist>
          </div>
          <div className="col-sm-auto mt-2 mt-sm-0">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setSelectedDate("")}>All sample data</button>
          </div>
        </div>

        {loading && (
          <div className="alert alert-info d-flex align-items-center" role="alert">
            <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
            Loading scenarios...
          </div>
        )}

        {!loading && selectedDate && scenarios.length === 0 && (
          <div className="alert alert-warning">No processed batch is available for {selectedDate}.</div>
        )}

        <div className="row g-4">
          {scenarios.map((s) => (
            <div key={s.id} className="col-lg-6 col-xl-4">
              <ScenarioCard scenario={s} batchDate={selectedDate || undefined} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
