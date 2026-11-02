import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShoppingCart, Trash2, User, Eye } from 'lucide-react';
import { salesService, productService, customerService } from '../services';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import FormField from '../components/FormField';
import { Spinner, EmptyState, Alert, Badge, Modal } from '../components/UI';
import { useToast } from '../components/Toast';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function Ventes() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // ── Liste & Filtres ────────────────────────────────────────────────────────
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // ── Modal Nouvelle Vente ───────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Chargement des ventes ──────────────────────────────────────────────────
  const fetchSales = useCallback(
    async (page = 1) => {
      setLoading(true);
      setFetchError('');
      try {
        const params = { page, limit: 15 };
        if (statusFilter) params.status = statusFilter;

        const res = await salesService.getAll(params);
        const data = res.data.data;
        setSales(data.items || []);
        setPagination(data.pagination || { page, limit: 15, total: 0, totalPages: 1 });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Erreur lors du chargement des ventes');
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchSales(1);
  }, [fetchSales]);

  // ── Chargement des clients et produits pour la modale ──────────────────────
  const loadFormData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        customerService.getAll({ limit: 100 }),
        productService.getAll({ limit: 200 }),
      ]);
      setCustomers(custRes.data.data?.items || custRes.data.data || []);
      const prods =
        prodRes.data.data?.items || prodRes.data.data?.products || prodRes.data.data || [];
      setAvailableProducts(prods);
    } catch {
      addToast('Impossible de charger les données pour la vente', 'error');
    }
  };

  const handleOpenModal = () => {
    setSelectedCustomerId('');
    setNote('');
    setItems([{ productId: '', quantity: 1 }]);
    setFormError('');
    setModalOpen(true);
    loadFormData();
  };

  // ── Manipulation des lignes du panier ─────────────────────────────────────
  const addItem = () => setItems((prev) => [...prev, { productId: '', quantity: 1 }]);

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return { ...item, [field]: value };
      })
    );
  };

  // Produits indexés par ID pour calcul rapide
  const productMap = useMemo(() => {
    const map = new Map();
    availableProducts.forEach((p) => map.set(p.id, p));
    return map;
  }, [availableProducts]);

  // Calcul du total en direct et détection d'erreur de stock local
  const { totalAmount, hasStockOverflow } = useMemo(() => {
    let sum = 0;
    let overflow = false;

    items.forEach((item) => {
      const prod = productMap.get(parseInt(item.productId, 10));
      if (prod) {
        const qty = parseInt(item.quantity, 10) || 0;
        sum += (parseFloat(prod.unit_price) || 0) * qty;
        if (qty > prod.stock_quantity) {
          overflow = true;
        }
      }
    });

    return { totalAmount: sum, hasStockOverflow: overflow };
  }, [items, productMap]);

  // ── Validation et Création ─────────────────────────────────────────────────
  const handleSubmitSale = async (e) => {
    e.preventDefault();
    setFormError('');

    const validItems = items.filter((it) => it.productId && parseInt(it.quantity, 10) > 0);
    if (validItems.length === 0) {
      setFormError('Veuillez ajouter au moins un produit avec une quantité valide.');
      return;
    }

    // Vérification locale du stock avant envoi
    for (const it of validItems) {
      const prod = productMap.get(parseInt(it.productId, 10));
      const qty = parseInt(it.quantity, 10);
      if (prod && qty > prod.stock_quantity) {
        setFormError(
          `Quantité demandée (${qty}) supérieure au stock disponible (${prod.stock_quantity}) pour "${prod.name}".`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        customerId: selectedCustomerId ? parseInt(selectedCustomerId, 10) : null,
        note: note.trim() || null,
        items: validItems.map((it) => ({
          productId: parseInt(it.productId, 10),
          quantity: parseInt(it.quantity, 10),
        })),
      };

      const res = await salesService.create(payload);
      addToast('Vente enregistrée avec succès !', 'success');
      setModalOpen(false);
      fetchSales(1);

      // Rediriger vers le détail de la vente créée
      if (res.data?.data?.id) {
        navigate(`/ventes/${res.data.data.id}`);
      }
    } catch (err) {
      const code = err.response?.data?.code || err.response?.data?.error;
      const msg = err.response?.data?.message;

      if (code === 'INSUFFICIENT_STOCK') {
        setFormError(msg || 'Stock insuffisant pour satisfaire cette commande.');
      } else {
        setFormError(msg || 'Une erreur est survenue lors de la création de la vente.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Badge de statut ────────────────────────────────────────────────────────
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <Badge type="success">Payée</Badge>;
      case 'pending':
        return <Badge type="warning">En attente</Badge>;
      case 'cancelled':
        return <Badge type="danger">Annulée</Badge>;
      default:
        return <Badge type="muted">{status}</Badge>;
    }
  };

  // ── Colonnes DataTable ─────────────────────────────────────────────────────
  const columns = [
    {
      key: 'id',
      header: 'N° Vente',
      render: (s) => (
        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>#{s.id}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date & Heure',
      render: (s) => formatDateTime(s.created_at),
    },
    {
      key: 'customer',
      header: 'Client',
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={14} className="text-muted" />
          <span>{s.customer_name || <em className="text-muted">Client comptoir</em>}</span>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Vendeur',
      render: (s) => s.user_name || 'Staff',
    },
    {
      key: 'total_amount',
      header: 'Total',
      style: { textAlign: 'right' },
      render: (s) => (
        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
          {formatCurrency(s.total_amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      style: { textAlign: 'center' },
      render: (s) => renderStatusBadge(s.status),
    },
    {
      key: 'actions',
      header: '',
      style: { textAlign: 'right', width: '50px' },
      render: (s) => (
        <button
          type="button"
          className="btn btn-icon btn-sm"
          title="Voir les détails"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/ventes/${s.id}`);
          }}
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex-col gap-6">
      {/* ── En-tête de la page ──────────────────────────────────────────────── */}
      <div className="page-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)' }}>
            Gestion des Ventes
          </h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>
            Enregistrez les encaissements, suivez les commandes et gérez l'état des transactions.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={18} />
          <span>Nouvelle vente</span>
        </button>
      </div>

      {/* ── Barre de filtres ─────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Filtrer par statut :
            </span>
            <select
              className="form-input form-select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente (pending)</option>
              <option value="paid">Payée (paid)</option>
              <option value="cancelled">Annulée (cancelled)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Tableau des ventes ──────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        {fetchError && (
          <div style={{ padding: '1.5rem' }}>
            <Alert type="danger">{fetchError}</Alert>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '3rem' }}>
            <Spinner text="Chargement des ventes..." />
          </div>
        ) : sales.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            text="Aucune vente trouvée"
            sub="Commencez par créer votre première vente en cliquant sur le bouton ci-dessus."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenModal}>
                <Plus size={16} /> Nouvelle vente
              </button>
            }
          />
        ) : (
          <>
            <div style={{ cursor: 'pointer' }}>
              <DataTable columns={columns} data={sales} keyExtractor={(s) => s.id} />
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalCount={pagination.total}
                pageSize={pagination.limit}
                onPageChange={(p) => fetchSales(p)}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Modal Nouvelle Vente ────────────────────────────────────────────── */}
      {modalOpen && (
        <Modal
          title="Enregistrer une nouvelle vente"
          onClose={() => !saving && setModalOpen(false)}
          footer={
            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitSale}
                disabled={saving || hasStockOverflow || items.every((it) => !it.productId)}
              >
                {saving ? 'Enregistrement...' : `Valider la vente (${formatCurrency(totalAmount)})`}
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmitSale} className="flex-col gap-4">
            {formError && <Alert type="danger">{formError}</Alert>}

            {/* Client & Note */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Client (optionnel)" id="customerId">
                <select
                  className="form-input form-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">Client comptoir (anonyme)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Note / Référence"
                id="saleNote"
                placeholder="Ex: Paiement espèces, table 4..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <hr
              style={{
                border: 'none',
                borderTop: '1px solid var(--color-border)',
                margin: '0.5rem 0',
              }}
            />

            {/* Articles de la vente */}
            <div>
              <div className="flex-between" style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                  Articles de la commande
                </span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
                  <Plus size={14} /> Ajouter un produit
                </button>
              </div>

              <div className="flex-col gap-3">
                {items.map((item, idx) => {
                  const selectedProd = productMap.get(parseInt(item.productId, 10));
                  const isStockInsufficient =
                    selectedProd && parseInt(item.quantity, 10) > selectedProd.stock_quantity;
                  const lineSubtotal = selectedProd
                    ? (parseFloat(selectedProd.unit_price) || 0) *
                      (parseInt(item.quantity, 10) || 0)
                    : 0;

                  return (
                    <div
                      key={idx}
                      className="card"
                      style={{
                        padding: '10px 14px',
                        backgroundColor: isStockInsufficient ? '#fff5f5' : 'var(--color-bg-alt)',
                        borderColor: isStockInsufficient ? '#feb2b2' : 'var(--color-border)',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 110px 110px 40px',
                          gap: '10px',
                          alignItems: 'center',
                        }}
                      >
                        {/* Sélecteur de produit */}
                        <div>
                          <select
                            className="form-input form-select"
                            value={item.productId}
                            onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                            required
                          >
                            <option value="">Sélectionner un produit...</option>
                            {availableProducts.map((p) => (
                              <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                                {p.name} ({p.sku}) — {formatCurrency(p.unit_price)} [Stock:{' '}
                                {p.stock_quantity}]
                              </option>
                            ))}
                          </select>
                          {selectedProd && (
                            <div
                              style={{
                                fontSize: '11px',
                                marginTop: '3px',
                                color: isStockInsufficient
                                  ? 'var(--color-danger)'
                                  : 'var(--color-text-muted)',
                              }}
                            >
                              Stock dispo : <strong>{selectedProd.stock_quantity}</strong>
                              {isStockInsufficient &&
                                ' ⚠️ Quantité demandée supérieure au stock disponible !'}
                            </div>
                          )}
                        </div>

                        {/* Quantité */}
                        <div>
                          <input
                            type="number"
                            min="1"
                            max={selectedProd ? selectedProd.stock_quantity : undefined}
                            className={`form-input ${isStockInsufficient ? 'input-error' : ''}`}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                'quantity',
                                Math.max(1, parseInt(e.target.value, 10) || 1)
                              )
                            }
                            disabled={!item.productId}
                            required
                          />
                        </div>

                        {/* Sous-total */}
                        <div style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(lineSubtotal)}
                        </div>

                        {/* Supprimer ligne */}
                        <div style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-icon btn-sm text-danger"
                            onClick={() => removeItem(idx)}
                            disabled={items.length <= 1}
                            title="Retirer la ligne"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total général en direct */}
            <div
              className="card"
              style={{
                marginTop: '10px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--color-primary-light, #fff8f3)',
                borderColor: 'var(--color-primary)',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
                Montant total de la commande :
              </span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
