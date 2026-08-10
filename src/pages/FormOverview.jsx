import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  FORM_STATUS,
  STATUS_LABELS,
  countSurveyQuestions,
  getFormById,
  getResponses,
  getSurveyFields,
  updateFormStatus,
} from "../services/surveyStore";

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function FormOverview() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadOverview = async () => {
    setLoading(true);
    setError("");

    try {
      const loadedForm = await getFormById(id);
      setForm(loadedForm);
      setResponses(loadedForm ? await getResponses(loadedForm.id) : []);
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el resumen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [id]);

  const copyPublicLink = async () => {
    const publicUrl = `${window.location.origin}/f/${form.slug}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setNotice("Link publico copiado.");
    } catch {
      setNotice(`No se pudo copiar automaticamente. Link: ${publicUrl}`);
    }
  };

  const togglePublished = async () => {
    try {
      const updated = await updateFormStatus(
        form.id,
        form.status === FORM_STATUS.published ? FORM_STATUS.draft : FORM_STATUS.published,
      );

      setForm(updated);
      setNotice(
        updated.status === FORM_STATUS.published
          ? "Formulario publicado."
          : "Formulario despublicado.",
      );
    } catch (statusError) {
      setError(statusError.message || "No se pudo cambiar la publicacion.");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Resumen" eyebrow="Cargando formulario">
        <section className="empty-state">
          <h2>Cargando resumen</h2>
          <p>Consultando Supabase.</p>
        </section>
      </AdminLayout>
    );
  }

  if (!form) {
    return (
      <AdminLayout title="Resumen" eyebrow="Formulario no encontrado">
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

  const fields = getSurveyFields(form.surveyJson);
  const questionCount = countSurveyQuestions(form.surveyJson);
  const publicUrl = `${window.location.origin}/f/${form.slug}`;
  const latestResponse = responses[0];

  return (
    <AdminLayout
      title={form.title}
      eyebrow="Resumen del formulario"
      actions={
        <div className="actions-row">
          <Link className="button secondary" to="/admin/forms">
            Volver
          </Link>
          <Link className="button secondary" to={`/admin/forms/${form.id}`}>
            Editar
          </Link>
          <Link className="button primary" to={`/admin/forms/${form.id}/preview`}>
            Preview
          </Link>
        </div>
      }
    >
      {error ? <p className="form-message error">{error}</p> : null}

      <section className="overview-grid">
        <article className="metric-card">
          <span>Estado</span>
          <strong>
            <span className={`status ${form.status}`}>{STATUS_LABELS[form.status]}</span>
          </strong>
        </article>
        <article className="metric-card">
          <span>Preguntas</span>
          <strong>{questionCount}</strong>
        </article>
        <article className="metric-card">
          <span>Respuestas</span>
          <strong>{responses.length}</strong>
        </article>
        <article className="metric-card">
          <span>Ultima respuesta</span>
          <strong>{latestResponse ? formatDate(latestResponse.submittedAt) : "Sin datos"}</strong>
        </article>
      </section>

      <section className="detail-panel">
        <div>
          <h2>Publicacion</h2>
          <p className="muted">
            {form.status === FORM_STATUS.published
              ? "Este formulario esta disponible para usuarios finales."
              : "Este formulario no esta disponible publicamente."}
          </p>
        </div>

        {notice ? <p className="form-message success">{notice}</p> : null}

        <div className="copy-field">
          <input readOnly value={publicUrl} />
          <button
            className="button secondary"
            type="button"
            onClick={copyPublicLink}
            disabled={form.status !== FORM_STATUS.published}
          >
            Copiar link
          </button>
          <button className="button secondary" type="button" onClick={togglePublished}>
            {form.status === FORM_STATUS.published ? "Despublicar" : "Publicar"}
          </button>
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-panel">
          <h2>Datos generales</h2>
          <dl className="definition-list">
            <div>
              <dt>Slug</dt>
              <dd>/f/{form.slug}</dd>
            </div>
            <div>
              <dt>Creado</dt>
              <dd>{formatDate(form.createdAt)}</dd>
            </div>
            <div>
              <dt>Actualizado</dt>
              <dd>{formatDate(form.updatedAt)}</dd>
            </div>
            <div>
              <dt>Descripcion</dt>
              <dd>{form.description || "Sin descripcion interna"}</dd>
            </div>
          </dl>
        </article>

        <article className="detail-panel">
          <h2>Campos detectados</h2>
          {fields.length === 0 ? (
            <p className="muted">No se detectaron campos con nombre.</p>
          ) : (
            <ul className="field-list">
              {fields.slice(0, 12).map((field) => (
                <li key={field.name}>
                  <strong>{field.title}</strong>
                  <span>{field.name} · {field.type}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <h2>Respuestas recientes</h2>
            <p className="muted">Ultimos envios recibidos en Supabase.</p>
          </div>
          <Link className="button secondary" to={`/admin/forms/${form.id}/responses`}>
            Ver respuestas
          </Link>
        </div>

        {responses.length === 0 ? (
          <p className="muted">Todavia no hay respuestas para este formulario.</p>
        ) : (
          <div className="recent-list">
            {responses.slice(0, 5).map((response) => (
              <div key={response.id}>
                <strong>{formatDate(response.submittedAt)}</strong>
                <span>{Object.keys(response.data || {}).length} campo(s) respondido(s)</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}

export default FormOverview;
