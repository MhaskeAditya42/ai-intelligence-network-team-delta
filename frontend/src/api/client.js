import axios from "axios";

const API_BASE = "http://localhost:8000";

function batchParams(batchDate) {
  return batchDate ? { batch_date: batchDate } : {};
}

export async function fetchScenarios(batchDate) {
  const res = await axios.get(`${API_BASE}/scenarios`, { params: batchParams(batchDate) });
  return res.data.scenarios;
}

export async function fetchBatchDates() {
  const res = await axios.get(`${API_BASE}/batches`);
  return res.data.batch_dates;
}

export async function fetchSarReport(scenario, entity, batchDate) {
  const res = await axios.get(`${API_BASE}/sar-report/${scenario}/${entity}`, { params: batchParams(batchDate) });
  return res.data;
}

export async function fetchGraph(scenario, entity, batchDate) {
  const res = await axios.get(`${API_BASE}/analyze/${scenario}/${entity}`, { params: batchParams(batchDate) });
  return res.data;
}

export async function fetchRelationshipScores(scenario, batchDate) {
  const res = await axios.get(`${API_BASE}/relationship-scores/${scenario}`, { params: batchParams(batchDate) });
  return res.data;
}
