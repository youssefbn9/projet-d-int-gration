import { useState } from 'react';
import { Link } from 'react-router-dom';
import { saleService, productService } from '../services';
import { useFetch } from '../hooks/useFetch';
import { Spinner, EmptyState, Alert, Badge, Modal } from '../components/UI';
import { formatCurrency, formatDateTime } from '../utils/format';
import { Plus, Eye, Trash2, ShoppingCart } from 'lucide-react';

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
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
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
    if (!validItems.length) {
      setFormError('Ajoutez au moins un article valide');
      return;
    }
    setSaving(true);
    try {
      await saleService.create({
        items: validItems.map((i) => ({
          productId: parseInt(i.productId, 10),
          quantity: parseInt(i.quantity, 10),
        })),
        note,
      });
      setSaleModal(false);
      setItems([{ productId: '', quantity: 1 }]);
      setNote('');
      refetch();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setSaving(false);
    }
  };

  const getSaleBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <Badge type="success">Payée</Badge>;
      case 'pending':
        return <Badge type="warning">En attente</Badge>;
      case 'cancelled':
        return <Badge type="danger">Annulée</Badge>;
      default:
        return <Badge type="success">Payée</Badge>;
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
            Gestion des Ventes
          </h2>
          <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>
            Historique des encaissements et enregistrement des nouvelles transactions
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          id="btn-new-sale"
          onClick={() => setSaleModal(true)}
        >
          <Plus size={16} strokeWidth={2} />
          Nouvelle vente
        </button>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>DATE ET HEURE</th>
              <th>VENDEUR</th>
              <th>ARTICLES</th>
              <th className="text-right">TOTAL TTC</th>
              <th>STATUT</th>
              <th className="text-right">DÉTAIL</th>
            </tr>
          </thead>
          <tbody>
            {(sales || []).length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={ShoppingCart}
                    text="Aucune vente enregistrée"
                    sub="Cliquez sur 'Nouvelle vente' pour enregistrer votre premier encaissement."
                  />
                </td>
              </tr>
            ) : (
              (sales || []).map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="text-muted text-xs font-semibold">#{s.id}</span>
                  </td>
                  <td>{formatDateTime(s.created_at)}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>
                      {s.first_name} {s.last_name}
                    </span>
                  </td>
                  <td>
                    {s.item_count} article{s.item_count > 1 ? 's' : ''}
                  </td>
                  <td
                    className="text-right"
                    style={{ fontWeight: 700, color: 'var(--color-primary)' }}
                  >
                    {formatCurrency(s.total_amount)}
                  </td>
                  <td>{getSaleBadge(s.status)}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => openDetail(s.id)}
                      title="Consulter le détail"
                      aria-label={`Détail de la vente #${s.id}`}
                    >
                      <Eye size={16} strokeWidth={1.75} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal nouvelle vente ───────────────────────────────────────── */}
      {saleModal && (
        <Modal
          title="Nouvel encaissement"
          onClose={() => setSaleModal(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSaleModal(false)}
              >
                Annuler
              </button>
              <button className="btn btn-primary" form="sale-form" type="submit" disabled={saving}>
                {saving ? 'Traitement…' : `Valider la vente (${formatCurrency(computeTotal())})`}
              </button>
            </>
          }
        >
          {formError && <Alert type="danger">{formError}</Alert>}
          <form id="sale-form" onSubmit={handleCreateSale} className="flex-col gap-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 1.5fr auto',
                  gap: '10px',
                  alignItems: 'flex-end',
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  {idx === 0 && <label className="form-label">Article / Produit</label>}
                  <select
                    className="form-select"
                    value={item.productId}
                    onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                    required
                  >
                    <option value="">— Sélectionner —</option>
                    {(products || []).map((p) => (
                      <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                        {p.name} ({p.stock_quantity} dispo) – {formatCurrency(p.unit_price)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
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
                  className="btn btn-icon"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  aria-label="Supprimer la ligne"
                  style={{ color: 'var(--color-danger)' }}
                >
                  <Trash2 size={16} strokeWidth={1.75} />
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addItem}
              style={{ alignSelf: 'flex-start', marginTop: '6px' }}
            >
              <Plus size={14} strokeWidth={2} />
              Ajouter une ligne
            </button>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label className="form-label">Note interne (optionnel)</label>
              <input
                className="form-input"
                placeholder="Ex: Paiement espèces, remise accordée…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal Détail Vente ─────────────────────────────────────────── */}
      {detailId && (
        <Modal
          title={`Récapitulatif de la vente #${detailId}`}
          onClose={() => setDetailId(null)}
          footer={
            <div className="flex-between" style={{ width: '100%' }}>
              <Link to={`/ventes/${detailId}`} className="btn btn-secondary btn-sm">
                Consulter la facture complète →
              </Link>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setDetailId(null)}
              >
                Fermer
              </button>
            </div>
          }
        >
          {detailLoading ? (
            <Spinner text="Chargement du récapitulatif…" />
          ) : detail ? (
            <div className="flex-col gap-4">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  padding: '14px',
                  background: 'var(--color-surface-subtle)',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span className="text-muted">Date :</span>{' '}
                  <span style={{ fontWeight: 600 }}>{formatDateTime(detail.created_at)}</span>
                </div>
                <div>
                  <span className="text-muted">Vendeur :</span>{' '}
                  <span style={{ fontWeight: 600 }}>
                    {detail.first_name} {detail.last_name}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Statut :</span> {getSaleBadge(detail.status)}
                </div>
                {detail.note && (
                  <div>
                    <span className="text-muted">Note :</span> <span>{detail.note}</span>
                  </div>
                )}
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ARTICLE</th>
                      <th className="text-right">QTÉ</th>
                      <th className="text-right">PRIX UNIT.</th>
                      <th className="text-right">SOUS-TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.items || []).map((it) => (
                      <tr key={it.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{it.product_name}</div>
                          <div className="text-muted text-xs">SKU: {it.sku}</div>
                        </td>
                        <td className="text-right">{it.quantity}</td>
                        <td className="text-right">{formatCurrency(it.unit_price)}</td>
                        <td className="text-right" style={{ fontWeight: 600 }}>
                          {formatCurrency(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--color-primary-light)' }}>
                      <td colSpan={3} style={{ fontWeight: 700, fontSize: '15px' }}>
                        Montant Total TTC
                      </td>
                      <td
                        className="text-right"
                        style={{
                          fontWeight: 800,
                          fontSize: '16px',
                          color: 'var(--color-primary)',
                        }}
                      >
                        {formatCurrency(detail.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <Alert type="danger">Impossible de charger cette vente.</Alert>
          )}
        </Modal>
      )}
    </div>
  );
}
