import { supabase } from "./supabase";

const FORMS_KEY = "surveyunefa.forms";
const RESPONSES_KEY = "surveyunefa.responses";
const LEGACY_FORMS_KEY = "encuestas";
const LEGACY_RESPONSES_KEY = "respuestas";
const BACKUP_VERSION = 1;

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

export const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: FORM_STATUS.draft, label: STATUS_LABELS.draft },
  { value: FORM_STATUS.published, label: STATUS_LABELS.published },
  { value: FORM_STATUS.archived, label: STATUS_LABELS.archived },
];

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

function createUniqueSlug(baseSlug, currentId) {
  const cleanBase = slugify(baseSlug) || "formulario";
  let candidate = cleanBase;
  let suffix = 2;

  while (!isSlugAvailable(candidate, currentId)) {
    candidate = `${cleanBase}-${suffix}`;
    suffix += 1;
  }

  return candidate;
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
    const isObject = parsed && typeof parsed === "object" && !Array.isArray(parsed);
    const hasPages = Array.isArray(parsed.pages) && parsed.pages.length > 0;
    const hasElements = Array.isArray(parsed.elements) && parsed.elements.length > 0;

    if (!isObject) {
      return {
        ok: false,
        message: "El JSON debe ser un objeto de SurveyJS, no una lista ni texto suelto.",
      };
    }

    if (!hasPages && !hasElements) {
      return {
        ok: false,
        message: "El JSON debe incluir pages o elements para poder renderizarse.",
      };
    }

    const questionCount = countSurveyQuestions(parsed);

    return {
      ok: true,
      surveyJson: parsed,
      message: `JSON valido. Detectamos ${questionCount} pregunta${questionCount === 1 ? "" : "s"}.`,
      questionCount,
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message
        ? `El contenido no es un JSON valido: ${error.message}.`
        : "El contenido no es un JSON valido.",
    };
  }
}

export function getSurveyTitle(surveyJson) {
  if (typeof surveyJson?.title === "string" && surveyJson.title.trim()) {
    return surveyJson.title.trim();
  }

  if (
    typeof surveyJson?.pages?.[0]?.title === "string" &&
    surveyJson.pages[0].title.trim()
  ) {
    return surveyJson.pages[0].title.trim();
  }

  return "";
}

export function countSurveyQuestions(surveyJson) {
  const visitElements = (elements = []) =>
    elements.reduce((count, element) => {
      const nestedCount =
        visitElements(element.elements) +
        visitElements(element.templateElements) +
        visitElements(element.columns);

      return count + (element.name ? 1 : 0) + nestedCount;
    }, 0);

  const pageQuestions = (surveyJson.pages || []).reduce(
    (count, page) => count + visitElements(page.elements),
    0,
  );

  return pageQuestions + visitElements(surveyJson.elements);
}

export function getSurveyFields(surveyJson) {
  const fields = [];
  const seen = new Set();

  const labelFor = (element) => {
    if (typeof element.title === "string" && element.title.trim()) {
      return element.title.trim();
    }

    if (typeof element.name === "string" && element.name.trim()) {
      return element.name.trim();
    }

    return "";
  };

  const visitElements = (elements = []) => {
    elements.forEach((element) => {
      if (element?.name && !seen.has(element.name)) {
        seen.add(element.name);
        fields.push({
          name: element.name,
          title: labelFor(element),
          type: element.type || "question",
        });
      }

      visitElements(element?.elements);
      visitElements(element?.templateElements);
      visitElements(element?.columns);
    });
  };

  (surveyJson?.pages || []).forEach((page) => visitElements(page.elements));
  visitElements(surveyJson?.elements);

  return fields;
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

export function duplicateForm(id) {
  const form = getFormById(id);

  if (!form) {
    return null;
  }

  const copyTitle = `${form.title} copia`;
  const now = new Date().toISOString();
  const duplicated = {
    ...form,
    id: createId(),
    title: copyTitle,
    slug: createUniqueSlug(`${form.slug}-copia`),
    status: FORM_STATUS.draft,
    surveyJson: JSON.parse(JSON.stringify(form.surveyJson)),
    createdAt: now,
    updatedAt: now,
  };

  writeJson(FORMS_KEY, [duplicated, ...getForms()]);
  return duplicated;
}

export function updateFormStatus(id, status) {
  const form = getFormById(id);

  if (!form) {
    return null;
  }

  return saveForm({ ...form, status });
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

export function deleteResponsesByForm(formId) {
  writeJson(
    RESPONSES_KEY,
    getResponses().filter((response) => response.formId !== formId),
  );
}

export function exportLocalBackup() {
  return {
    app: "surveyunefa",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    forms: getForms(),
    responses: getResponses(),
  };
}

export function importLocalBackup(backup) {
  const isValidBackup =
    backup &&
    backup.app === "surveyunefa" &&
    Array.isArray(backup.forms) &&
    Array.isArray(backup.responses);

  if (!isValidBackup) {
    throw new Error("El archivo no parece ser un respaldo valido de SurveyUNEFA.");
  }

  writeJson(FORMS_KEY, backup.forms);
  writeJson(RESPONSES_KEY, backup.responses);

  return {
    forms: backup.forms.length,
    responses: backup.responses.length,
  };
}

export async function getFormsFromDb() {
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error cargando formularios:", error);
    return [];
  }

  return data;
}

export async function saveFormToDb(form) {

  const formId = form.id || crypto.randomUUID();

  console.log("FORMS TO SAVE:", form)
  const { data, error } = await supabase
    .from("forms")
    .insert([
      {
        id: formId,
        title: form.title,
        slug: form.slug,
        description: form.description,
        status: form.status,
        survey_json: form.surveyJson,
      },
    ])
    .select();

  console.log("DATA:",data);
  console.log("ERROR:", error);

  if (error) {
    console.error("Error guardando formulario:", error);
    return null;
  }

  return {
    ...data[0],
    id: formId,
  };
}

export async function getFormByIdFromDb(id) {
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error obteniendo formulario:", error);
    return null;
  }

  return data;
}

export async function deleteFormFromDb(id) {
  const { error } = await supabase
    .from("forms")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error eliminando formulario:", error);
    return false;
  }

  return true;
}

export async function updateFormInDb(id, updates) {
  const { data, error } = await supabase
    .from("forms")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando formulario:", error);
    return null;
  }

  return data;
}