import { useState, useEffect, useCallback } from 'react';
import { productsService, categoriesService, suppliersService, stockService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { Modal, Spinner } from '../components/UI';
import { formatCurrency, formatDateTime } from '../utils/format';
import { Plus, Pencil, Trash2, Search, History, SlidersHorizontal, X } from 'lucide-react';

const INITIAL_FORM = {
  name: '',
  sku: '',
  price: '',
  cost: '',
  stock: 0,
  min_stock: 0,
  categoryId: '',
  supplierId: '',
  description: '',
};

export default function Produits() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const toast = useToast();

  // Liste et filtres
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Recherche & filtres avec debounce 400ms
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modale Ajout / Modification
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  // Modale Suppression
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Modale Mouvements (Historique)
  const [movementModalProduct, setMovementModalProduct] = useState(null);
  const [productMovements, setProductMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Modale Ajuster le stock
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ type: 'entry', quantity: 1, reason: '' });
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  // 1. Debounce 400ms sur la recherche
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 2. Charger catégories et fournisseurs une seule fois
  useEffect(() => {
    categoriesService.getAll().then((res) => setCategories(res.data.data || []));
    suppliersService.getAll().then((res) => setSuppliers(res.data.data || []));
  }, []);

  // 3. Charger les produits
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsService.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        categoryId: selectedCategory || undefined,
        lowStock: lowStockOnly || undefined,
      });

      const resData = res.data.data;
      if (resData && Array.isArray(resData.items)) {
        setProducts(resData.items);
        setPagination(
          resData.pagination || { page, limit, total: resData.items.length, totalPages: 1 }
        );
      } else if (Array.isArray(resData)) {
        setProducts(resData);
        setPagination({ page, limit, total: resData.length, totalPages: 1 });
      } else {
        setProducts([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedCategory, lowStockOnly, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Validation du formulaire de produit
  const validateForm = () => {
    const errors = {};
    if (!form.name || !form.name.trim()) errors.name = 'Le nom du produit est requis';
    if (!form.sku || !form.sku.trim()) errors.sku = 'Le SKU est obligatoire';
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0) {
      errors.price = 'Le prix unitaire doit être supérieur ou égal à 0';
    }
    if (form.cost !== '' && (isNaN(Number(form.cost)) || Number(form.cost) < 0)) {
      errors.cost = "Le coût d'achat doit être supérieur ou égal à 0";
    }
    if (form.stock === '' || isNaN(Number(form.stock)) || Number(form.stock) < 0) {
      errors.stock = 'Le stock initial doit être un entier positif ou nul';
    }
    if (form.min_stock === '' || isNaN(Number(form.min_stock)) || Number(form.min_stock) < 0) {
      errors.min_stock = "Le seuil d'alerte doit être un entier positif ou nul";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm(INITIAL_FORM);
    setFormErrors({});
    setServerError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setForm({
      name: prod.name || '',
      sku: prod.sku || '',
      price: prod.unit_price ?? prod.price ?? 0,
      cost: prod.cost ?? 0,
      stock: prod.stock_quantity ?? prod.stock ?? 0,
      min_stock: prod.stock_min ?? prod.min_stock ?? 0,
      categoryId: prod.category_id || '',
      supplierId: prod.supplier_id || '',
      description: prod.description || '',
    });
    setFormErrors({});
    setServerError('');
    setModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validateForm()) return;

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: parseFloat(form.price),
      cost: form.cost ? parseFloat(form.cost) : 0,
      stock: parseInt(form.stock, 10),
      min_stock: parseInt(form.min_stock, 10),
      categoryId: form.categoryId ? parseInt(form.categoryId, 10) : null,
      supplierId: form.supplierId ? parseInt(form.supplierId, 10) : null,
      description: form.description ? form.description.trim() : null,
    };

    try {
      if (editingProduct) {
        await productsService.update(editingProduct.id, payload);
        toast.success('Produit mis à jour avec succès');
      } else {
        await productsService.create(payload);
        toast.success('Produit créé avec succès');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Une erreur est survenue';
      if (err.response?.data?.error === 'SKU_ALREADY_EXISTS') {
        setFormErrors((prev) => ({ ...prev, sku: errMsg }));
      }
      setServerError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Suppression
  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      await productsService.remove(deleteProduct.id);
      toast.success(`Le produit "${deleteProduct.name}" a été supprimé`);
      setDeleteProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
      setDeleteProduct(null);
    } finally {
      setDeleting(false);
    }
  };

  // Consulter les mouvements
  const handleOpenMovements = async (prod) => {
    setMovementModalProduct(prod);
    setLoadingMovements(true);
    try {
      const res = await stockService.getMovements({ productId: prod.id });
      setProductMovements(res.data.data || []);
    } catch (err) {
      toast.error('Impossible de charger les mouvements du produit');
      setProductMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  };

  // Ajuster le stock
  const handleOpenAdjust = (prod) => {
    setAdjustProduct(prod);
    setAdjustForm({ type: 'entry', quantity: 1, reason: '' });
    setAdjustError('');
  };

  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    if (!adjustProduct) return;
    if (adjustForm.quantity <= 0) {
      setAdjustError('La quantité doit être supérieure à 0');
      return;
    }

    setAdjustSaving(true);
    setAdjustError('');
    try {
      await stockService.createMovement({
        productId: adjustProduct.id,
        type: adjustForm.type,
        quantity: parseInt(adjustForm.quantity, 10),
        reason: adjustForm.reason || 'Ajustement manuel',
      });
      toast.success('Mouvement de stock enregistré avec succès');
      setAdjustProduct(null);
      fetchProducts();
    } catch (err) {
      setAdjustError(err.response?.data?.message || "Erreur lors de l'enregistrement du mouvement");
    } finally {
      setAdjustSaving(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'NOM DU PRODUIT',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{p.name}</div>
          {p.description && (
            <div
              className="text-muted text-xs"
              style={{
                maxWidth: 260,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {p.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (p) => <span className="text-muted text-xs font-semibold">{p.sku}</span>,
    },
    {
      key: 'category_name',
      header: 'CATÉGORIE',
      render: (p) => p.category_name || <span className="text-muted">—</span>,
    },
    {
      key: 'supplier_name',
      header: 'FOURNISSEUR',
      render: (p) => p.supplier_name || <span className="text-muted">—</span>,
    },
    {
      key: 'unit_price',
      header: 'PRIX',
      className: 'text-right',
      render: (p) => (
        <span style={{ fontWeight: 600 }}>{formatCurrency(p.unit_price ?? p.price)}</span>
      ),
    },
    {
      key: 'stock_quantity',
      header: 'STOCK',
      className: 'text-right',
      render: (p) => {
        const qty = p.stock_quantity ?? p.stock ?? 0;
        const min = p.stock_min ?? p.min_stock ?? 0;
        const isLow = qty <= min;
        return (
          <span
            style={{
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: isLow ? '#FEE2E2' : '#DCFCE7',
              color: isLow ? '#B91C1C' : '#15803D',
              display: 'inline-block',
            }}
          >
            {qty} {isLow && '⚠️'}
          </span>
        );
      },
    },
    {
      key: 'stock_min',
      header: 'SEUIL',
      className: 'text-right',
      render: (p) => p.stock_min ?? p.min_stock ?? 0,
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: 'text-right',
      render: (p) => (
        <div className="flex-gap-2" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => handleOpenMovements(p)}
            title="Historique des mouvements"
            aria-label="Mouvements"
          >
            <History size={15} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => handleOpenAdjust(p)}
            title="Ajuster le stock"
            aria-label="Ajuster le stock"
          >
            <SlidersHorizontal size={15} strokeWidth={1.75} />
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                className="btn btn-icon btn-sm"
                onClick={() => handleOpenEdit(p)}
                title="Modifier"
                aria-label="Modifier"
              >
                <Pencil size={15} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                className="btn btn-icon btn-sm"
                onClick={() => setDeleteProduct(p)}
                title="Supprimer"
                aria-label="Supprimer"
                style={{ color: 'var(--color-danger)' }}
              >
                <Trash2 size={15} strokeWidth={1.75} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-col gap-6">
      {/* ── En-tête de page ───────────────────────────────────────────── */}
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
            Catalogue Produits
          </h2>
          <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>
            Gestion des stocks, prix, approvisionnements et mouvements
          </p>
        </div>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} strokeWidth={2} />
            Nouveau produit
          </button>
        )}
      </div>

      {/* ── Barre de filtres ─────────────────────────────────────────── */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">
            <Search size={16} strokeWidth={1.75} />
          </span>
          <input
            className="form-input"
            placeholder="Rechercher par nom ou SKU…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 200 }}
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label
          className="flex-gap-2"
          style={{ cursor: 'pointer', userSelect: 'none', fontSize: '14px', alignItems: 'center' }}
        >
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setLowStockOnly(e.target.checked);
              setPage(1);
            }}
          />
          <span>Stock bas uniquement</span>
        </label>
      </div>

      {/* ── Tableau de données paginé ─────────────────────────────────── */}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={products}
            emptyText="Aucun produit trouvé dans le catalogue"
          />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalCount={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}

      {/* ── Modale Création / Modification de produit ──────────────────── */}
      {modalOpen && (
        <Modal
          title={editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                type="submit"
                form="product-form"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </>
          }
        >
          <form
            id="product-form"
            onSubmit={handleSaveProduct}
            className="flex-col gap-4"
            noValidate
          >
            {serverError && (
              <div
                className="alert alert-danger"
                style={{ padding: '10px 12px', fontSize: '13px' }}
              >
                {serverError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField
                label="Désignation / Nom"
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={formErrors.name}
                required
              />
              <FormField
                label="Référence (SKU)"
                name="sku"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                error={formErrors.sku}
                placeholder="Ex: ELEC-001"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField
                label="Prix de vente unitaire (DT)"
                name="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                error={formErrors.price}
                required
              />
              <FormField
                label="Coût d'achat (DT)"
                name="cost"
                type="number"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                error={formErrors.cost}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField
                label="Quantité en stock"
                name="stock"
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                error={formErrors.stock}
                required
              />
              <FormField
                label="Seuil d'alerte (stock min)"
                name="min_stock"
                type="number"
                value={form.min_stock}
                onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                error={formErrors.min_stock}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Catégorie</label>
                <select
                  className="form-select"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fournisseur</label>
                <select
                  className="form-select"
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <FormField
              label="Description"
              name="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description détaillée du produit…"
            />
          </form>
        </Modal>
      )}

      {/* ── Modale Confirmation de Suppression ─────────────────────────── */}
      <ConfirmDialog
        open={!!deleteProduct}
        title="Suppression de produit"
        message={`Êtes-vous sûr de vouloir supprimer le produit "${deleteProduct?.name}" ? Cette action est irréversible.`}
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteProduct(null)}
        loading={deleting}
      />

      {/* ── Modale Historique des Mouvements du Produit ─────────────────── */}
      {movementModalProduct && (
        <div className="modal-overlay" onClick={() => setMovementModalProduct(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex-between">
              <div>
                <h3 className="modal-title">Historique des mouvements</h3>
                <p className="text-muted text-xs" style={{ marginTop: '2px' }}>
                  Produit : {movementModalProduct.name} ({movementModalProduct.sku})
                </p>
              </div>
              <button
                type="button"
                className="btn btn-icon btn-sm"
                onClick={() => setMovementModalProduct(null)}
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            <div className="modal-body">
              {loadingMovements ? (
                <Spinner />
              ) : productMovements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px' }} className="text-muted">
                  Aucun mouvement enregistré pour ce produit.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>TYPE</th>
                        <th className="text-right">QUANTITÉ</th>
                        <th>MOTIF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productMovements.map((m) => (
                        <tr key={m.id}>
                          <td className="text-xs">{formatDateTime(m.created_at)}</td>
                          <td>
                            <span
                              className={`badge ${
                                m.type === 'entry' || m.type === 'in'
                                  ? 'badge-success'
                                  : m.type === 'exit' || m.type === 'out'
                                    ? 'badge-danger'
                                    : 'badge-info'
                              }`}
                            >
                              {m.type === 'entry' || m.type === 'in'
                                ? 'Entrée'
                                : m.type === 'exit' || m.type === 'out'
                                  ? 'Sortie'
                                  : 'Ajustement'}
                            </span>
                          </td>
                          <td className="text-right font-semibold">
                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                          </td>
                          <td className="text-sm">{m.reason || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modale Ajuster le Stock ────────────────────────────────────── */}
      {adjustProduct && (
        <Modal
          title={`Ajuster le stock : ${adjustProduct.name}`}
          onClose={() => setAdjustProduct(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAdjustProduct(null)}
                disabled={adjustSaving}
              >
                Annuler
              </button>
              <button
                type="submit"
                form="adjust-form"
                className="btn btn-primary"
                disabled={adjustSaving}
              >
                {adjustSaving ? 'Traitement…' : 'Valider le mouvement'}
              </button>
            </>
          }
        >
          <form id="adjust-form" onSubmit={handleSaveAdjust} className="flex-col gap-4">
            {adjustError && (
              <div
                className="alert alert-danger"
                style={{ padding: '10px 12px', fontSize: '13px' }}
              >
                {adjustError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Type de mouvement</label>
              <select
                className="form-select"
                value={adjustForm.type}
                onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
              >
                <option value="entry">Entrée de stock (+)</option>
                <option value="exit">Sortie de stock (-)</option>
                <option value="adjustment">Correction / Inventaire</option>
              </select>
            </div>

            <FormField
              label="Quantité"
              type="number"
              min="1"
              value={adjustForm.quantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
              required
            />

            <FormField
              label="Motif du mouvement"
              placeholder="Ex: Réception livraison, Casse, Inventaire périodique…"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              required
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
