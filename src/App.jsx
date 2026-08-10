import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider";
import { ADMIN_ROLES } from "./auth/roles";
import ProtectedRoute from "./auth/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import TakeSurvey from "./pages/TakeSurvey";
import NewSurvey from "./pages/NewSurvey";
import Results from "./pages/Results";
import PreviewSurvey from "./pages/PreviewSurvey";
import FormOverview from "./pages/FormOverview";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import Unauthorized from "./pages/Unauthorized";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/f/:slug" element={<TakeSurvey />} />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    ADMIN_ROLES.globalAdmin,
                    ADMIN_ROLES.formAdmin,
                    ADMIN_ROLES.formEditor,
                    ADMIN_ROLES.viewer,
                  ]}
                />
              }
            >
              <Route path="/admin/forms" element={<Dashboard />} />
              <Route path="/admin/forms/:id/overview" element={<FormOverview />} />
              <Route path="/admin/forms/:id/preview" element={<PreviewSurvey />} />
              <Route path="/admin/forms/:id/responses" element={<Results />} />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    ADMIN_ROLES.globalAdmin,
                    ADMIN_ROLES.formAdmin,
                    ADMIN_ROLES.formEditor,
                  ]}
                />
              }
            >
              <Route path="/admin/forms/new" element={<NewSurvey />} />
              <Route path="/admin/forms/:id" element={<NewSurvey />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ADMIN_ROLES.globalAdmin]} />}>
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>

            <Route path="/dashboard" element={<Navigate to="/admin/forms" replace />} />
            <Route path="/new-survey" element={<Navigate to="/admin/forms/new" replace />} />
            <Route path="/survey/:id" element={<Navigate to="/admin/forms" replace />} />
            <Route path="/results" element={<Navigate to="/admin/forms" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
