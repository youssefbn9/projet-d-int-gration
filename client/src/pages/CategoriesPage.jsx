import { useState } from 'react';
import { categoryService } from '../services';
import { useFetch } from '../hooks/useFetch';
import { Spinner, EmptyState, Alert, Modal, ConfirmModal } from '../components/UI';
import { useAuth } from '../context/AuthContext';

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

  const openCreate = () => { setName(''); setFormError(''); setModal('create'); };
  const openEdit = (c) => { setSelected(c); setName(c.name); setFormError(''); setModal('edit'); };

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
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await categoryService.remove(confirmId); setConfirmId(null); refetch(); }
    catch (err) { setFormError(err.response?.data?.message || 'Erreur suppression'); }
    finally { setDeleting(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <div><h1>Catégories</h1><p>Organisez vos produits par catégorie</p></div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>+ Nouvelle catégorie</button>
        )}
      </div>
      {error && <Alert type="danger">{error}</Alert>}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>Nom</th><th>Créée le</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>
              {(categories || []).length === 0 ? (
                <tr><td colSpan={isAdmin ? 4 : 3}><EmptyState icon="🏷️" text="Aucune catégorie" /></td></tr>
              ) : (
                (categories || []).map((c) => (
                  <tr key={c.id}>
                    <td className="text-muted">{c.id}</td>
                    <td className="font-semibold">{c.name}</td>
                    <td className="text-sm text-muted">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                    {isAdmin && (
                      <td>
                        <div className="flex-gap-2">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(c.id)}>🗑️</button>
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

      {modal && (
        <Modal
          title={modal === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn btn-primary" form="cat-form" type="submit" disabled={saving}>
                {saving ? '…' : 'Enregistrer'}
              </button>
            </>
          }
        >
          {formError && <Alert type="danger">{formError}</Alert>}
          <form id="cat-form" onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
          </form>
        </Modal>
      )}
      {confirmId && (
        <ConfirmModal
          message="Supprimer cette catégorie ? Les produits liés ne seront pas supprimés."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
