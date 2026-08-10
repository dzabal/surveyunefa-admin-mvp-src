const FORMS_KEY = "surveyunefa.forms";
const RESPONSES_KEY = "surveyunefa.responses";
const LEGACY_FORMS_KEY = "encuestas";
const LEGACY_RESPONSES_KEY = "respuestas";

export const FORM_STATUS = {
  draft: "draft",
  published: "published",
  archived: "archived",
};

export const STATUS_LABELS = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function slugify(value) {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function validateSurveyJson(rawJson) {
  if (!rawJson.trim()) {
    return { ok: false, message: "Pega el JSON generado por SurveyJS Creator." };
  }

  try {
    const parsed = JSON.parse(rawJson);
    const hasPages = Array.isArray(parsed.pages) && parsed.pages.length > 0;
    const hasElements = Array.isArray(parsed.elements) && parsed.elements.length > 0;

    if (!hasPages && !hasElements) {
      return {
        ok: false,
        message: "El JSON debe incluir pages o elements para poder renderizarse.",
      };
    }

    return { ok: true, surveyJson: parsed };
  } catch {
    return { ok: false, message: "El contenido no es un JSON valido." };
  }
}

function normalizeLegacyForm(form) {
  const validation = validateSurveyJson(form.json || "{}");
  const surveyJson = validation.ok ? validation.surveyJson : {};
  const title = form.nombre || surveyJson.title || "Formulario sin titulo";

  return {
    id: String(form.id || createId()),
    title,
    slug: slugify(title || form.id || createId()),
    description: "",
    status: form.estado === "Activa" ? FORM_STATUS.published : FORM_STATUS.draft,
    surveyJson,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function migrateLegacyStorage() {
  const forms = readJson(FORMS_KEY, null);
  if (!forms) {
    const legacyForms = readJson(LEGACY_FORMS_KEY, []);
    writeJson(FORMS_KEY, legacyForms.map(normalizeLegacyForm));
  }

  const responses = readJson(RESPONSES_KEY, null);
  if (!responses) {
    const legacyResponses = readJson(LEGACY_RESPONSES_KEY, []);
    writeJson(
      RESPONSES_KEY,
      legacyResponses.map((response) => ({
        id: createId(),
        formId: String(response.surveyId),
        submittedAt: response.fecha || new Date().toISOString(),
        data: response.data || {},
      })),
    );
  }
}

export function getForms() {
  migrateLegacyStorage();
  return readJson(FORMS_KEY, []).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getFormById(id) {
  return getForms().find((form) => form.id === id) || null;
}

export function getPublishedFormBySlug(slug) {
  return (
    getForms().find(
      (form) => form.slug === slug && form.status === FORM_STATUS.published,
    ) || null
  );
}

export function isSlugAvailable(slug, currentId) {
  return !getForms().some((form) => form.slug === slug && form.id !== currentId);
}

export function saveForm(payload) {
  const forms = getForms();
  const now = new Date().toISOString();
  const id = payload.id || createId();
  const existing = forms.find((form) => form.id === id);
  const form = {
    id,
    title: payload.title.trim(),
    slug: slugify(payload.slug || payload.title),
    description: payload.description.trim(),
    status: payload.status,
    surveyJson: payload.surveyJson,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  const nextForms = existing
    ? forms.map((item) => (item.id === id ? form : item))
    : [form, ...forms];

  writeJson(FORMS_KEY, nextForms);
  return form;
}

export function deleteForm(id) {
  writeJson(
    FORMS_KEY,
    getForms().filter((form) => form.id !== id),
  );
  writeJson(
    RESPONSES_KEY,
    getResponses().filter((response) => response.formId !== id),
  );
}

export function getResponses(formId) {
  const responses = readJson(RESPONSES_KEY, []);
  return formId
    ? responses.filter((response) => response.formId === formId)
    : responses;
}

export function saveResponse(formId, data) {
  const response = {
    id: createId(),
    formId,
    submittedAt: new Date().toISOString(),
    data,
  };

  writeJson(RESPONSES_KEY, [response, ...getResponses()]);
  return response;
}

export function deleteResponse(responseId) {
  writeJson(
    RESPONSES_KEY,
    getResponses().filter((response) => response.id !== responseId),
  );
}
