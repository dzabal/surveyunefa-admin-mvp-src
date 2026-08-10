import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  deleteForm,
  getForms,
  getResponses,
  STATUS_LABELS,
} from "../services/surveyStore";

function Dashboard() {
  const forms = getForms();

  const removeForm = (form) => {
    const confirmed = window.confirm(
      `Eliminar "${form.title}" tambien borrara sus respuestas locales. ¿Continuar?`,
    );

    if (confirmed) {
      deleteForm(form.id);
      window.location.reload();
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
              {forms.map((form) => {
                const responses = getResponses(form.id);
                const publicUrl = `${window.location.origin}/f/${form.slug}`;

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
                        <button
                          className="link-button"
                          type="button"
                          onClick={() => navigator.clipboard.writeText(publicUrl)}
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
