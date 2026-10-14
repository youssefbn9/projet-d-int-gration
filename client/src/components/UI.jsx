export function Spinner() {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <span>Chargement…</span>
    </div>
  );
}

export function EmptyState({ icon = '📭', text = 'Aucune donnée', sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-text">{text}</p>
      {sub && <p className="empty-state-sub">{sub}</p>}
      {action && <div style={{ marginTop: '1.5rem' }}>{action}</div>}
    </div>
  );
}

export function Alert({ type = 'danger', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}

export function Badge({ type = 'muted', children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-icon btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ message, onConfirm, onCancel, loading }) {
  return (
    <Modal
      title="Confirmation"
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Annuler</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Suppression…' : 'Supprimer'}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
