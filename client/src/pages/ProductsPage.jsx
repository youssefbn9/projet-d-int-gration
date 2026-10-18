import { useState } from 'react';
import { productService, categoryService, supplierService } from '../services';
import { useFetch } from '../hooks/useFetch';
import { Spinner, EmptyState, Alert, Badge, Modal, ConfirmModal } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../utils/format';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';

const EMPTY_FORM = {
  sku: '',
  name: '',
  description: '',
  unitPrice: '',
  stockQuantity: 0,
  stockMin: 0,
  categoryId: '',
  supplierId: '',
  imageUrl: '',
};

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: products, loading, error, refetch } = useFetch(
    () =>
      productService.getAll({
        search,
        lowStock: lowStock || undefined,
        categoryId: categoryFilter || undefined,
      }),
    [search, lowStock, categoryFilter]
  );
  const { data: categories } = useFetch(() => categoryService.getAll(), []);
  const { data: suppliers } = useFetch(() => supplierService.getAll(), []);

  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setModal('create');
  };

  const openEdit = (p) => {
    setSelected(p);
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      unitPrice: p.unit_price,
      stockQuantity: p.stock_quantity,
      stockMin: p.stock_min,
      categoryId: p.category_id || '',
      supplierId: p.supplier_id || '',
      imageUrl: p.image_url || '',
    });
    setFormError('');
    setModal('edit');
  };

  const handleFieldChange = (e) => {
    const { name, value, type } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = {
      ...form,
      unitPrice: parseFloat(form.unitPrice),
      stockQuantity: parseInt(form.stockQuantity, 10),
      stockMin: parseInt(form.stockMin, 10),
      categoryId: form.categoryId ? parseInt(form.categoryId, 10) : null,
      supplierId: form.supplierId ? parseInt(form.supplierId, 10) : null,
      imageUrl: form.imageUrl || null,
    };
    try {
      if (modal === 'create') await productService.create(payload);
      else await productService.update(selected.id, payload);
      setModal(null);
      refetch();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await productService.remove(confirmId);
      setConfirmId(null);
      refetch();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const stockBadge = (p) => {
    if (p.stock_quantity <= 0) return <Badge type="danger">Rupture</Badge>;
    if (p.stock_quantity <= p.stock_min) return <Badge type="warning">Stock bas</Badge>;
    return <Badge type="success">En stock</Badge>;
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex-col gap-6">
      <div className="page-header flex-between">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Catalogue Produits
          </h2>
          <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>
            Gérez vos références de stock, prix de vente et réapprovisionnements
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" id="btn-add-product" onClick={openCreate}>
            <Plus size={16} strokeWidth={2} />
            Nouveau produit
          </button>
        )}
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* ── Barre d'outils / Filtres ──────────────────────────────────── */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">
            <Search size={16} strokeWidth={1.75} />
          </span>
          <input
            className="form-input"
            placeholder="Rechercher par référence, désignation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-products"
          />
        </div>

        <select
          className="form-select"
          style={{ width: 200 }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          id="filter-category"
        >
          <option value="">Toutes les catégories</option>
          {(categories || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label
          className="flex-gap-2"
          style={{
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => setLowStock(e.target.checked)}
            id="filter-low-stock"
            style={{ accentColor: 'var(--color-primary)' }}
          />
          Stock bas uniquement
        </label>
      </div>

      {/* ── Tableau Produits ─────────────────────────────────────────── */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>RÉFÉRENCE</th>
              <th>DÉSIGNATION</th>
              <th>CATÉGORIE</th>
              <th className="text-right">PRIX UNITAIRE</th>
              <th className="text-right">DISPONIBILITÉ</th>
              <th>STATUT</th>
              {isAdmin && <th className="text-right">ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {(products || []).length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6}>
                  <EmptyState
                    icon={Package}
                    text="Aucun produit trouvé"
                    sub="Ajoutez votre premier article pour commencer à vendre."
                  />
                </td>
              </tr>
            ) : (
              (products || []).map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="text-muted text-xs font-semibold">{p.sku}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                  </td>
                  <td>{p.category_name || <span className="text-muted">—</span>}</td>
                  <td className="text-right" style={{ fontWeight: 600 }}>
                    {formatCurrency(p.unit_price)}
                  </td>
                  <td className="text-right">
                    <span style={{ fontWeight: 600 }}>{formatNumber(p.stock_quantity)}</span>
                    <span className="text-muted text-xs"> / min {p.stock_min}</span>
                  </td>
                  <td>{stockBadge(p)}</td>
                  {isAdmin && (
                    <td className="text-right">
                      <div className="flex-gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => openEdit(p)}
                          title="Modifier"
                          aria-label={`Modifier ${p.name}`}
                        >
                          <Pencil size={15} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setConfirmId(p.id)}
                          title="Supprimer"
                          aria-label={`Supprimer ${p.name}`}
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={15} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal création/édition ─────────────────────────────────────── */}
      {modal && (
        <Modal
          title={modal === 'create' ? 'Nouveau produit' : 'Modifier le produit'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModal(null)}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                form="product-form"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Sauvegarde…' : 'Enregistrer le produit'}
              </button>
            </>
          }
        >
          {formError && <Alert type="danger">{formError}</Alert>}
          <form id="product-form" onSubmit={handleSave} className="flex-col gap-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">SKU / Référence *</label>
                <input
                  name="sku"
                  className="form-input"
                  value={form.sku}
                  onChange={handleFieldChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nom du produit *</label>
                <input
                  name="name"
                  className="form-input"
                  value={form.name}
                  onChange={handleFieldChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Prix unitaire (TND) *</label>
                <input
                  name="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={form.unitPrice}
                  onChange={handleFieldChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Catégorie</label>
                <select
                  name="categoryId"
                  className="form-select"
                  value={form.categoryId}
                  onChange={handleFieldChange}
                >
                  <option value="">— Aucune catégorie —</option>
                  {(categories || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Quantité en stock</label>
                <input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  className="form-input"
                  value={form.stockQuantity}
                  onChange={handleFieldChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Seuil stock minimum</label>
                <input
                  name="stockMin"
                  type="number"
                  min="0"
                  className="form-input"
                  value={form.stockMin}
                  onChange={handleFieldChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Fournisseur attitré</label>
              <select
                name="supplierId"
                className="form-select"
                value={form.supplierId}
                onChange={handleFieldChange}
              >
                <option value="">— Aucun fournisseur —</option>
                {(suppliers || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description détaillée</label>
              <textarea
                name="description"
                className="form-textarea"
                rows={3}
                value={form.description}
                onChange={handleFieldChange}
              />
            </div>
          </form>
        </Modal>
      )}

      {confirmId && (
        <ConfirmModal
          message="Êtes-vous sûr de vouloir supprimer définitivement ce produit ? Cette action est irréversible."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
