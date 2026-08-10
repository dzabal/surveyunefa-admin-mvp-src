import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import AdminLayout from "../components/AdminLayout";
import { FORM_STATUS, getFormById } from "../services/surveyStore";

function PreviewSurvey() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadForm() {
      setLoading(true);
      setError("");

      try {
        setForm(await getFormById(id));
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar el formulario.");
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [id]);

  const survey = useMemo(() => {
    if (!form) {
      return null;
    }

    const model = new Model(form.surveyJson);
    model.onComplete.add((sender) => {
      sender.clear(false, true);
    });

    return model;
  }, [form]);

  if (loading) {
    return (
      <AdminLayout title="Vista previa">
        <section className="empty-state">
          <h2>Cargando formulario</h2>
          <p>Consultando Supabase.</p>
        </section>
      </AdminLayout>
    );
  }

  if (!form) {
    return (
      <AdminLayout title="Vista previa" eyebrow="Formulario no encontrado">
        <section className="empty-state">
          <h2>No encontramos ese formulario</h2>
          {error ? <p className="form-message error">{error}</p> : null}
          <Link className="button primary" to="/admin/forms">
            Volver al dashboard
          </Link>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={form.title}
      eyebrow="Vista previa sin guardar respuestas"
      actions={
        <div className="actions-row">
          <Link className="button secondary" to={`/admin/forms/${form.id}`}>
            Editar
          </Link>
          {form.status === FORM_STATUS.published ? (
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
