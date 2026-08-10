import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import TakeSurvey from "./pages/TakeSurvey";
import NewSurvey from "./pages/NewSurvey";
import Results from "./pages/Results";
import PreviewSurvey from "./pages/PreviewSurvey";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/forms" element={<Dashboard />} />
        <Route path="/admin/forms/new" element={<NewSurvey />} />
        <Route path="/admin/forms/:id" element={<NewSurvey />} />
        <Route path="/admin/forms/:id/preview" element={<PreviewSurvey />} />
        <Route path="/admin/forms/:id/responses" element={<Results />} />
        <Route path="/f/:slug" element={<TakeSurvey />} />

        <Route path="/dashboard" element={<Navigate to="/admin/forms" replace />} />
        <Route path="/new-survey" element={<Navigate to="/admin/forms/new" replace />} />
        <Route path="/survey/:id" element={<Navigate to="/admin/forms" replace />} />
        <Route path="/results" element={<Navigate to="/admin/forms" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
