import { useState } from 'react';
import { categoryService } from '../services';
import { useFetch } from '../hooks/useFetch';
import { Spinner, EmptyState, Alert, Modal, ConfirmModal } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

export default function CategoriesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: categories, loading, error, refetch } = useFetch(() => categoryService.getAll(), []);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setName('');
    setFormError('');
    setModal('create');
  };

  const openEdit = (c) => {
    setSelected(c);
    setName(c.name);
    setFormError('');
    setModal('edit');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'create') await categoryService.create(name);
      else await categoryService.update(selected.id, name);
      setModal(null);
      refetch();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await categoryService.remove(confirmId);
      setConfirmId(null);
      refetch();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur suppression');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex-col gap-6">
      <div className="page-header flex-between">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
            Catégories d'articles
          </h2>
          <p className="text-muted" style={{ fontSize: '13px' }}>
            Organisation et classification de votre catalogue
          </p>
        </div>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} strokeWidth={2} />
            Nouvelle catégorie
          </button>
        )}
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>NOM DE LA CATÉGORIE</th>
              <th>DATE DE CRÉATION</th>
              {isAdmin && <th className="text-right">ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {(categories || []).length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 4 : 3}>
                  <EmptyState
                    icon={Package}
                    text="Aucune catégorie"
                    sub="Créez des catégories pour classer vos articles."
                  />
                </td>
              </tr>
            ) : (
              (categories || []).map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="text-muted text-xs font-semibold">#{c.id}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                  </td>
                  <td>{formatDate(c.created_at)}</td>
                  {isAdmin && (
                    <td className="text-right">
                      <div className="flex-gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => openEdit(c)}
                          title="Modifier"
                          aria-label={`Modifier ${c.name}`}
                        >
                          <Pencil size={15} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setConfirmId(c.id)}
                          title="Supprimer"
                          aria-label={`Supprimer ${c.name}`}
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

      {modal && (
        <Modal
          title={modal === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
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
                form="cat-form"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </>
          }
        >
          {formError && <Alert type="danger">{formError}</Alert>}
          <form id="cat-form" onSubmit={handleSave} className="flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Nom de la catégorie *</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          </form>
        </Modal>
      )}

      {confirmId && (
        <ConfirmModal
          message="Supprimer cette catégorie ? Les produits associés resteront dans le catalogue sans catégorie."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
