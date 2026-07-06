import axios from "axios";

const API_BASE = "http://localhost:8000";

export async function fetchSarReport(scenario, entity) {
  const response = await axios.get(`${API_BASE}/sar-report/${scenario}/${entity}`);
  return response.data;
}

export async function fetchScorecard(scenario, entity) {
  const data = await fetchSarReport(scenario, entity);
  return data.scorecard || [];
}

export async function fetchScenarios() {
  const response = await axios.get(`${API_BASE}/sar-report/scenarios`);
  return response.data.scenarios;
}