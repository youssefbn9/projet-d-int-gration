import { useState } from 'react';
import { supplierService } from '../services';
import { useFetch } from '../hooks/useFetch';
import { Spinner, EmptyState, Alert, Modal, ConfirmModal } from '../components/UI';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name: '', email: '', phone: '', address: '' };

export default function SuppliersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: suppliers, loading, error, refetch } = useFetch(() => supplierService.getAll(), []);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => { setForm(EMPTY); setFormError(''); setModal('create'); };
  const openEdit = (s) => { setSelected(s); setForm({ name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '' }); setFormError(''); setModal('edit'); };
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setFormError('');
    try {
      if (modal === 'create') await supplierService.create(form);
      else await supplierService.update(selected.id, form);
      setModal(null); refetch();
    } catch (err) { setFormError(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await supplierService.remove(confirmId); setConfirmId(null); refetch(); }
    finally { setDeleting(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <div><h1>Fournisseurs</h1><p>Gérez vos partenaires d'approvisionnement</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ Nouveau fournisseur</button>}
      </div>
      {error && <Alert type="danger">{error}</Alert>}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Adresse</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>
              {(suppliers || []).length === 0 ? (
                <tr><td colSpan={isAdmin ? 5 : 4}><EmptyState icon="🏭" text="Aucun fournisseur" /></td></tr>
              ) : (
                (suppliers || []).map((s) => (
                  <tr key={s.id}>
                    <td className="font-semibold">{s.name}</td>
                    <td className="text-sm">{s.email || <span className="text-muted">—</span>}</td>
                    <td className="text-sm">{s.phone || <span className="text-muted">—</span>}</td>
                    <td className="text-sm text-muted truncate" style={{ maxWidth: 200 }}>{s.address || '—'}</td>
                    {isAdmin && (
                      <td>
                        <div className="flex-gap-2">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(s.id)}>🗑️</button>
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
          title={modal === 'create' ? 'Nouveau fournisseur' : 'Modifier le fournisseur'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn btn-primary" form="sup-form" type="submit" disabled={saving}>
                {saving ? '…' : 'Enregistrer'}
              </button>
            </>
          }
        >
          {formError && <Alert type="danger">{formError}</Alert>}
          <form id="sup-form" onSubmit={handleSave} className="flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input name="name" className="form-input" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input name="phone" className="form-input" value={form.phone} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Adresse</label>
              <textarea name="address" className="form-textarea" rows={2} value={form.address} onChange={handleChange} />
            </div>
          </form>
        </Modal>
      )}
      {confirmId && (
        <ConfirmModal
          message="Supprimer ce fournisseur ?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
