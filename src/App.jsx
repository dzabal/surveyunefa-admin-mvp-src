import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import TakeSurvey from "./pages/TakeSurvey";
import NewSurvey from "./pages/NewSurvey";
import Results from "./pages/Results";
import PreviewSurvey from "./pages/PreviewSurvey";
import FormOverview from "./pages/FormOverview";
import TestSupabase from "./pages/TestSupabase";
import TestInsert from "./pages/TestInsert";
import TestFormById from "./pages/TestFormById";
import TestDelete from "./pages/TestDelete";
import TestUpdate from "./pages/TestUpdate";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/forms" element={<Dashboard />} />
        <Route path="/admin/forms/new" element={<NewSurvey />} />
        <Route path="/admin/forms/:id" element={<NewSurvey />} />
        <Route path="/admin/forms/:id/overview" element={<FormOverview />} />
        <Route path="/admin/forms/:id/preview" element={<PreviewSurvey />} />
        <Route path="/admin/forms/:id/responses" element={<Results />} />
        <Route path="/f/:slug" element={<TakeSurvey />} />

        <Route path="/dashboard" element={<Navigate to="/admin/forms" replace />} />
        <Route path="/new-survey" element={<Navigate to="/admin/forms/new" replace />} />
        <Route path="/survey/:id" element={<Navigate to="/admin/forms" replace />} />
        <Route path="/results" element={<Navigate to="/admin/forms" replace />} />
        <Route path="/test-db" element={<TestSupabase />} />
        <Route path="/test-insert" element={<TestInsert />} />
        <Route path="/test-form" element={<TestFormById />} />
        <Route path="/test-delete" element={<TestDelete />} />
        <Route path="/test-update" element={<TestUpdate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
