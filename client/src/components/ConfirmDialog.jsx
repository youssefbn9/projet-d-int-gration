export default function ConfirmDialog({
  open,
  title = 'Confirmation de suppression',
  message = 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
  onConfirm,
  onCancel,
  confirmText = 'Supprimer',
  cancelText = 'Annuler',
  loading = false,
  danger = true,
}) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="modal confirm-dialog" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            type="button"
            className="btn btn-icon btn-secondary btn-sm"
            onClick={onCancel}
            disabled={loading}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Traitement…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
