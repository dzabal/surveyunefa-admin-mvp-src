import { Link } from "react-router-dom";
import { useMemo, useRef, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import ConfirmDialog from "../components/ConfirmDialog";
import FormActions from "../components/FormActions";
import {
  deleteForm,
  duplicateForm,
  exportLocalBackup,
  FORM_STATUS,
  getForms,
  getResponses,
  importLocalBackup,
  STATUS_OPTIONS,
  STATUS_LABELS,
  updateFormStatus,
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

function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const backupInputRef = useRef(null);
  const forms = getForms();
  const visibleForms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return forms.filter((form) => {
      const matchesStatus =
        statusFilter === "all" ? true : form.status === statusFilter;
      const matchesQuery = normalizedQuery
        ? [form.title, form.slug, form.description]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedQuery))
        : true;

      return matchesStatus && matchesQuery;
    });
  }, [forms, query, statusFilter, refreshKey]);

  const statusCounts = forms.reduce(
    (counts, form) => ({
      ...counts,
      [form.status]: (counts[form.status] || 0) + 1,
    }),
    {},
  );

  const refresh = () => setRefreshKey((current) => current + 1);

  const changeStatus = (form, status) => {
    const nextForm = updateFormStatus(form.id, status);
    if (nextForm) {
      setNotice(`"${nextForm.title}" ahora esta ${STATUS_LABELS[nextForm.status].toLowerCase()}.`);
      refresh();
    }
  };

  const cloneForm = (form) => {
    const duplicated = duplicateForm(form.id);

    if (duplicated) {
      setNotice(`Se creo una copia en borrador: "${duplicated.title}".`);
      refresh();
    }
  };

  const requestArchive = (form) => {
    setPendingAction({
      type: "archive",
      form,
      title: "Archivar formulario",
      message: `"${form.title}" dejara de estar disponible publicamente, pero se conservara con sus respuestas.`,
      confirmLabel: "Archivar",
      danger: true,
    });
  };

  const requestDelete = (form) => {
    setPendingAction({
      type: "delete",
      form,
      title: "Eliminar formulario",
      message: `"${form.title}" y sus respuestas locales se eliminaran definitivamente. Esta accion no se puede deshacer.`,
      confirmLabel: "Eliminar",
      danger: true,
    });
  };

  const confirmPendingAction = () => {
    if (!pendingAction) {
      return;
    }

    const { type, form } = pendingAction;

    if (type === "archive") {
      changeStatus(form, FORM_STATUS.archived);
    }

    if (type === "delete") {
      deleteForm(form.id);
      setNotice(`Formulario "${form.title}" eliminado.`);
      refresh();
    }

    setPendingAction(null);
  };

  const copyPublicLink = async (form) => {
    const publicUrl = `${window.location.origin}/f/${form.slug}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setNotice(`Link publico copiado: /f/${form.slug}`);
    } catch {
      setNotice(`No se pudo copiar automaticamente. Link: ${publicUrl}`);
    }
  };

  const exportBackup = () => {
    const backup = exportLocalBackup();
    const date = new Date().toISOString().slice(0, 10);

    downloadFile(
      `surveyunefa-respaldo-${date}.json`,
      JSON.stringify(backup, null, 2),
      "application/json",
    );
    setNotice("Respaldo local exportado.");
  };

  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setPendingAction({
      type: "import",
      file,
      title: "Importar respaldo",
      message:
        "Este respaldo reemplazara los formularios y respuestas locales actuales.",
      confirmLabel: "Importar",
      danger: true,
    });
  };

  const confirmImportBackup = async (file) => {
    try {
      const content = await file.text();
      const result = importLocalBackup(JSON.parse(content));
      setNotice(
        `Respaldo importado: ${result.forms} formulario${result.forms === 1 ? "" : "s"} y ${result.responses} respuesta${result.responses === 1 ? "" : "s"}.`,
      );
      refresh();
    } catch (error) {
      setNotice(error.message || "No se pudo importar el respaldo.");
    } finally {
      setPendingAction(null);
    }
  };

  const confirmDialogAction = () => {
    if (pendingAction?.type === "import") {
      confirmImportBackup(pendingAction.file);
      return;
    }

    confirmPendingAction();
  };

  return (
    <AdminLayout
      title="Formularios"
      eyebrow={`${forms.length} formulario${forms.length === 1 ? "" : "s"}`}
      actions={
        <div className="actions-row">
          <button className="button secondary" type="button" onClick={exportBackup}>
            Exportar respaldo
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => backupInputRef.current?.click()}
          >
            Importar respaldo
          </button>
          <input
            ref={backupInputRef}
            className="sr-only"
            type="file"
            accept="application/json"
            onChange={importBackup}
          />
          <Link className="button primary" to="/admin/forms/new">
            Nuevo formulario
          </Link>
        </div>
      }
    >
      {forms.length > 0 ? (
        <section className="toolbar-panel">
          <div className="filter-grid">
            <label>
              Buscar
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre, slug o descripcion"
              />
            </label>

            <label>
              Estado
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="summary-grid">
            <span>Total: {forms.length}</span>
            <span>Publicados: {statusCounts.published || 0}</span>
            <span>Borradores: {statusCounts.draft || 0}</span>
            <span>Archivados: {statusCounts.archived || 0}</span>
          </div>

          {notice ? <p className="form-message success">{notice}</p> : null}
        </section>
      ) : null}

      {forms.length === 0 ? (
        <section className="empty-state">
          <h2>No hay formularios todavia</h2>
          <p>
            Importa el JSON generado por SurveyJS Creator Online para comenzar a
            administrarlo localmente.
          </p>
          <Link className="button primary" to="/admin/forms/new">
            Importar JSON
          </Link>
        </section>
      ) : visibleForms.length === 0 ? (
        <section className="empty-state">
          <h2>No encontramos formularios con esos filtros</h2>
          <p>Ajusta la busqueda o cambia el estado seleccionado.</p>
        </section>
      ) : (
        <section className="table-panel">
          <table>
            <thead>
              <tr>
                <th>Formulario</th>
                <th>Estado</th>
                <th>Respuestas</th>
                <th>Actualizado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {visibleForms.map((form) => {
                const responses = getResponses(form.id);

                return (
                  <tr key={form.id}>
                    <td>
                      <strong>{form.title}</strong>
                      <span className="muted">/f/{form.slug}</span>
                      {form.description ? (
                        <span className="table-description">{form.description}</span>
                      ) : null}
                    </td>
                    <td>
                      <span className={`status ${form.status}`}>
                        {STATUS_LABELS[form.status]}
                      </span>
                    </td>
                    <td>{responses.length}</td>
                    <td>{new Date(form.updatedAt).toLocaleString()}</td>
                    <td>
                      <FormActions
                        form={form}
                        onArchive={requestArchive}
                        onCopyLink={copyPublicLink}
                        onDelete={requestDelete}
                        onDuplicate={cloneForm}
                        onPublish={(targetForm) =>
                          changeStatus(targetForm, FORM_STATUS.published)
                        }
                        onUnpublish={(targetForm) =>
                          changeStatus(targetForm, FORM_STATUS.draft)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.title}
        message={pendingAction?.message}
        confirmLabel={pendingAction?.confirmLabel}
        danger={pendingAction?.danger}
        onConfirm={confirmDialogAction}
        onCancel={() => setPendingAction(null)}
      />
    </AdminLayout>
  );
}

export default Dashboard;
