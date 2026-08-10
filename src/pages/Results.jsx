import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  deleteResponse,
  deleteResponsesByForm,
  getFormById,
  getResponses,
  getSurveyFields,
} from "../services/surveyStore";

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function formatValue(value) {
  if (value == null || value === "") {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function buildColumns(form, responses) {
  const fields = getSurveyFields(form.surveyJson);
  const fieldColumns = fields.map((field) => ({
    key: field.name,
    label: field.title || field.name,
  }));
  const knownKeys = new Set(fieldColumns.map((column) => column.key));
  const responseKeys = Array.from(
    responses.reduce((set, response) => {
      Object.keys(response.data || {}).forEach((key) => set.add(key));
      return set;
    }, new Set()),
  );
  const extraColumns = responseKeys
    .filter((key) => !knownKeys.has(key))
    .map((key) => ({ key, label: key }));

  return [...fieldColumns, ...extraColumns];
}

function Results() {
  const { id } = useParams();
  const [query, setQuery] = useState("");
  const form = getFormById(id);
  const responses = form ? getResponses(form.id) : [];
  const columns = form ? buildColumns(form, responses) : [];
  const filteredResponses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return responses;
    }

    return responses.filter((response) =>
      [
        response.submittedAt,
        ...Object.values(response.data || {}).map((value) => formatValue(value)),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, responses]);
  const latestResponse = responses[0];

  const exportJson = () => {
    downloadFile(
      `${form.slug}-respuestas.json`,
      JSON.stringify(filteredResponses, null, 2),
      "application/json",
    );
  };

  const exportCsv = () => {
    const header = ["submittedAt", ...columns.map((column) => column.key)];
    const rows = filteredResponses.map((response) =>
      header
        .map((column) =>
          escapeCsv(
            column === "submittedAt"
              ? response.submittedAt
              : formatValue(response.data?.[column]),
          ),
        )
        .join(","),
    );

    downloadFile(
      `${form.slug}-respuestas.csv`,
      [header.join(","), ...rows].join("\n"),
      "text/csv;charset=utf-8",
    );
  };

  const removeResponse = (responseId) => {
    if (window.confirm("¿Eliminar esta respuesta local?")) {
      deleteResponse(responseId);
      window.location.reload();
    }
  };

  const removeAllResponses = () => {
    if (
      window.confirm(
        `¿Eliminar las ${responses.length} respuestas locales de "${form.title}"? Esta accion no se puede deshacer.`,
      )
    ) {
      deleteResponsesByForm(form.id);
      window.location.reload();
    }
  };

  if (!form) {
    return (
      <AdminLayout title="Respuestas" eyebrow="Formulario no encontrado">
        <section className="empty-state">
          <h2>No encontramos ese formulario</h2>
          <Link className="button primary" to="/admin/forms">
            Volver al dashboard
          </Link>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`Respuestas: ${form.title}`}
      eyebrow={`${responses.length} respuesta${responses.length === 1 ? "" : "s"}`}
      actions={
        <div className="actions-row">
          <Link className="button secondary" to="/admin/forms">
            Volver
          </Link>
          <Link className="button secondary" to={`/admin/forms/${form.id}/overview`}>
            Resumen
          </Link>
          <button
            className="button secondary"
            type="button"
            onClick={exportCsv}
            disabled={filteredResponses.length === 0}
          >
            Exportar CSV
          </button>
          <button
            className="button primary"
            type="button"
            onClick={exportJson}
            disabled={filteredResponses.length === 0}
          >
            Exportar JSON
          </button>
          <button
            className="button danger"
            type="button"
            onClick={removeAllResponses}
            disabled={responses.length === 0}
          >
            Borrar respuestas
          </button>
        </div>
      }
    >
      {responses.length === 0 ? (
        <section className="empty-state">
          <h2>Sin respuestas todavia</h2>
          <p>Comparte el enlace publico cuando el formulario este publicado.</p>
        </section>
      ) : (
        <>
          <section className="toolbar-panel">
            <div className="overview-grid compact">
              <article className="metric-card">
                <span>Total</span>
                <strong>{responses.length}</strong>
              </article>
              <article className="metric-card">
                <span>Filtradas</span>
                <strong>{filteredResponses.length}</strong>
              </article>
              <article className="metric-card">
                <span>Columnas</span>
                <strong>{columns.length}</strong>
              </article>
              <article className="metric-card">
                <span>Ultima respuesta</span>
                <strong>
                  {latestResponse
                    ? new Date(latestResponse.submittedAt).toLocaleString()
                    : "Sin datos"}
                </strong>
              </article>
            </div>

            <label className="search-field">
              Buscar respuestas
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Fecha, texto o valor respondido"
              />
            </label>
          </section>

          {filteredResponses.length === 0 ? (
            <section className="empty-state">
              <h2>No hay respuestas con esa busqueda</h2>
              <p>Limpia el filtro para volver a ver todas las respuestas.</p>
            </section>
          ) : (
            <section className="table-panel">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    {columns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResponses.map((response) => (
                    <tr key={response.id}>
                      <td>{new Date(response.submittedAt).toLocaleString()}</td>
                      {columns.map((column) => (
                        <td key={column.key}>
                          {formatValue(response.data?.[column.key])}
                        </td>
                      ))}
                      <td>
                        <div className="row-actions">
                          <details>
                            <summary>Ver JSON</summary>
                            <pre className="response-json">
                              {JSON.stringify(response.data, null, 2)}
                            </pre>
                          </details>
                          <button
                            className="link-button danger"
                            type="button"
                            onClick={() => removeResponse(response.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </AdminLayout>
  );
}

export default Results;
