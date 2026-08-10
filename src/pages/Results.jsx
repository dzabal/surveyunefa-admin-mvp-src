import { Link, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { deleteResponse, getFormById, getResponses } from "../services/surveyStore";

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

function Results() {
  const { id } = useParams();
  const form = getFormById(id);
  const responses = form ? getResponses(form.id) : [];
  const columns = Array.from(
    responses.reduce((set, response) => {
      Object.keys(response.data || {}).forEach((key) => set.add(key));
      return set;
    }, new Set()),
  );

  const exportJson = () => {
    downloadFile(
      `${form.slug}-respuestas.json`,
      JSON.stringify(responses, null, 2),
      "application/json",
    );
  };

  const exportCsv = () => {
    const header = ["submittedAt", ...columns];
    const rows = responses.map((response) =>
      header
        .map((column) =>
          escapeCsv(
            column === "submittedAt"
              ? response.submittedAt
              : JSON.stringify(response.data?.[column] ?? ""),
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
          <button
            className="button secondary"
            type="button"
            onClick={exportCsv}
            disabled={responses.length === 0}
          >
            Exportar CSV
          </button>
          <button
            className="button primary"
            type="button"
            onClick={exportJson}
            disabled={responses.length === 0}
          >
            Exportar JSON
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
        <section className="table-panel">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((response) => (
                <tr key={response.id}>
                  <td>{new Date(response.submittedAt).toLocaleString()}</td>
                  {columns.map((column) => (
                    <td key={column}>
                      {formatValue(response.data?.[column])}
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
    </AdminLayout>
  );
}

export default Results;
