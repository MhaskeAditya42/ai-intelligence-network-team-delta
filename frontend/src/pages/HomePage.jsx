import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ScenarioCard from "../components/ScenarioCard";
import DashboardMetrics from "../components/DashboardMetrics";
import { fetchBatchDates, fetchScenarios } from "../api/client";

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [scenarios, setScenarios] = useState([]);
  const [batchDates, setBatchDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get("batch_date") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatchDates()
      .then((dates) => {
        setBatchDates(dates);
        if (!selectedDate && dates[0]) setSelectedDate(dates[0]);
      })
      .catch(() => setBatchDates([]));
  }, [selectedDate]);

  useEffect(() => {
    setLoading(true);
    fetchScenarios(selectedDate || undefined)
      .then(setScenarios)
      .catch(() => setScenarios([]))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  return (
    <div className="argus-page py-5">
      <div className="container-fluid px-4">
        <div className="row align-items-end mb-4">
          <div className="col-sm-5 col-md-4 col-lg-3">
            <label htmlFor="batch-date" className="form-label fw-semibold">Processing month</label>
            <input
              id="batch-date"
              type="month"
              className="form-control"
              min="2026-01"
              max="2026-07"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              list="available-batch-months"
            />
            <datalist id="available-batch-months">
              {batchDates.map((batchDate) => <option key={batchDate} value={batchDate} />)}
            </datalist>
          </div>
          <div className="col-sm-auto mt-2 mt-sm-0">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setSelectedDate(batchDates[0] || "")}>Latest batch</button>
          </div>
        </div>

        <DashboardMetrics scenarios={scenarios} />

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
