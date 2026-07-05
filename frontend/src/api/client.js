import axios from "axios";

const API_BASE = "http://localhost:8000";

export async function fetchSarReport(scenario, entity) {
  const response = await axios.get(`${API_BASE}/sar-report/${scenario}/${entity}`);
  return response.data;
}