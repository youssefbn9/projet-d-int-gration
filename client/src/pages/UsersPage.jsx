import { useState } from 'react';
import { userService } from '../services';
import { useFetch } from '../hooks/useFetch';
import { Spinner, EmptyState, Alert, Badge, Modal, ConfirmModal } from '../components/UI';
import { useAuth } from '../context/AuthContext';

const EMPTY = { email: '', password: '', firstName: '', lastName: '', role: 'staff' };

export default function UsersPage() {
  const { user: me } = useAuth();
  const { data: users, loading, error, refetch } = useFetch(() => userService.getAll(), []);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => { setForm(EMPTY); setFormError(''); setModal('create'); };
  const openEdit = (u) => {
    setSelected(u);
    setForm({ email: u.email, password: '', firstName: u.first_name, lastName: u.last_name, role: u.role, isActive: u.is_active === 1 });
    setFormError('');
    setModal('edit');
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setFormError('');
    try {
      if (modal === 'create') {
        await userService.create(form);
      } else {
        await userService.update(selected.id, { firstName: form.firstName, lastName: form.lastName, role: form.role, isActive: form.isActive ?? true });
      }
      setModal(null); refetch();
    } catch (err) { setFormError(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await userService.remove(confirmId); setConfirmId(null); refetch(); }
    catch (err) { setFormError(err.response?.data?.message || 'Erreur suppression'); }
    finally { setDeleting(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <div><h1>Utilisateurs</h1><p>Gérez les accès à votre espace</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouvel utilisateur</button>
      </div>
      {error && <Alert type="danger">{error}</Alert>}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {(users || []).length === 0 ? (
                <tr><td colSpan={5}><EmptyState icon="👥" text="Aucun utilisateur" /></td></tr>
              ) : (
                (users || []).map((u) => (
                  <tr key={u.id}>
                    <td className="font-semibold">{u.first_name} {u.last_name}{u.id === me?.userId ? ' (vous)' : ''}</td>
                    <td className="text-sm">{u.email}</td>
                    <td><Badge type={u.role === 'admin' ? 'info' : 'muted'}>{u.role === 'admin' ? 'Administrateur' : 'Personnel'}</Badge></td>
                    <td><Badge type={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'Actif' : 'Inactif'}</Badge></td>
                    <td>
                      <div className="flex-gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(u.id)} disabled={u.id === me?.userId}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal
          title={modal === 'create' ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn btn-primary" form="user-form" type="submit" disabled={saving}>
                {saving ? '…' : 'Enregistrer'}
              </button>
            </>
          }
        >
          {formError && <Alert type="danger">{formError}</Alert>}
          <form id="user-form" onSubmit={handleSave} className="flex-col gap-4">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Prénom *</label>
                <input name="firstName" className="form-input" value={form.firstName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input name="lastName" className="form-input" value={form.lastName} onChange={handleChange} required />
              </div>
            </div>
            {modal === 'create' && (
              <>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Mot de passe * (min. 8 caractères)</label>
                  <input name="password" type="password" className="form-input" value={form.password} onChange={handleChange} required minLength={8} />
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">Rôle *</label>
              <select name="role" className="form-select" value={form.role} onChange={handleChange}>
                <option value="staff">Personnel</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            {modal === 'edit' && (
              <label className="flex-gap-2" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" name="isActive" checked={!!form.isActive} onChange={handleChange} />
                Compte actif
              </label>
            )}
          </form>
        </Modal>
      )}
      {confirmId && (
        <ConfirmModal
          message="Supprimer cet utilisateur ? Cette action est irréversible."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
