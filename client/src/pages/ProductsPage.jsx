import { useState } from 'react';
import { productService, categoryService, supplierService } from '../services';
import { useFetch } from '../hooks/useFetch';
import { Spinner, EmptyState, Alert, Badge, Modal, ConfirmModal } from '../components/UI';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  sku: '', name: '', description: '', unitPrice: '', stockQuantity: 0,
  stockMin: 0, categoryId: '', supplierId: '', imageUrl: '',
};

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: products, loading, error, refetch } = useFetch(
    () => productService.getAll({ search, lowStock: lowStock || undefined, categoryId: categoryFilter || undefined }),
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

  const openCreate = () => { setForm(EMPTY_FORM); setFormError(''); setModal('create'); };
  const openEdit = (p) => {
    setSelected(p);
    setForm({
      sku: p.sku, name: p.name, description: p.description || '',
      unitPrice: p.unit_price, stockQuantity: p.stock_quantity,
      stockMin: p.stock_min, categoryId: p.category_id || '',
      supplierId: p.supplier_id || '', imageUrl: p.image_url || '',
    });
    setFormError('');
    setModal('edit');
  };

  const handleFieldChange = (e) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
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
      setFormError(err.response?.data?.message || 'Erreur suppression');
    } finally {
      setDeleting(false);
    }
  };

  const stockBadge = (p) => {
    if (p.stock_quantity <= 0) return <Badge type="danger">Rupture</Badge>;
    if (p.stock_quantity <= p.stock_min) return <Badge type="warning">Stock faible</Badge>;
    return <Badge type="success">En stock</Badge>;
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Produits</h1>
          <p>Gérez votre catalogue et vos niveaux de stock</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" id="btn-add-product" onClick={openCreate}>
            + Nouveau produit
          </button>
        )}
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* ── Filtres ────────────────────────────────────────────────────── */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="form-input"
            placeholder="Rechercher par nom ou SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-products"
          />
        </div>
        <select
          className="form-select"
          style={{ width: 180 }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          id="filter-category"
        >
          <option value="">Toutes catégories</option>
          {(categories || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="flex-gap-2" style={{ cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => setLowStock(e.target.checked)}
            id="filter-low-stock"
          />
          Stock faible uniquement
        </label>
      </div>

      {/* ── Tableau ────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Prix unitaire</th>
                <th>Stock</th>
                <th>Statut</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {(products || []).length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 6}>
                  <EmptyState icon="📦" text="Aucun produit" sub="Commencez par créer un produit" />
                </td></tr>
              ) : (
                (products || []).map((p) => (
                  <tr key={p.id}>
                    <td><span className="text-muted text-xs font-semibold">{p.sku}</span></td>
                    <td><span className="font-semibold">{p.name}</span></td>
                    <td>{p.category_name || <span className="text-muted">—</span>}</td>
                    <td>{parseFloat(p.unit_price).toFixed(2)} €</td>
                    <td>
                      <span className={p.stock_quantity <= p.stock_min ? 'text-sm' : 'text-sm'}
                        style={{ color: p.stock_quantity <= 0 ? 'var(--color-danger)' : p.stock_quantity <= p.stock_min ? 'var(--color-warning)' : 'inherit' }}>
                        {p.stock_quantity}
                      </span>
                      <span className="text-muted text-xs"> / min {p.stock_min}</span>
                    </td>
                    <td>{stockBadge(p)}</td>
                    {isAdmin && (
                      <td>
                        <div className="flex-gap-2">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(p.id)}>🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal création/édition ─────────────────────────────────────── */}
      {modal && (
        <Modal
          title={modal === 'create' ? 'Nouveau produit' : 'Modifier le produit'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn btn-primary" form="product-form" type="submit" disabled={saving}>
                {saving ? 'Sauvegarde…' : 'Enregistrer'}
              </button>
            </>
          }
        >
          {formError && <Alert type="danger">{formError}</Alert>}
          <form id="product-form" onSubmit={handleSave} className="flex-col gap-4">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input name="sku" className="form-input" value={form.sku} onChange={handleFieldChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input name="name" className="form-input" value={form.name} onChange={handleFieldChange} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Prix unitaire (€) *</label>
                <input name="unitPrice" type="number" step="0.01" min="0" className="form-input"
                  value={form.unitPrice} onChange={handleFieldChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Catégorie</label>
                <select name="categoryId" className="form-select" value={form.categoryId} onChange={handleFieldChange}>
                  <option value="">— Aucune —</option>
                  {(categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Quantité en stock</label>
                <input name="stockQuantity" type="number" min="0" className="form-input"
                  value={form.stockQuantity} onChange={handleFieldChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Stock minimum</label>
                <input name="stockMin" type="number" min="0" className="form-input"
                  value={form.stockMin} onChange={handleFieldChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Fournisseur</label>
              <select name="supplierId" className="form-select" value={form.supplierId} onChange={handleFieldChange}>
                <option value="">— Aucun —</option>
                {(suppliers || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" className="form-textarea" rows={3}
                value={form.description} onChange={handleFieldChange} />
            </div>
          </form>
        </Modal>
      )}

      {confirmId && (
        <ConfirmModal
          message="Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
