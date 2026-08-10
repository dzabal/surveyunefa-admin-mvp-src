import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../auth/AuthProvider";
import { canDeleteData } from "../auth/roles";
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
  const { profile } = useAuth();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState("");

  const loadResults = async () => {
    setLoading(true);
    setError("");

    try {
      const loadedForm = await getFormById(id);
      setForm(loadedForm);
      setResponses(loadedForm ? await getResponses(loadedForm.id) : []);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar las respuestas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [id]);

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
  const canDeleteResponses = canDeleteData(profile);

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
    setPendingAction({
      type: "single",
      responseId,
      title: "Eliminar respuesta",
      message: "Esta respuesta se eliminara definitivamente en Supabase.",
      confirmLabel: "Eliminar",
    });
  };

  const removeAllResponses = () => {
    setPendingAction({
      type: "all",
      title: "Borrar respuestas",
      message: `Se eliminaran las ${responses.length} respuestas de "${form.title}". Esta accion no se puede deshacer.`,
      confirmLabel: "Borrar respuestas",
    });
  };

  const confirmPendingAction = async () => {
    try {
      if (pendingAction?.type === "single") {
        await deleteResponse(pendingAction.responseId);
      }

      if (pendingAction?.type === "all") {
        await deleteResponsesByForm(form.id);
      }

      setPendingAction(null);
      await loadResults();
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo eliminar la respuesta.");
      setPendingAction(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Respuestas" eyebrow="Cargando datos">
        <section className="empty-state">
          <h2>Cargando respuestas</h2>
          <p>Consultando Supabase.</p>
        </section>
      </AdminLayout>
    );
  }

  if (!form) {
    return (
      <AdminLayout title="Respuestas" eyebrow="Formulario no encontrado">
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
            disabled={responses.length === 0 || !canDeleteResponses}
          >
            Borrar respuestas
          </button>
        </div>
      }
    >
      {error ? <p className="form-message error">{error}</p> : null}

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
                          {canDeleteResponses ? (
                            <button
                              className="link-button danger"
                              type="button"
                              onClick={() => removeResponse(response.id)}
                            >
                              Eliminar
                            </button>
                          ) : null}
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

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.title}
        message={pendingAction?.message}
        confirmLabel={pendingAction?.confirmLabel}
        danger
        onConfirm={confirmPendingAction}
        onCancel={() => setPendingAction(null)}
      />
    </AdminLayout>
  );
}

export default Results;
