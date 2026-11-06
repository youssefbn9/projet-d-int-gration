import { useState, useMemo } from 'react';
import { movementService, productService } from '../services';
import { useFetch } from '../hooks/useFetch';
import { Spinner, EmptyState, Alert, Badge, Modal } from '../components/UI';
import { formatDateTime } from '../utils/format';
import { Plus, History, ArrowDownLeft, ArrowUpRight, SlidersHorizontal, Search } from 'lucide-react';

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
  const { data: movementsData, loading, error, refetch } = useFetch(() => movementService.getAll(), []);
  const { data: productsData } = useFetch(() => productService.getAll({ limit: 100 }), []);

  const movements = useMemo(() => {
    return Array.isArray(movementsData) ? movementsData : (movementsData?.items || []);
  }, [movementsData]);

  const products = useMemo(() => {
    return Array.isArray(productsData) ? productsData : (productsData?.items || []);
  }, [productsData]);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'entry', quantity: 1, reason: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Filtres
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchSearch =
        !search ||
        (m.product_name && m.product_name.toLowerCase().includes(search.toLowerCase())) ||
        (m.sku && m.sku.toLowerCase().includes(search.toLowerCase())) ||
        (m.reason && m.reason.toLowerCase().includes(search.toLowerCase()));

      let matchType = true;
      if (selectedType === 'in') {
        matchType = m.type === 'in' || m.type === 'entry' || m.quantity > 0;
      } else if (selectedType === 'out') {
        matchType = m.type === 'out' || m.type === 'exit' || m.quantity < 0;
      } else if (selectedType === 'adjustment') {
        matchType = m.type === 'adjustment';
      }

      return matchSearch && matchType;
    });
  }, [movements, search, selectedType]);

  // Statistiques rapides
  const stats = useMemo(() => {
    let entries = 0;
    let exits = 0;
    movements.forEach((m) => {
      if (m.type === 'in' || m.type === 'entry' || m.quantity > 0) entries++;
      else if (m.type === 'out' || m.type === 'exit' || m.quantity < 0) exits++;
    });
    return { total: movements.length, entries, exits };
  }, [movements]);

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
      {/* Header */}
      <div className="page-header flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
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
            Journal d'audit temps réel des entrées, sorties et ajustements d'inventaire
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} strokeWidth={2} />
          Nouveau mouvement
        </button>
      </div>

      {/* Mini KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-info">
            <span className="stat-label">Total Mouvements</span>
            <span className="stat-value" style={{ fontSize: '22px' }}>{stats.total}</span>
            <span className="stat-sub">Historique enregistré</span>
          </div>
          <div className="stat-icon-wrap turquoise" style={{ width: '40px', height: '40px' }}>
            <History size={18} />
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-info">
            <span className="stat-label">Entrées de stock</span>
            <span className="stat-value" style={{ fontSize: '22px', color: 'var(--color-success)' }}>
              +{stats.entries}
            </span>
            <span className="stat-sub">Approvisionnements & retours</span>
          </div>
          <div className="stat-icon-wrap emerald" style={{ width: '40px', height: '40px' }}>
            <ArrowDownLeft size={18} />
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-info">
            <span className="stat-label">Sorties de stock</span>
            <span className="stat-value" style={{ fontSize: '22px', color: 'var(--color-danger)' }}>
              -{stats.exits}
            </span>
            <span className="stat-sub">Ventes & déstockages</span>
          </div>
          <div className="stat-icon-wrap coral" style={{ width: '40px', height: '40px' }}>
            <ArrowUpRight size={18} />
          </div>
        </div>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* Barre de Filtres et Recherche */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'var(--color-surface)',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '380px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
            placeholder="Rechercher par produit, référence SKU, motif..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={15} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Filtrer :
          </span>
          <select
            className="form-select"
            style={{ height: '38px', fontSize: '13px', width: 'auto', minWidth: '150px' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">Tous les types ({movements.length})</option>
            <option value="in">Entrées uniquement</option>
            <option value="out">Sorties uniquement</option>
            <option value="adjustment">Ajustements manuels</option>
          </select>
        </div>
      </div>

      {/* Tableau des mouvements */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>DATE & HEURE</th>
              <th>PRODUIT</th>
              <th>TYPE</th>
              <th className="text-right">VARIATION</th>
              <th>OPÉRATEUR</th>
              <th>MOTIF & JUSTIFICATIF</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={History}
                    text={search || selectedType !== 'all' ? 'Aucun mouvement correspondant aux critères' : 'Aucun mouvement de stock'}
                    sub={search || selectedType !== 'all' ? 'Essayez de réinitialiser la recherche ou le filtre.' : 'Les variations de stock manuelles ou par vente apparaîtront ici.'}
                  />
                </td>
              </tr>
            ) : (
              filteredMovements.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {formatDateTime(m.created_at)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{m.product_name}</div>
                    <div className="text-muted text-xs" style={{ fontFamily: 'monospace' }}>
                      {m.sku}
                    </div>
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
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      color:
                        m.quantity > 0 || m.type === 'entry' || m.type === 'in'
                          ? 'var(--color-success)'
                          : 'var(--color-danger)',
                    }}
                  >
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td style={{ fontSize: '13px' }}>
                    {m.first_name || m.last_name ? (
                      `${m.first_name || ''} ${m.last_name || ''}`.trim()
                    ) : (
                      <span className="text-muted">Système</span>
                    )}
                  </td>
                  <td className="text-muted text-sm">
                    {m.reason ? (
                      <span style={{ color: 'var(--color-text-secondary)' }}>{m.reason}</span>
                    ) : (
                      <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>Automatique</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nouveau Mouvement */}
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
                    {p.name} (Stock actuel : {p.stock_quantity ?? p.stock ?? 0})
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
                placeholder="Ex: Réception livraison fournisseur, casse, réajustement inventaire…"
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
