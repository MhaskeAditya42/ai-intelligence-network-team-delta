import axios from "axios";

const API_BASE = "http://localhost:8000";

export async function fetchScenarios() {
  const res = await axios.get(`${API_BASE}/scenarios`);
  return res.data.scenarios;
}

export async function fetchSarReport(scenario, entity) {
  const res = await axios.get(`${API_BASE}/sar-report/${scenario}/${entity}`);
  return res.data;
}

export async function fetchGraph(scenario, entity) {
  const res = await axios.get(`${API_BASE}/analyze/${scenario}/${entity}`);
  return res.data;
}

export async function fetchRelationshipScores(scenario) {
  const res = await axios.get(`${API_BASE}/relationship-scores/${scenario}`);
  return res.data;
}