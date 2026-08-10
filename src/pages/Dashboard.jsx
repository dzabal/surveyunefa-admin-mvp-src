import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  deleteForm,
  FORM_STATUS,
  getForms,
  getResponses,
  STATUS_OPTIONS,
  STATUS_LABELS,
  updateFormStatus,
} from "../services/surveyStore";

function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const forms = getForms();
  const visibleForms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return forms.filter((form) => {
      const matchesStatus =
        statusFilter === "all" ? true : form.status === statusFilter;
      const matchesQuery = normalizedQuery
        ? [form.title, form.slug, form.description]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedQuery))
        : true;

      return matchesStatus && matchesQuery;
    });
  }, [forms, query, statusFilter, refreshKey]);

  const statusCounts = forms.reduce(
    (counts, form) => ({
      ...counts,
      [form.status]: (counts[form.status] || 0) + 1,
    }),
    {},
  );

  const refresh = () => setRefreshKey((current) => current + 1);

  const removeForm = (form) => {
    const confirmed = window.confirm(
      `Eliminar "${form.title}" tambien borrara sus respuestas locales. ¿Continuar?`,
    );

    if (confirmed) {
      deleteForm(form.id);
      setNotice(`Formulario "${form.title}" eliminado.`);
      refresh();
    }
  };

  const changeStatus = (form, status) => {
    const nextForm = updateFormStatus(form.id, status);
    if (nextForm) {
      setNotice(`"${nextForm.title}" ahora esta ${STATUS_LABELS[nextForm.status].toLowerCase()}.`);
      refresh();
    }
  };

  const copyPublicLink = async (form) => {
    const publicUrl = `${window.location.origin}/f/${form.slug}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setNotice(`Link publico copiado: /f/${form.slug}`);
    } catch {
      setNotice(`No se pudo copiar automaticamente. Link: ${publicUrl}`);
    }
  };

  return (
    <AdminLayout
      title="Formularios"
      eyebrow={`${forms.length} formulario${forms.length === 1 ? "" : "s"}`}
      actions={
        <Link className="button primary" to="/admin/forms/new">
          Nuevo formulario
        </Link>
      }
    >
      {forms.length > 0 ? (
        <section className="toolbar-panel">
          <div className="filter-grid">
            <label>
              Buscar
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre, slug o descripcion"
              />
            </label>

            <label>
              Estado
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="summary-grid">
            <span>Total: {forms.length}</span>
            <span>Publicados: {statusCounts.published || 0}</span>
            <span>Borradores: {statusCounts.draft || 0}</span>
            <span>Archivados: {statusCounts.archived || 0}</span>
          </div>

          {notice ? <p className="form-message success">{notice}</p> : null}
        </section>
      ) : null}

      {forms.length === 0 ? (
        <section className="empty-state">
          <h2>No hay formularios todavia</h2>
          <p>
            Importa el JSON generado por SurveyJS Creator Online para comenzar a
            administrarlo localmente.
          </p>
          <Link className="button primary" to="/admin/forms/new">
            Importar JSON
          </Link>
        </section>
      ) : visibleForms.length === 0 ? (
        <section className="empty-state">
          <h2>No encontramos formularios con esos filtros</h2>
          <p>Ajusta la busqueda o cambia el estado seleccionado.</p>
        </section>
      ) : (
        <section className="table-panel">
          <table>
            <thead>
              <tr>
                <th>Formulario</th>
                <th>Estado</th>
                <th>Respuestas</th>
                <th>Actualizado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {visibleForms.map((form) => {
                const responses = getResponses(form.id);

                return (
                  <tr key={form.id}>
                    <td>
                      <strong>{form.title}</strong>
                      <span className="muted">/f/{form.slug}</span>
                    </td>
                    <td>
                      <span className={`status ${form.status}`}>
                        {STATUS_LABELS[form.status]}
                      </span>
                    </td>
                    <td>{responses.length}</td>
                    <td>{new Date(form.updatedAt).toLocaleString()}</td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/admin/forms/${form.id}`}>Editar</Link>
                        <Link to={`/admin/forms/${form.id}/preview`}>Preview</Link>
                        <Link to={`/admin/forms/${form.id}/responses`}>
                          Respuestas
                        </Link>
                        {form.status === FORM_STATUS.published ? (
                          <button
                            className="link-button"
                            type="button"
                            onClick={() => changeStatus(form, FORM_STATUS.draft)}
                          >
                            Despublicar
                          </button>
                        ) : (
                          <button
                            className="link-button"
                            type="button"
                            onClick={() => changeStatus(form, FORM_STATUS.published)}
                          >
                            Publicar
                          </button>
                        )}
                        <button
                          className="link-button"
                          type="button"
                          onClick={() => copyPublicLink(form)}
                          disabled={form.status !== "published"}
                        >
                          Copiar link
                        </button>
                        <button
                          className="link-button danger"
                          type="button"
                          onClick={() => removeForm(form)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </AdminLayout>
  );
}

export default Dashboard;
