import { supabase } from "./supabase";
import { FORM_STATUS, createId, slugify } from "./surveyUtils";

const FORMS_TABLE = "forms";
const RESPONSES_TABLE = "form_responses";
const BACKUP_VERSION = 2;

function normalizeForm(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title || "Formulario sin titulo",
    slug: row.slug || "",
    description: row.description || "",
    status: row.status || FORM_STATUS.draft,
    surveyJson: row.survey_json || {},
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || row.created_at || new Date().toISOString(),
    responseCount: Number(row.response_count || row.responseCount || 0),
  };
}

function normalizeResponse(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    formId: row.form_id || row.formId,
    submittedAt: row.submitted_at || row.submittedAt || new Date().toISOString(),
    data: row.response_json || row.data || {},
  };
}

function toFormRow(form) {
  const now = new Date().toISOString();

  return {
    id: form.id || createId(),
    title: form.title.trim(),
    slug: slugify(form.slug || form.title),
    description: form.description?.trim() || "",
    status: form.status || FORM_STATUS.draft,
    survey_json: form.surveyJson,
    updated_at: now,
  };
}

function assertSupabaseConfig() {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error(
      "Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY en las variables de entorno.",
    );
  }
}

function handleSupabaseError(error, fallbackMessage) {
  if (!error) {
    return;
  }

  console.error(fallbackMessage, error);
  throw new Error(error.message || fallbackMessage);
}

async function getResponseCounts() {
  const { data, error } = await supabase
    .from(RESPONSES_TABLE)
    .select("form_id");

  if (error) {
    console.warn("No se pudieron contar respuestas.", error);
    return {};
  }

  return (data || []).reduce((counts, response) => {
    counts[response.form_id] = (counts[response.form_id] || 0) + 1;
    return counts;
  }, {});
}

export async function getForms() {
  assertSupabaseConfig();

  const [{ data, error }, responseCounts] = await Promise.all([
    supabase.from(FORMS_TABLE).select("*").order("updated_at", { ascending: false }),
    getResponseCounts(),
  ]);

  handleSupabaseError(error, "Error cargando formularios.");

  return (data || []).map((row) =>
    normalizeForm({
      ...row,
      response_count: responseCounts[row.id] || 0,
    }),
  );
}

export async function getFormById(id) {
  assertSupabaseConfig();

  const { data, error } = await supabase
    .from(FORMS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  handleSupabaseError(error, "Error cargando formulario.");
  return normalizeForm(data);
}

export async function getPublishedFormBySlug(slug) {
  assertSupabaseConfig();

  const { data, error } = await supabase
    .from(FORMS_TABLE)
    .select("*")
    .eq("slug", slug)
    .eq("status", FORM_STATUS.published)
    .maybeSingle();

  handleSupabaseError(error, "Error cargando formulario publico.");
  return normalizeForm(data);
}

export async function isSlugAvailable(slug, currentId) {
  assertSupabaseConfig();

  let query = supabase.from(FORMS_TABLE).select("id").eq("slug", slug).limit(1);

  if (currentId) {
    query = query.neq("id", currentId);
  }

  const { data, error } = await query;
  handleSupabaseError(error, "Error verificando slug.");

  return (data || []).length === 0;
}

export async function saveForm(payload) {
  assertSupabaseConfig();

  const row = toFormRow(payload);
  const query = payload.id
    ? supabase.from(FORMS_TABLE).update(row).eq("id", payload.id)
    : supabase.from(FORMS_TABLE).insert(row);

  const { data, error } = await query.select().single();

  handleSupabaseError(error, "Error guardando formulario.");
  return normalizeForm(data);
}

export async function updateFormStatus(id, status) {
  assertSupabaseConfig();

  const { data, error } = await supabase
    .from(FORMS_TABLE)
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  handleSupabaseError(error, "Error actualizando estado.");
  return normalizeForm(data);
}

export async function duplicateForm(id) {
  const form = await getFormById(id);

  if (!form) {
    return null;
  }

  const copyTitle = `${form.title} copia`;
  const cleanBase = slugify(`${form.slug || form.title}-copia`) || "formulario-copia";
  let slug = cleanBase;
  let suffix = 2;

  while (!(await isSlugAvailable(slug))) {
    slug = `${cleanBase}-${suffix}`;
    suffix += 1;
  }

  return saveForm({
    title: copyTitle,
    slug,
    description: form.description,
    status: FORM_STATUS.draft,
    surveyJson: JSON.parse(JSON.stringify(form.surveyJson)),
  });
}

export async function deleteForm(id) {
  assertSupabaseConfig();

  const { error: responsesError } = await supabase
    .from(RESPONSES_TABLE)
    .delete()
    .eq("form_id", id);

  handleSupabaseError(responsesError, "Error eliminando respuestas del formulario.");

  const { error } = await supabase.from(FORMS_TABLE).delete().eq("id", id);
  handleSupabaseError(error, "Error eliminando formulario.");
}

export async function getResponses(formId) {
  assertSupabaseConfig();

  let query = supabase
    .from(RESPONSES_TABLE)
    .select("*")
    .order("submitted_at", { ascending: false });

  if (formId) {
    query = query.eq("form_id", formId);
  }

  const { data, error } = await query;
  handleSupabaseError(error, "Error cargando respuestas.");

  return (data || []).map(normalizeResponse);
}

export async function saveResponse(formId, data) {
  assertSupabaseConfig();

  const { data: inserted, error } = await supabase
    .from(RESPONSES_TABLE)
    .insert({
      id: createId(),
      form_id: formId,
      response_json: data,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  handleSupabaseError(error, "Error guardando respuesta.");
  return normalizeResponse(inserted);
}

export async function deleteResponse(responseId) {
  assertSupabaseConfig();

  const { error } = await supabase.from(RESPONSES_TABLE).delete().eq("id", responseId);
  handleSupabaseError(error, "Error eliminando respuesta.");
}

export async function deleteResponsesByForm(formId) {
  assertSupabaseConfig();

  const { error } = await supabase.from(RESPONSES_TABLE).delete().eq("form_id", formId);
  handleSupabaseError(error, "Error eliminando respuestas.");
}

export async function exportBackup() {
  const [forms, responses] = await Promise.all([getForms(), getResponses()]);

  return {
    app: "surveyunefa",
    version: BACKUP_VERSION,
    storage: "supabase",
    exportedAt: new Date().toISOString(),
    forms,
    responses,
  };
}

export async function importBackup(backup) {
  const isValidBackup =
    backup &&
    backup.app === "surveyunefa" &&
    Array.isArray(backup.forms) &&
    Array.isArray(backup.responses);

  if (!isValidBackup) {
    throw new Error("El archivo no parece ser un respaldo valido de SurveyUNEFA.");
  }

  const forms = backup.forms.map((form) => ({
    id: form.id || createId(),
    title: form.title || "Formulario sin titulo",
    slug: slugify(form.slug || form.title || createId()),
    description: form.description || "",
    status: form.status || FORM_STATUS.draft,
    survey_json: form.surveyJson || form.survey_json || {},
    updated_at: form.updatedAt || form.updated_at || new Date().toISOString(),
  }));

  const responses = backup.responses.map((response) => ({
    id: response.id || createId(),
    form_id: response.formId || response.form_id,
    response_json: response.data || response.response_json || {},
    submitted_at: response.submittedAt || response.submitted_at || new Date().toISOString(),
  }));

  const { error: deleteResponsesError } = await supabase
    .from(RESPONSES_TABLE)
    .delete()
    .not("id", "is", null);
  handleSupabaseError(deleteResponsesError, "Error limpiando respuestas actuales.");

  const { error: deleteFormsError } = await supabase
    .from(FORMS_TABLE)
    .delete()
    .not("id", "is", null);
  handleSupabaseError(deleteFormsError, "Error limpiando formularios actuales.");

  if (forms.length > 0) {
    const { error } = await supabase.from(FORMS_TABLE).insert(forms);
    handleSupabaseError(error, "Error importando formularios.");
  }

  if (responses.length > 0) {
    const { error } = await supabase.from(RESPONSES_TABLE).insert(responses);
    handleSupabaseError(error, "Error importando respuestas.");
  }

  return {
    forms: forms.length,
    responses: responses.length,
  };
}
