import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ShoppingCart,
  Trash2,
  User,
  Eye,
  Search,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';
import { salesService, productService, customerService } from '../services';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import FormField from '../components/FormField';
import { Spinner, EmptyState, Alert, Badge, Modal } from '../components/UI';
import { useToast } from '../components/Toast';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function Ventes() {
  const navigate = useNavigate();
  const toast = useToast();

  // ── Liste & Filtres ────────────────────────────────────────────────────────
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // ── Modal Nouvelle Vente (POS 2 colonnes) ──────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([]);
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
      toast.error('Impossible de charger les données pour la vente');
    }
  };

  const handleOpenModal = () => {
    setSelectedCustomerId('');
    setNote('');
    setItems([]);
    setProductSearch('');
    setFormError('');
    setModalOpen(true);
    loadFormData();
  };

  // Produits filtrés par recherche dans le panneau gauche du POS
  const filteredAvailableProducts = useMemo(() => {
    if (!productSearch.trim()) return availableProducts;
    const term = productSearch.toLowerCase();
    return availableProducts.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.sku && p.sku.toLowerCase().includes(term))
    );
  }, [availableProducts, productSearch]);

  // Produits indexés par ID pour calcul rapide
  const productMap = useMemo(() => {
    const map = new Map();
    availableProducts.forEach((p) => map.set(p.id, p));
    return map;
  }, [availableProducts]);

  // Manipulation du panier
  const handleSelectProduct = (prod) => {
    if (prod.stock_quantity <= 0) return;

    setItems((prev) => {
      const existingIdx = prev.findIndex((it) => parseInt(it.productId, 10) === prod.id);
      if (existingIdx >= 0) {
        const currentQty = parseInt(prev[existingIdx].quantity, 10) || 0;
        if (currentQty >= prod.stock_quantity) {
          return prev;
        }
        return prev.map((it, i) =>
          i === existingIdx ? { ...it, quantity: currentQty + 1 } : it
        );
      } else {
        return [...prev, { productId: String(prod.id), quantity: 1 }];
      }
    });
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemQty = (index, qty) => {
    const newQty = Math.max(1, parseInt(qty, 10) || 1);
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, quantity: newQty } : it))
    );
  };

  // Calcul du montant total et vérification de dépassement de stock
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
      setFormError('Veuillez sélectionner au moins un produit à encaisser.');
      return;
    }

    // Vérification du stock avant envoi
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
      toast.success('Vente enregistrée avec succès !');
      setModalOpen(false);
      fetchSales(1);

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
      header: 'N° VENTE',
      render: (s) => (
        <span className="font-semibold text-primary tabular-nums">#{s.id}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'DATE & HEURE',
      render: (s) => (
        <span className="text-sm text-muted">{formatDateTime(s.created_at)}</span>
      ),
    },
    {
      key: 'customer',
      header: 'CLIENT',
      render: (s) => (
        <div className="flex-gap-2">
          <User size={14} className="text-muted" />
          <span className="text-sm font-semibold">
            {s.customer_name || <em className="text-muted">Client comptoir</em>}
          </span>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'VENDEUR',
      render: (s) => <span className="text-sm">{s.user_name || 'Personnel'}</span>,
    },
    {
      key: 'total_amount',
      header: 'TOTAL',
      className: 'text-right',
      render: (s) => (
        <span className="font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>
          {formatCurrency(s.total_amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUT',
      className: 'text-center',
      render: (s) => renderStatusBadge(s.status),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: 'text-right',
      render: (s) => (
        <button
          type="button"
          className="btn btn-icon btn-sm"
          title="Consulter les détails du ticket"
          aria-label={`Détails de la vente #${s.id}`}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/ventes/${s.id}`);
          }}
        >
          <Eye size={16} strokeWidth={1.75} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex-col gap-6">
      {/* ── En-tête de la page ──────────────────────────────────────────────── */}
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Gestion des Ventes</h1>
          <p className="page-subtitle">
            Enregistrez les encaissements, suivez les transactions et consultez les tickets de caisse
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={18} strokeWidth={2} />
          <span>Nouvelle vente</span>
        </button>
      </div>

      {/* ── Barre de filtre statut ───────────────────────────────────────────── */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div className="flex-gap-3" style={{ flexWrap: 'wrap' }}>
          <span className="form-label" style={{ marginBottom: 0 }}>
            Filtrer par statut :
          </span>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="paid">Payées uniquement</option>
            <option value="pending">En attente de paiement</option>
            <option value="cancelled">Annulées</option>
          </select>
        </div>
      </div>

      {/* ── Tableau des ventes ──────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        {fetchError && (
          <div style={{ padding: '16px' }}>
            <Alert type="danger">{fetchError}</Alert>
          </div>
        )}

        {loading ? (
          <Spinner text="Chargement des ventes..." />
        ) : sales.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            text="Aucune vente trouvée"
            sub="Commencez par enregistrer votre première vente en cliquant sur le bouton ci-dessus."
            action={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenModal}
              >
                <Plus size={16} />
                <span>Nouvelle vente</span>
              </button>
            }
          />
        ) : (
          <>
            <DataTable columns={columns} data={sales} keyExtractor={(s) => s.id} />
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
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

      {/* ── Modal POS Nouvelle Vente (2 Colonnes) ────────────────────────────── */}
      {modalOpen && (
        <Modal
          title="Encaisser une nouvelle vente"
          onClose={() => !saving && setModalOpen(false)}
        >
          <div className="flex-col gap-4">
            {formError && <Alert type="danger">{formError}</Alert>}

            {/* Disposition 2 Colonnes */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '20px',
                alignItems: 'start',
              }}
            >
              {/* Colonne Gauche : Recherche & Sélection rapide de produits */}
              <div className="flex-col gap-3">
                <div className="form-label">Catalogue des articles</div>
                <div className="search-input-wrap">
                  <span className="search-icon">
                    <Search size={15} strokeWidth={1.75} />
                  </span>
                  <input
                    className="form-input"
                    placeholder="Rechercher un produit à ajouter…"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>

                <div
                  className="flex-col gap-2"
                  style={{
                    maxHeight: '360px',
                    overflowY: 'auto',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px',
                    background: 'var(--color-surface-subtle)',
                  }}
                >
                  {filteredAvailableProducts.length === 0 ? (
                    <div className="text-muted text-xs text-center" style={{ padding: '24px' }}>
                      Aucun produit disponible correspondant.
                    </div>
                  ) : (
                    filteredAvailableProducts.map((p) => {
                      const isOutOfStock = p.stock_quantity <= 0;
                      return (
                        <div
                          key={p.id}
                          onClick={() => !isOutOfStock && handleSelectProduct(p)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            opacity: isOutOfStock ? 0.55 : 1,
                            transition: 'all var(--transition)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                              {p.name}
                            </div>
                            <div className="text-muted text-xs">
                              SKU: {p.sku} | {formatCurrency(p.unit_price)}
                            </div>
                          </div>

                          <div className="flex-gap-2">
                            <Badge type={isOutOfStock ? 'danger' : 'info'}>
                              {isOutOfStock ? 'Rupture' : `${p.stock_quantity} dispo`}
                            </Badge>
                            {!isOutOfStock && (
                              <PlusCircle size={18} className="text-primary" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Colonne Droite : Ticket de caisse collant & Validation */}
              <div
                className="flex-col gap-3"
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  background: 'var(--color-surface)',
                }}
              >
                <div className="flex-between">
                  <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                    Ticket de caisse
                  </span>
                  <span className="badge badge-primary">{items.length} article(s)</span>
                </div>

                <div className="flex-col gap-2">
                  <FormField label="Client (optionnel)" id="customerId">
                    <select
                      className="form-select"
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
                    placeholder="Ex: Paiement espèces, table 4…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed var(--color-border)' }} />

                {/* Liste des articles du panier */}
                <div
                  className="flex-col gap-2"
                  style={{ maxHeight: '180px', overflowY: 'auto' }}
                >
                  {items.length === 0 ? (
                    <div className="text-center text-muted text-xs" style={{ padding: '20px' }}>
                      Cliquez sur un produit à gauche pour l ajouter au ticket.
                    </div>
                  ) : (
                    items.map((it, idx) => {
                      const prod = productMap.get(parseInt(it.productId, 10));
                      const isOver = prod && it.quantity > prod.stock_quantity;
                      const lineTotal = prod ? (parseFloat(prod.unit_price) || 0) * it.quantity : 0;

                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: isOver ? 'var(--color-danger-bg)' : 'var(--color-surface-subtle)',
                            border: `1px solid ${isOver ? 'var(--color-danger-border)' : 'var(--color-border)'}`,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                            <div className="font-semibold text-xs" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {prod?.name || 'Article'}
                            </div>
                            <div className="text-muted text-xs">
                              {formatCurrency(prod?.unit_price)} x {it.quantity} = {formatCurrency(lineTotal)}
                            </div>
                            {isOver && (
                              <div className="text-danger text-xs font-semibold flex-gap-2">
                                <AlertTriangle size={12} />
                                <span>Stock dépassé ({prod.stock_quantity} dispo)</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-gap-2">
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              style={{ width: '60px', height: '32px', textAlign: 'center', padding: '0 4px' }}
                              value={it.quantity}
                              onChange={(e) => updateItemQty(idx, e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn btn-icon btn-sm text-danger"
                              onClick={() => removeItem(idx)}
                              title="Retirer l article"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Total en grand & Bouton Valider bleu */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-primary-light)',
                    border: '1px solid var(--color-primary-border)',
                    marginTop: '8px',
                  }}
                >
                  <div className="flex-between">
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      Total net :
                    </span>
                    <span
                      className="font-bold tabular-nums"
                      style={{ fontSize: '24px', color: 'var(--color-primary)' }}
                    >
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary w-full"
                  onClick={handleSubmitSale}
                  disabled={saving || hasStockOverflow || items.length === 0}
                  style={{ marginTop: '8px', padding: '12px' }}
                >
                  {saving ? 'Validation en cours…' : `Valider la vente (${formatCurrency(totalAmount)})`}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
