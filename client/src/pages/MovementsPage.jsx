import { useState } from 'react';
import { movementService, productService } from '../services';
import { useFetch } from '../hooks/useFetch';
import { Spinner, EmptyState, Alert, Badge, Modal } from '../components/UI';

const TYPE_LABELS = { entry: 'Entrée', exit: 'Sortie', adjustment: 'Ajustement' };
const TYPE_BADGE  = { entry: 'success', exit: 'danger', adjustment: 'info' };

export default function MovementsPage() {
  const { data: movements, loading, error, refetch } = useFetch(() => movementService.getAll(), []);
  const { data: products } = useFetch(() => productService.getAll(), []);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'entry', quantity: 1, reason: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await movementService.create({
        productId: parseInt(form.productId, 10),
        type: form.type,
        quantity: parseInt(form.quantity, 10),
        reason: form.reason,
      });
      setModal(false);
      setForm({ productId: '', type: 'entry', quantity: 1, reason: '' });
      refetch();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Mouvements de stock</h1>
          <p>Historique et ajustements manuels de stock</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          + Nouveau mouvement
        </button>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Produit</th><th>Type</th><th>Quantité</th><th>Par</th><th>Raison</th></tr>
            </thead>
            <tbody>
              {(movements || []).length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon="🔄" text="Aucun mouvement" /></td></tr>
              ) : (
                (movements || []).map((m) => (
                  <tr key={m.id}>
                    <td className="text-sm">{new Date(m.created_at).toLocaleString('fr-FR')}</td>
                    <td>{m.product_name} <span className="text-muted text-xs">({m.sku})</span></td>
                    <td><Badge type={TYPE_BADGE[m.type]}>{TYPE_LABELS[m.type]}</Badge></td>
                    <td className={m.quantity > 0 ? '' : ''} style={{ color: m.quantity > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </td>
                    <td className="text-sm">{m.first_name} {m.last_name}</td>
                    <td className="text-muted text-sm">{m.reason || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal
          title="Nouveau mouvement"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn btn-primary" form="mov-form" type="submit" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </>
          }
        >
          {formError && <Alert type="danger">{formError}</Alert>}
          <form id="mov-form" onSubmit={handleSubmit} className="flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Produit *</label>
              <select name="productId" className="form-select" value={form.productId} onChange={handleChange} required>
                <option value="">— Sélectionner —</option>
                {(products || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (stock : {p.stock_quantity})</option>
                ))}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select name="type" className="form-select" value={form.type} onChange={handleChange}>
                  <option value="entry">Entrée</option>
                  <option value="exit">Sortie</option>
                  <option value="adjustment">Ajustement</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantité *</label>
                <input name="quantity" type="number" min="1" className="form-input"
                  value={form.quantity} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Raison</label>
              <input name="reason" className="form-input" value={form.reason} onChange={handleChange} />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
