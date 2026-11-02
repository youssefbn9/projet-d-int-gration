import { useState } from 'react';
import { userService } from '../services';
import { useFetch } from '../hooks/useFetch';
import { Spinner, EmptyState, Alert, Badge, Modal, ConfirmModal } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';

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

  const openCreate = () => {
    setForm(EMPTY);
    setFormError('');
    setModal('create');
  };

  const openEdit = (u) => {
    setSelected(u);
    setForm({
      email: u.email,
      password: '',
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role,
      isActive: u.is_active === 1,
    });
    setFormError('');
    setModal('edit');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'create') {
        await userService.create(form);
      } else {
        await userService.update(selected.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          isActive: form.isActive ?? true,
        });
      }
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
      await userService.remove(confirmId);
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
            Gestion des Utilisateurs
          </h2>
          <p className="text-muted" style={{ fontSize: '13px' }}>
            Contrôle des accès collaborateurs et permissions
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} strokeWidth={2} />
          Nouvel utilisateur
        </button>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>UTILISATEUR</th>
              <th>EMAIL</th>
              <th>RÔLE</th>
              <th>STATUT</th>
              <th className="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {(users || []).length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={Users}
                    text="Aucun utilisateur enregistré"
                    sub="Créez des accès pour vos collaborateurs."
                  />
                </td>
              </tr>
            ) : (
              (users || []).map((u) => (
                <tr key={u.id}>
                  <td>
                    <span style={{ fontWeight: 600 }}>
                      {u.first_name} {u.last_name}
                    </span>
                    {u.id === me?.userId && <span className="text-muted text-xs"> (vous)</span>}
                  </td>
                  <td className="text-sm">{u.email}</td>
                  <td>
                    <Badge type={u.role === 'admin' ? 'info' : 'muted'}>
                      {u.role === 'admin' ? 'Administrateur' : 'Personnel'}
                    </Badge>
                  </td>
                  <td>
                    <Badge type={u.is_active ? 'success' : 'danger'}>
                      {u.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <div className="flex-gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => openEdit(u)}
                        title="Modifier"
                        aria-label={`Modifier ${u.first_name}`}
                      >
                        <Pencil size={15} strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => setConfirmId(u.id)}
                        disabled={u.id === me?.userId}
                        title="Supprimer"
                        aria-label={`Supprimer ${u.first_name}`}
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title={modal === 'create' ? 'Nouvel utilisateur' : "Modifier l'utilisateur"}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>
                Annuler
              </button>
              <button className="btn btn-primary" form="user-form" type="submit" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </>
          }
        >
          {formError && <Alert type="danger">{formError}</Alert>}
          <form id="user-form" onSubmit={handleSave} className="flex-col gap-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Prénom *</label>
                <input
                  name="firstName"
                  className="form-input"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input
                  name="lastName"
                  className="form-input"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {modal === 'create' && (
              <>
                <div className="form-group">
                  <label className="form-label">Email professionnel *</label>
                  <input
                    name="email"
                    type="email"
                    className="form-input"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mot de passe provisoire *</label>
                  <input
                    name="password"
                    type="password"
                    className="form-input"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Rôle d'accès</label>
              <select name="role" className="form-select" value={form.role} onChange={handleChange}>
                <option value="staff">Personnel (ventes & stock)</option>
                <option value="admin">Administrateur (accès complet)</option>
              </select>
            </div>

            {modal === 'edit' && (
              <label className="flex-gap-2" style={{ cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                Compte utilisateur actif
              </label>
            )}
          </form>
        </Modal>
      )}

      {confirmId && (
        <ConfirmModal
          message="Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
