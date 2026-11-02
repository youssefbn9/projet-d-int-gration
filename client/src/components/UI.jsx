import { X, AlertTriangle, CheckCircle2, Package } from 'lucide-react';

export function Spinner({ text = 'Chargement…' }) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      {text && <span>{text}</span>}
    </div>
  );
}

export function EmptyState({ icon: Icon = Package, text = 'Aucune donnée', sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon-circle">
        <Icon size={30} strokeWidth={1.75} />
      </div>
      <p className="empty-state-text">{text}</p>
      {sub && <p className="empty-state-sub">{sub}</p>}
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  );
}

export function Alert({ type = 'danger', children }) {
  const Icon = type === 'success' ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`alert alert-${type}`}>
      <Icon size={18} strokeWidth={1.75} style={{ flexShrink: 0 }} />
      <div>{children}</div>
    </div>
  );
}

export function Badge({ type = 'muted', children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
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
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Annuler
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Suppression…' : 'Supprimer'}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
