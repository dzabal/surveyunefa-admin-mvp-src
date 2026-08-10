import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { canManageUsers, ROLE_LABELS } from "../auth/roles";

function AdminLayout({ title, eyebrow, actions, children }) {
  const { profile, signOut, user } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand" to="/admin/forms">
          <span className="brand-mark">S</span>
          <span>
            <strong>SurveyUNEFA</strong>
            <small>Admin seguro</small>
          </span>
        </Link>

        <nav className="sidebar-nav" aria-label="Navegacion administrativa">
          <NavLink to="/admin/forms">Formularios</NavLink>
          {canManageUsers(profile) ? <NavLink to="/admin/users">Usuarios</NavLink> : null}
        </nav>

        <div className="sidebar-account">
          <strong>{user?.email}</strong>
          <span>{ROLE_LABELS[profile?.role] || "Sin rol"}</span>
          <button className="link-button" type="button" onClick={signOut}>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h1>{title}</h1>
          </div>
          {actions ? <div className="header-actions">{actions}</div> : null}
        </header>

        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
