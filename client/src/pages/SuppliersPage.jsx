import { useState } from 'react';
import { supplierService } from '../services';
import { useFetch } from '../hooks/useFetch';
import { Spinner, EmptyState, Alert, Modal, ConfirmModal } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

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

  const openCreate = () => {
    setForm(EMPTY);
    setFormError('');
    setModal('create');
  };

  const openEdit = (s) => {
    setSelected(s);
    setForm({
      name: s.name,
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
    });
    setFormError('');
    setModal('edit');
  };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'create') await supplierService.create(form);
      else await supplierService.update(selected.id, form);
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
      await supplierService.remove(confirmId);
      setConfirmId(null);
      refetch();
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
            Partenaires Fournisseurs
          </h2>
          <p className="text-muted" style={{ fontSize: '13px' }}>
            Coordonnées des distributeurs et contacts d'approvisionnement
          </p>
        </div>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} strokeWidth={2} />
            Nouveau fournisseur
          </button>
        )}
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>NOM DE L'ENTREPRISE</th>
              <th>EMAIL</th>
              <th>TÉLÉPHONE</th>
              <th>ADRESSE</th>
              {isAdmin && <th className="text-right">ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {(suppliers || []).length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4}>
                  <EmptyState
                    icon={Users}
                    text="Aucun fournisseur enregistré"
                    sub="Ajoutez vos partenaires d'approvisionnement."
                  />
                </td>
              </tr>
            ) : (
              (suppliers || []).map((s) => (
                <tr key={s.id}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                  </td>
                  <td>{s.email || <span className="text-muted">—</span>}</td>
                  <td>{s.phone || <span className="text-muted">—</span>}</td>
                  <td>
                    <span className="text-muted text-xs">{s.address || '—'}</span>
                  </td>
                  {isAdmin && (
                    <td className="text-right">
                      <div className="flex-gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => openEdit(s)}
                          title="Modifier"
                          aria-label={`Modifier ${s.name}`}
                        >
                          <Pencil size={15} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setConfirmId(s.id)}
                          title="Supprimer"
                          aria-label={`Supprimer ${s.name}`}
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
          title={modal === 'create' ? 'Nouveau fournisseur' : 'Modifier le fournisseur'}
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
                form="sup-form"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Sauvegarde…' : 'Enregistrer'}
              </button>
            </>
          }
        >
          {formError && <Alert type="danger">{formError}</Alert>}
          <form id="sup-form" onSubmit={handleSave} className="flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Raison sociale *</label>
              <input
                name="name"
                className="form-input"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Email de contact</label>
                <input
                  name="email"
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input
                  name="phone"
                  className="form-input"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Adresse physique</label>
              <input
                name="address"
                className="form-input"
                value={form.address}
                onChange={handleChange}
              />
            </div>
          </form>
        </Modal>
      )}

      {confirmId && (
        <ConfirmModal
          message="Êtes-vous sûr de vouloir supprimer ce fournisseur ?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
