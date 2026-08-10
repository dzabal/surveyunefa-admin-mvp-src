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

export function createId() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function slugify(value = "") {
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

  const pageQuestions = (surveyJson?.pages || []).reduce(
    (count, page) => count + visitElements(page.elements),
    0,
  );

  return pageQuestions + visitElements(surveyJson?.elements);
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
