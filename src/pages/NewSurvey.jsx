import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  FORM_STATUS,
  getFormById,
  getResponses,
  isSlugAvailable,
  saveForm,
  slugify,
  validateSurveyJson,
} from "../services/surveyStore";

function NewSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existingForm = useMemo(() => (id ? getFormById(id) : null), [id]);
  const responses = existingForm ? getResponses(existingForm.id) : [];

  const [title, setTitle] = useState(existingForm?.title || "");
  const [slug, setSlug] = useState(existingForm?.slug || "");
  const [description, setDescription] = useState(existingForm?.description || "");
  const [status, setStatus] = useState(existingForm?.status || FORM_STATUS.draft);
  const [rawJson, setRawJson] = useState(
    existingForm ? JSON.stringify(existingForm.surveyJson, null, 2) : "",
  );
  const [message, setMessage] = useState("");

  const isEditing = Boolean(existingForm);

  const handleTitleChange = (value) => {
    setTitle(value);
    if (!isEditing || !slug) {
      setSlug(slugify(value));
    }
  };

  const validateAndBuildPayload = (nextStatus = status) => {
    const validation = validateSurveyJson(rawJson);

    if (!title.trim()) {
      return { ok: false, message: "El nombre del formulario es obligatorio." };
    }

    if (!slugify(slug || title)) {
      return { ok: false, message: "El slug publico no es valido." };
    }

    if (!validation.ok) {
      return validation;
    }

    const normalizedSlug = slugify(slug || title);

    if (!isSlugAvailable(normalizedSlug, existingForm?.id)) {
      return {
        ok: false,
        message: "Ya existe otro formulario con ese slug publico.",
      };
    }

    return {
      ok: true,
      payload: {
        id: existingForm?.id,
        title,
        slug: normalizedSlug,
        description,
        status: nextStatus,
        surveyJson: validation.surveyJson,
      },
    };
  };

  const handleValidate = () => {
    const validation = validateSurveyJson(rawJson);
    setMessage(validation.ok ? "JSON valido para SurveyJS." : validation.message);
  };

  const handleSave = (nextStatus = status, redirectToPreview = false) => {
    const result = validateAndBuildPayload(nextStatus);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    const form = saveForm(result.payload);
    setMessage("Formulario guardado correctamente.");

    if (redirectToPreview) {
      navigate(`/admin/forms/${form.id}/preview`);
      return;
    }

    navigate(`/admin/forms/${form.id}`);
  };

  return (
    <AdminLayout
      title={isEditing ? "Editar formulario" : "Nuevo formulario"}
      eyebrow="Importador JSON SurveyJS"
      actions={<Link className="button secondary" to="/admin/forms">Volver</Link>}
    >
      {id && !existingForm ? (
        <section className="empty-state">
          <h2>Formulario no encontrado</h2>
          <Link className="button primary" to="/admin/forms">
            Volver al dashboard
          </Link>
        </section>
      ) : (
        <div className="editor-grid">
          <section className="form-panel">
            {responses.length > 0 ? (
              <div className="warning">
                Este formulario ya tiene {responses.length} respuesta
                {responses.length === 1 ? "" : "s"}. Cambiar preguntas puede
                dificultar leer respuestas anteriores.
              </div>
            ) : null}

            <label>
              Nombre del formulario
              <input
                value={title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="Ej. Registro de estudiantes"
              />
            </label>

            <label>
              Slug publico
              <input
                value={slug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                placeholder="registro-estudiantes"
              />
            </label>

            <label>
              Descripcion interna
              <textarea
                className="small-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Notas administrativas opcionales"
              />
            </label>

            <label>
              Estado
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
            </label>
          </section>

          <section className="form-panel json-panel">
            <label>
              JSON de SurveyJS
              <textarea
                value={rawJson}
                onChange={(event) => setRawJson(event.target.value)}
                placeholder='{"title":"Mi encuesta","pages":[...]}'
                spellCheck="false"
              />
            </label>
          </section>

          <section className="form-toolbar">
            <div>{message ? <p className="form-message">{message}</p> : null}</div>
            <div className="actions-row">
              <button className="button secondary" type="button" onClick={handleValidate}>
                Validar JSON
              </button>
              <button className="button secondary" type="button" onClick={() => handleSave(FORM_STATUS.draft)}>
                Guardar borrador
              </button>
              <button className="button primary" type="button" onClick={() => handleSave(status, true)}>
                Guardar y previsualizar
              </button>
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}

export default NewSurvey;
