import { useState } from 'react';
import { saleService, productService } from '../services';
import { useFetch } from '../hooks/useFetch';
import { Spinner, EmptyState, Alert, Badge, Modal } from '../components/UI';

export default function SalesPage() {
  const { data: sales, loading, error, refetch } = useFetch(() => saleService.getAll(), []);
  const { data: products } = useFetch(() => productService.getAll(), []);
  const [saleModal, setSaleModal] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const openDetail = async (id) => {
    setDetailId(id);
    setDetailLoading(true);
    try {
      const res = await saleService.getById(id);
      setDetail(res.data.data);
    } catch { setDetail(null); }
    finally { setDetailLoading(false); }
  };

  const addItem = () => setItems((i) => [...i, { productId: '', quantity: 1 }]);
  const removeItem = (idx) => setItems((i) => i.filter((_, j) => j !== idx));
  const updateItem = (idx, field, value) =>
    setItems((i) => i.map((item, j) => (j === idx ? { ...item, [field]: value } : item)));

  const computeTotal = () =>
    items.reduce((sum, item) => {
      const p = (products || []).find((pr) => pr.id === parseInt(item.productId, 10));
      return sum + (p ? parseFloat(p.unit_price) * parseInt(item.quantity || 0, 10) : 0);
    }, 0);

  const handleCreateSale = async (e) => {
    e.preventDefault();
    setFormError('');
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (!validItems.length) { setFormError('Ajoutez au moins un article'); return; }
    setSaving(true);
    try {
      await saleService.create({
        items: validItems.map((i) => ({ productId: parseInt(i.productId, 10), quantity: parseInt(i.quantity, 10) })),
        note,
      });
      setSaleModal(false);
      setItems([{ productId: '', quantity: 1 }]);
      setNote('');
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
          <h1>Ventes</h1>
          <p>Enregistrez et consultez les transactions</p>
        </div>
        <button className="btn btn-primary" id="btn-new-sale" onClick={() => setSaleModal(true)}>
          + Nouvelle vente
        </button>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Vendeur</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {(sales || []).length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon="🛒" text="Aucune vente" /></td></tr>
              ) : (
                (sales || []).map((s) => (
                  <tr key={s.id}>
                    <td className="text-muted">#{s.id}</td>
                    <td className="text-sm">{new Date(s.created_at).toLocaleString('fr-FR')}</td>
                    <td>{s.first_name} {s.last_name}</td>
                    <td>{s.item_count} article{s.item_count > 1 ? 's' : ''}</td>
                    <td className="font-semibold">{parseFloat(s.total_amount).toFixed(2)} €</td>
                    <td><Badge type="success">Complétée</Badge></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openDetail(s.id)}>
                        👁️ Voir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal nouvelle vente ───────────────────────────────────────── */}
      {saleModal && (
        <Modal
          title="Nouvelle vente"
          onClose={() => setSaleModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setSaleModal(false)}>Annuler</button>
              <button className="btn btn-primary" form="sale-form" type="submit" disabled={saving}>
                {saving ? 'Enregistrement…' : `Enregistrer (${computeTotal().toFixed(2)} €)`}
              </button>
            </>
          }
        >
          {formError && <Alert type="danger">{formError}</Alert>}
          <form id="sale-form" onSubmit={handleCreateSale} className="flex-col gap-4">
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 2 }}>
                  {idx === 0 && <label className="form-label">Produit</label>}
                  <select
                    className="form-select"
                    value={item.productId}
                    onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                    required
                  >
                    <option value="">— Sélectionner —</option>
                    {(products || []).map((p) => (
                      <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                        {p.name} ({p.stock_quantity} en stock) – {parseFloat(p.unit_price).toFixed(2)} €
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  {idx === 0 && <label className="form-label">Quantité</label>}
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    required
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  style={{ marginBottom: 0 }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
              + Ajouter un article
            </button>
            <div className="form-group">
              <label className="form-label">Note (optionnel)</label>
              <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal détail vente ─────────────────────────────────────────── */}
      {detailId && (
        <Modal title={`Vente #${detailId}`} onClose={() => { setDetailId(null); setDetail(null); }}>
          {detailLoading ? <Spinner /> : detail ? (
            <div className="flex-col gap-4">
              <div className="flex-between">
                <span className="text-muted text-sm">
                  {new Date(detail.created_at).toLocaleString('fr-FR')}
                </span>
                <Badge type="success">Complétée</Badge>
              </div>
              <table className="table">
                <thead>
                  <tr><th>Produit</th><th>Qté</th><th>Prix unit.</th><th>Sous-total</th></tr>
                </thead>
                <tbody>
                  {(detail.items || []).map((it) => (
                    <tr key={it.id}>
                      <td>{it.product_name}</td>
                      <td>{it.quantity}</td>
                      <td>{parseFloat(it.unit_price).toFixed(2)} €</td>
                      <td className="font-semibold">{parseFloat(it.subtotal).toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex-between font-bold" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <span>Total</span>
                <span>{parseFloat(detail.total_amount).toFixed(2)} €</span>
              </div>
              {detail.note && <p className="text-muted text-sm">Note : {detail.note}</p>}
            </div>
          ) : <Alert type="danger">Impossible de charger le détail</Alert>}
        </Modal>
      )}
    </div>
  );
}
