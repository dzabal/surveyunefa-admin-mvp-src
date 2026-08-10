import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

function Unauthorized() {
  const { profileError, signOut, user } = useAuth();

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <p className="eyebrow">Acceso restringido</p>
        <h1>No tienes permiso para esta seccion</h1>
        <p>
          {profileError ||
            "Tu cuenta existe, pero no tiene un rol administrativo activo para este portal."}
        </p>
        {user?.email ? <p className="muted">Sesion actual: {user.email}</p> : null}
        <div className="actions-row">
          <Link className="button secondary" to="/">
            Inicio
          </Link>
          <button className="button primary" type="button" onClick={signOut}>
            Cerrar sesion
          </button>
        </div>
      </section>
    </main>
  );
}

export default Unauthorized;
