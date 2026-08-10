import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  FORM_STATUS,
  countSurveyQuestions,
  getFormById,
  getResponses,
  getSurveyFields,
  getSurveyTitle,
  isSlugAvailable,
  saveForm,
  saveFormToDb,
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
  const [messageType, setMessageType] = useState("neutral");
  const [jsonInfo, setJsonInfo] = useState(null);

  const isEditing = Boolean(existingForm);

  const handleTitleChange = (value) => {
    setTitle(value);
    if (!isEditing || !slug) {
      setSlug(slugify(value));
    }
  };

  const handleJsonChange = (value) => {
    setRawJson(value);
    setMessage("");
    setJsonInfo(null);
  };

  const applyJsonDetails = (surveyJson) => {
    const detectedTitle = getSurveyTitle(surveyJson);
    const fields = getSurveyFields(surveyJson);
    const questionCount = countSurveyQuestions(surveyJson);

    if (!title.trim() && detectedTitle) {
      setTitle(detectedTitle);
      setSlug(slugify(detectedTitle));
    }

    setJsonInfo({
      title: detectedTitle,
      questions: questionCount,
      fields: fields.length,
    });
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
    setMessage(validation.message);
    setMessageType(validation.ok ? "success" : "error");

    if (validation.ok) {
      applyJsonDetails(validation.surveyJson);
      return;
    }

    setJsonInfo(null);
  };

  const handleFormatJson = () => {
    const validation = validateSurveyJson(rawJson);

    if (!validation.ok) {
      setMessage(validation.message);
      setMessageType("error");
      setJsonInfo(null);
      return;
    }

    setRawJson(JSON.stringify(validation.surveyJson, null, 2));
    setMessage("JSON formateado correctamente.");
    setMessageType("success");
    applyJsonDetails(validation.surveyJson);
  };

  const handleSave = async (nextStatus = status, redirectToPreview = false) => {
    const result = validateAndBuildPayload(nextStatus);

    if (!result.ok) {
      setMessage(result.message);
      setMessageType("error");
      setJsonInfo(null);
      return;
    }

    const form = await saveFormToDb(result.payload);
    setMessage("Formulario guardado correctamente.");
    setMessageType("success");

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

            {status === FORM_STATUS.published ? (
              <div className="publish-note">
                Al guardar, el formulario quedara disponible en /f/
                {slug || "slug-publico"}.
              </div>
            ) : null}
          </section>

          <section className="form-panel json-panel">
            <div className="section-heading">
              <label htmlFor="survey-json">JSON de SurveyJS</label>
              <div className="actions-row">
                <button
                  className="button secondary compact"
                  type="button"
                  onClick={handleValidate}
                >
                  Validar
                </button>
                <button
                  className="button secondary compact"
                  type="button"
                  onClick={handleFormatJson}
                >
                  Formatear
                </button>
              </div>
            </div>
            <textarea
              id="survey-json"
              value={rawJson}
              onChange={(event) => handleJsonChange(event.target.value)}
              placeholder='{"title":"Mi encuesta","pages":[...]}'
              spellCheck="false"
            />
            {jsonInfo ? (
              <div className="json-stats">
                <span>Preguntas: {jsonInfo.questions}</span>
                <span>Campos: {jsonInfo.fields}</span>
                {jsonInfo.title ? <span>Titulo: {jsonInfo.title}</span> : null}
              </div>
            ) : null}
          </section>

          <section className="form-toolbar">
            <div>
              {message ? (
                <p className={`form-message ${messageType}`}>{message}</p>
              ) : null}
            </div>
            <div className="actions-row">
              <button className="button secondary" type="button" onClick={() => handleSave(FORM_STATUS.draft)}>
                Guardar borrador
              </button>
              <button className="button secondary" type="button" onClick={() => handleSave(FORM_STATUS.published)}>
                Guardar y publicar
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
