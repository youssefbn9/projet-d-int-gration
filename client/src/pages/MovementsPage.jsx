import { useState } from 'react';
import { movementService, productService } from '../services';
import { useFetch } from '../hooks/useFetch';
import { Spinner, EmptyState, Alert, Badge, Modal } from '../components/UI';
import { formatDateTime } from '../utils/format';
import { Plus, History } from 'lucide-react';

const TYPE_LABELS = {
  in: 'Entrée',
  entry: 'Entrée',
  out: 'Sortie',
  exit: 'Sortie',
  adjustment: 'Ajustement',
};
const TYPE_BADGE = {
  in: 'success',
  entry: 'success',
  out: 'danger',
  exit: 'danger',
  adjustment: 'info',
};

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
    <div className="flex-col gap-6">
      <div className="page-header flex-between">
        <div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--color-text)',
              letterSpacing: '-0.02em',
            }}
          >
            Mouvements de Stock
          </h2>
          <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>
            Traçabilité des entrées, sorties et ajustements d'inventaire
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} strokeWidth={2} />
          Nouveau mouvement
        </button>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>PRODUIT</th>
              <th>TYPE</th>
              <th className="text-right">QUANTITÉ</th>
              <th>OPÉRATEUR</th>
              <th>MOTIF</th>
            </tr>
          </thead>
          <tbody>
            {(movements || []).length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={History}
                    text="Aucun mouvement de stock"
                    sub="Les variations de stock manuelles ou par vente apparaîtront ici."
                  />
                </td>
              </tr>
            ) : (
              (movements || []).map((m) => (
                <tr key={m.id}>
                  <td>{formatDateTime(m.created_at)}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{m.product_name}</span>{' '}
                    <span className="text-muted text-xs">({m.sku})</span>
                  </td>
                  <td>
                    <Badge type={TYPE_BADGE[m.type] || 'muted'}>
                      {TYPE_LABELS[m.type] || m.type}
                    </Badge>
                  </td>
                  <td
                    className="text-right"
                    style={{
                      fontWeight: 700,
                      color:
                        m.quantity > 0 || m.type === 'entry' || m.type === 'in'
                          ? 'var(--color-success)'
                          : 'var(--color-danger)',
                    }}
                  >
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td>
                    {m.first_name} {m.last_name}
                  </td>
                  <td className="text-muted text-sm">{m.reason || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title="Nouveau mouvement de stock"
          onClose={() => setModal(false)}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>
                Annuler
              </button>
              <button className="btn btn-primary" form="mov-form" type="submit" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Valider le mouvement'}
              </button>
            </>
          }
        >
          {formError && <Alert type="danger">{formError}</Alert>}
          <form id="mov-form" onSubmit={handleSubmit} className="flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Produit concerné *</label>
              <select
                name="productId"
                className="form-select"
                value={form.productId}
                onChange={handleChange}
                required
              >
                <option value="">— Sélectionner un article —</option>
                {(products || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (stock actuel : {p.stock_quantity})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Type d'opération *</label>
                <select
                  name="type"
                  className="form-select"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="entry">Entrée en stock (+)</option>
                  <option value="exit">Sortie manuelle (-)</option>
                  <option value="adjustment">Ajustement inventaire</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantité *</label>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  className="form-input"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Motif ou justification</label>
              <input
                name="reason"
                className="form-input"
                placeholder="Ex: Réception commande fournisseur, casse, inventaire…"
                value={form.reason}
                onChange={handleChange}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
