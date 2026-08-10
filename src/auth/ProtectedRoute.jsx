import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { hasRole } from "./roles";

function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const { loading, profile, profileError, session } = useAuth();

  if (loading) {
    return (
      <section className="auth-screen">
        <div className="auth-panel">
          <p className="eyebrow">Validando acceso</p>
          <h1>SurveyUNEFA</h1>
          <p>Estamos revisando tu sesion administrativa.</p>
        </div>
      </section>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!profile || profileError) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles?.length && !hasRole(profile, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
