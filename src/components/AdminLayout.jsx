import { Link, NavLink } from "react-router-dom";

function AdminLayout({ title, eyebrow, actions, children }) {
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand" to="/admin/forms">
          <span className="brand-mark">S</span>
          <span>
            <strong>SurveyUNEFA</strong>
            <small>Admin local</small>
          </span>
        </Link>

        <nav className="sidebar-nav" aria-label="Navegacion administrativa">
          <NavLink to="/admin/forms">Formularios</NavLink>
        </nav>
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
