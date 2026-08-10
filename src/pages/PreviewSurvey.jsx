import { Link, useParams } from "react-router-dom";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import AdminLayout from "../components/AdminLayout";
import { getFormById } from "../services/surveyStore";

function PreviewSurvey() {
  const { id } = useParams();
  const form = getFormById(id);

  if (!form) {
    return (
      <AdminLayout title="Vista previa" eyebrow="Formulario no encontrado">
        <section className="empty-state">
          <h2>No encontramos ese formulario</h2>
          <Link className="button primary" to="/admin/forms">
            Volver al dashboard
          </Link>
        </section>
      </AdminLayout>
    );
  }

  const survey = new Model(form.surveyJson);
  survey.onComplete.add((sender) => {
    sender.clear(false, true);
  });

  return (
    <AdminLayout
      title={form.title}
      eyebrow="Vista previa sin guardar respuestas"
      actions={
        <div className="actions-row">
          <Link className="button secondary" to={`/admin/forms/${form.id}`}>
            Editar
          </Link>
          {form.status === "published" ? (
            <Link className="button primary" to={`/f/${form.slug}`} target="_blank">
              Abrir publico
            </Link>
          ) : null}
        </div>
      }
    >
      <section className="preview-banner">
        Estas probando el formulario. Las respuestas de esta vista no se guardan.
      </section>
      <section className="survey-container admin-survey">
        <Survey model={survey} />
      </section>
    </AdminLayout>
  );
}

export default PreviewSurvey;
