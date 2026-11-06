import { X, AlertTriangle, CheckCircle2, Info, Package } from 'lucide-react';

export function Spinner({ text = 'Chargement…' }) {
  return (
    <div className="loading-container" role="status" aria-live="polite">
      <div className="spinner" />
      {text && <span style={{ fontSize: '13px', fontWeight: 500 }}>{text}</span>}
    </div>
  );
}

export function EmptyState({ icon: Icon = Package, text, sub, title, subtitle, action }) {
  const heading = title || text || 'Aucune donnée';
  const subheading = subtitle || sub;
  return (
    <div className="empty-state">
      <div className="empty-state-icon-circle">
        <Icon size={32} strokeWidth={1.75} />
      </div>
      <p className="empty-state-text">{heading}</p>
      {subheading && <p className="empty-state-sub">{subheading}</p>}
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  );
}

export function Alert({ type = 'danger', children }) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return CheckCircle2;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      case 'danger':
      default:
        return AlertTriangle;
    }
  };

  const Icon = getIcon();

  return (
    <div className={`alert alert-${type}`} role="alert">
      <Icon size={18} strokeWidth={1.75} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export function Badge({ type = 'muted', children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

export function Skeleton({ className = '', style = {}, height, width }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        height: height || undefined,
        width: width || undefined,
        ...style,
      }}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton-text"
          style={{ width: i === lines - 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return <div className="skeleton skeleton-card" />;
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading">
        <div className="modal-header">
          <h2 id="modal-heading" className="modal-title">
            {title}
          </h2>
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
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Suppression…' : 'Supprimer'}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--color-text)', lineHeight: 1.5 }}>{message}</p>
    </Modal>
  );
}
