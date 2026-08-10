import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

function Login() {
  const { loading, session, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const from = location.state?.from?.pathname || "/admin/forms";

  if (!loading && session) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (loginError) {
      setError(loginError.message || "No se pudo iniciar sesion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <p className="eyebrow">Acceso administrativo</p>
        <h1>SurveyUNEFA</h1>
        <p>Inicia sesion con una cuenta autorizada en Supabase Auth.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Correo
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Contrasena
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="form-message error">{error}</p> : null}

          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <Link to="/f/demo" className="muted">
          Ir a formularios publicos por slug
        </Link>
      </section>
    </main>
  );
}

export default Login;
