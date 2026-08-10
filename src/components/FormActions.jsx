import { Link } from "react-router-dom";
import { FORM_STATUS } from "../services/surveyStore";

function FormActions({
  form,
  onArchive,
  onCopyLink,
  onDelete,
  onDuplicate,
  onPublish,
  onUnpublish,
  permissions,
}) {
  const isPublished = form.status === FORM_STATUS.published;
  const isArchived = form.status === FORM_STATUS.archived;
  const canEdit = permissions?.canManageForms;
  const canPublish = permissions?.canPublishForms;
  const canDelete = permissions?.canDeleteData;

  return (
    <div className="action-cluster" aria-label={`Acciones para ${form.title}`}>
      <Link className="button secondary compact" to={`/admin/forms/${form.id}/overview`}>
        Resumen
      </Link>
      {canEdit ? (
        <Link className="button secondary compact" to={`/admin/forms/${form.id}`}>
          Editar
        </Link>
      ) : null}
      <Link className="button secondary compact" to={`/admin/forms/${form.id}/preview`}>
        Preview
      </Link>
      <Link className="button secondary compact" to={`/admin/forms/${form.id}/responses`}>
        Respuestas
      </Link>

      <div className="more-actions">
        <button className="button secondary compact" type="button">
          Mas
        </button>
        <div className="more-actions-menu">
          {isPublished ? (
            <button type="button" onClick={() => onUnpublish(form)} disabled={!canPublish}>
              Despublicar
            </button>
          ) : (
            <button type="button" onClick={() => onPublish(form)} disabled={isArchived || !canPublish}>
              Publicar
            </button>
          )}
          <button type="button" onClick={() => onCopyLink(form)} disabled={!isPublished}>
            Copiar link publico
          </button>
          <button type="button" onClick={() => onDuplicate(form)} disabled={!canEdit}>
            Duplicar
          </button>
          {isArchived ? (
            <button className="danger" type="button" onClick={() => onDelete(form)} disabled={!canDelete}>
              Eliminar definitivo
            </button>
          ) : (
            <button className="danger" type="button" onClick={() => onArchive(form)} disabled={!canDelete}>
              Archivar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FormActions;
