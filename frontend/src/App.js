import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ScenarioDetailPage from "./pages/ScenarioDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scenario/:scenarioId" element={<ScenarioDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}