import { useState, useEffect, useCallback } from 'react';
import { customersService, suppliersService, categoriesService, usersService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { Modal, Spinner } from '../components/UI';
import { formatDate } from '../utils/format';
import { Users, Building, Tag, UserCheck, Plus, Pencil, Trash2 } from 'lucide-react';

export default function ClientsFournisseurs() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const toast = useToast();

  // Onglet actif : 'clients' | 'suppliers' | 'categories' | 'users'
  const [activeTab, setActiveTab] = useState('clients');

  // Données et chargement
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // État Modales CRUD
  const [modalType, setModalType] = useState(null); // 'client' | 'supplier' | 'category' | 'employee'
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // État Suppression
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, item }
  const [deleting, setDeleting] = useState(false);

  // ── Chargement des données ────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const promises = [
        customersService.getAll(),
        suppliersService.getAll(),
        categoriesService.getAll(),
      ];
      if (isAdmin) {
        promises.push(usersService.getAll());
      }

      const results = await Promise.all(promises);
      setClients(results[0]?.data?.data || []);
      setSuppliers(results[1]?.data?.data || []);
      setCategories(results[2]?.data?.data || []);
      if (isAdmin && results[3]) {
        setEmployees(results[3]?.data?.data || []);
      }
    } catch (err) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Si l'utilisateur n'est pas admin et que l'onglet 'users' était actif, replier sur 'clients'
  useEffect(() => {
    if (!isAdmin && activeTab === 'users') {
      setActiveTab('clients');
    }
  }, [isAdmin, activeTab]);

  // ── Handlers Modales ──────────────────────────────────────────────────────
  const handleOpenCreate = (type) => {
    setModalType(type);
    setModalMode('create');
    setEditingItem(null);
    setFormErrors({});
    if (type === 'client') setFormData({ name: '', email: '', phone: '' });
    if (type === 'supplier') setFormData({ name: '', email: '', phone: '', address: '' });
    if (type === 'category') setFormData({ name: '' });
    if (type === 'employee')
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'staff' });
  };

  const handleOpenEdit = (type, item) => {
    setModalType(type);
    setModalMode('edit');
    setEditingItem(item);
    setFormErrors({});
    if (type === 'client')
      setFormData({ name: item.name || '', email: item.email || '', phone: item.phone || '' });
    if (type === 'supplier')
      setFormData({
        name: item.name || '',
        email: item.email || '',
        phone: item.phone || '',
        address: item.address || '',
      });
    if (type === 'category') setFormData({ name: item.name || '' });
    if (type === 'employee') {
      setFormData({
        firstName: item.first_name || '',
        lastName: item.last_name || '',
        role: item.role || 'staff',
        isActive: item.is_active === 1 || item.is_active === true,
      });
    }
  };

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.name?.trim() && modalType !== 'employee') {
      errors.name = 'Le nom est obligatoire';
    }
    if (modalType === 'employee') {
      if (!formData.firstName?.trim()) errors.firstName = 'Le prénom est requis';
      if (!formData.lastName?.trim()) errors.lastName = 'Le nom est requis';
      if (modalMode === 'create') {
        if (!formData.email?.trim()) errors.email = "L'email est requis";
        if (!formData.password || formData.password.length < 8)
          errors.password = '8 caractères minimum requis';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      if (modalType === 'client') {
        if (modalMode === 'create') {
          await customersService.create(formData);
          toast.success('Client ajouté avec succès');
        } else {
          await customersService.update(editingItem.id, formData);
          toast.success('Client mis à jour avec succès');
        }
      } else if (modalType === 'supplier') {
        if (modalMode === 'create') {
          await suppliersService.create(formData);
          toast.success('Fournisseur ajouté avec succès');
        } else {
          await suppliersService.update(editingItem.id, formData);
          toast.success('Fournisseur mis à jour avec succès');
        }
      } else if (modalType === 'category') {
        if (modalMode === 'create') {
          await categoriesService.create(formData.name.trim());
          toast.success('Catégorie ajoutée avec succès');
        } else {
          await categoriesService.update(editingItem.id, formData.name.trim());
          toast.success('Catégorie mise à jour avec succès');
        }
      } else if (modalType === 'employee') {
        if (modalMode === 'create') {
          await usersService.create(formData);
          toast.success('Collaborateur créé avec succès');
        } else {
          await usersService.update(editingItem.id, formData);
          toast.success('Collaborateur mis à jour avec succès');
        }
      }

      setModalType(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  // ── Suppression ───────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { type, item } = deleteTarget;
    try {
      if (type === 'client') {
        await customersService.remove(item.id);
        toast.success(`Le client "${item.name}" a été supprimé`);
      } else if (type === 'supplier') {
        await suppliersService.remove(item.id);
        toast.success(`Le fournisseur "${item.name}" a été supprimé`);
      } else if (type === 'category') {
        await categoriesService.remove(item.id);
        toast.success(`La catégorie "${item.name}" a été supprimée`);
      } else if (type === 'employee') {
        await usersService.remove(item.id);
        toast.success(`Le compte "${item.first_name} ${item.last_name}" a été supprimé`);
      }
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      // Message d'erreur serveur (ex: catégorie liée à des produits, ou client lié à des ventes)
      toast.error(err.response?.data?.message || 'Impossible de supprimer cet enregistrement');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── Colonnes des 4 tableaux ───────────────────────────────────────────────
  const clientColumns = [
    {
      key: 'name',
      header: 'NOM DU CLIENT',
      render: (c) => <span style={{ fontWeight: 600 }}>{c.name}</span>,
    },
    {
      key: 'email',
      header: 'EMAIL',
      render: (c) => c.email || <span className="text-muted">—</span>,
    },
    {
      key: 'phone',
      header: 'TÉLÉPHONE',
      render: (c) => c.phone || <span className="text-muted">—</span>,
    },
    {
      key: 'created_at',
      header: "DATE D'AJOUT",
      render: (c) => formatDate(c.created_at),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: 'text-right',
      render: (c) => (
        <div className="flex-gap-2" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => handleOpenEdit('client', c)}
            title="Modifier"
          >
            <Pencil size={15} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => setDeleteTarget({ type: 'client', item: c })}
            title="Supprimer"
            style={{ color: 'var(--color-danger)' }}
          >
            <Trash2 size={15} strokeWidth={1.75} />
          </button>
        </div>
      ),
    },
  ];

  const supplierColumns = [
    {
      key: 'name',
      header: 'FOURNISSEUR',
      render: (s) => <span style={{ fontWeight: 600 }}>{s.name}</span>,
    },
    {
      key: 'email',
      header: 'EMAIL',
      render: (s) => s.email || <span className="text-muted">—</span>,
    },
    {
      key: 'phone',
      header: 'TÉLÉPHONE',
      render: (s) => s.phone || <span className="text-muted">—</span>,
    },
    {
      key: 'address',
      header: 'ADRESSE',
      render: (s) => s.address || <span className="text-muted">—</span>,
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: 'text-right',
      render: (s) => (
        <div className="flex-gap-2" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => handleOpenEdit('supplier', s)}
            title="Modifier"
          >
            <Pencil size={15} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => setDeleteTarget({ type: 'supplier', item: s })}
            title="Supprimer"
            style={{ color: 'var(--color-danger)' }}
          >
            <Trash2 size={15} strokeWidth={1.75} />
          </button>
        </div>
      ),
    },
  ];

  const categoryColumns = [
    {
      key: 'name',
      header: 'NOM DE LA CATÉGORIE',
      render: (cat) => <span style={{ fontWeight: 600 }}>{cat.name}</span>,
    },
    {
      key: 'created_at',
      header: 'DATE DE CRÉATION',
      render: (cat) => formatDate(cat.created_at),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: 'text-right',
      render: (cat) => (
        <div className="flex-gap-2" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => handleOpenEdit('category', cat)}
            title="Modifier"
          >
            <Pencil size={15} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => setDeleteTarget({ type: 'category', item: cat })}
            title="Supprimer"
            style={{ color: 'var(--color-danger)' }}
          >
            <Trash2 size={15} strokeWidth={1.75} />
          </button>
        </div>
      ),
    },
  ];

  const employeeColumns = [
    {
      key: 'name',
      header: 'COLLABORATEUR',
      render: (u) => (
        <div>
          <span style={{ fontWeight: 600 }}>
            {u.first_name} {u.last_name}
          </span>
          {u.id === user?.userId && <span className="text-muted text-xs"> (vous)</span>}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'EMAIL PROFESSIONNEL',
      render: (u) => u.email,
    },
    {
      key: 'role',
      header: 'RÔLE',
      render: (u) => (
        <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`}>
          {u.role === 'admin' ? 'Administrateur' : 'Personnel'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'STATUT',
      render: (u) => (
        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
          {u.is_active ? 'Actif' : 'Inactif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: 'text-right',
      render: (u) => (
        <div className="flex-gap-2" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => handleOpenEdit('employee', u)}
            title="Modifier"
          >
            <Pencil size={15} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => setDeleteTarget({ type: 'employee', item: u })}
            disabled={u.id === user?.userId}
            title={u.id === user?.userId ? 'Impossible de se supprimer soi-même' : 'Supprimer'}
            style={{ color: u.id === user?.userId ? '#A89F91' : 'var(--color-danger)' }}
          >
            <Trash2 size={15} strokeWidth={1.75} />
          </button>
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
            Partenaires & Structure
          </h2>
          <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>
            Gestion centralisée des clients, fournisseurs, catégories et de l'équipe
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (activeTab === 'clients') handleOpenCreate('client');
            else if (activeTab === 'suppliers') handleOpenCreate('supplier');
            else if (activeTab === 'categories') handleOpenCreate('category');
            else if (activeTab === 'users') handleOpenCreate('employee');
          }}
        >
          <Plus size={16} strokeWidth={2} />
          {activeTab === 'clients' && 'Nouveau client'}
          {activeTab === 'suppliers' && 'Nouveau fournisseur'}
          {activeTab === 'categories' && 'Nouvelle catégorie'}
          {activeTab === 'users' && 'Nouveau collaborateur'}
        </button>
      </div>

      {/* ── Onglets de navigation ────────────────────────────────────── */}
      <div className="login-tabs" style={{ maxWidth: 640 }}>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          <Users size={16} strokeWidth={1.75} style={{ display: 'inline', marginRight: 6 }} />
          Clients ({clients.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          <Building size={16} strokeWidth={1.75} style={{ display: 'inline', marginRight: 6 }} />
          Fournisseurs ({suppliers.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Tag size={16} strokeWidth={1.75} style={{ display: 'inline', marginRight: 6 }} />
          Catégories ({categories.length})
        </button>
        {isAdmin && (
          <button
            type="button"
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <UserCheck size={16} strokeWidth={1.75} style={{ display: 'inline', marginRight: 6 }} />
            Employés ({employees.length})
          </button>
        )}
      </div>

      {/* ── Tableau du contenu de l'onglet actif ─────────────────────── */}
      {loading ? (
        <Spinner />
      ) : (
        <>
          {activeTab === 'clients' && (
            <DataTable
              columns={clientColumns}
              data={clients}
              emptyText="Aucun client enregistré pour votre commerce"
            />
          )}

          {activeTab === 'suppliers' && (
            <DataTable
              columns={supplierColumns}
              data={suppliers}
              emptyText="Aucun fournisseur enregistré pour votre commerce"
            />
          )}

          {activeTab === 'categories' && (
            <DataTable
              columns={categoryColumns}
              data={categories}
              emptyText="Aucune catégorie enregistrée pour votre commerce"
            />
          )}

          {activeTab === 'users' && isAdmin && (
            <DataTable
              columns={employeeColumns}
              data={employees}
              emptyText="Aucun collaborateur enregistré"
            />
          )}
        </>
      )}

      {/* ── Modale de Création / Modification ──────────────────────────── */}
      {modalType && (
        <Modal
          title={
            modalMode === 'create'
              ? modalType === 'client'
                ? 'Nouveau client'
                : modalType === 'supplier'
                  ? 'Nouveau fournisseur'
                  : modalType === 'category'
                    ? 'Nouvelle catégorie'
                    : 'Nouveau collaborateur'
              : modalType === 'client'
                ? 'Modifier le client'
                : modalType === 'supplier'
                  ? 'Modifier le fournisseur'
                  : modalType === 'category'
                    ? 'Modifier la catégorie'
                    : 'Modifier le collaborateur'
          }
          onClose={() => setModalType(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalType(null)}
                disabled={saving}
              >
                Annuler
              </button>
              <button type="submit" form="crud-form" className="btn btn-primary" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </>
          }
        >
          <form id="crud-form" onSubmit={handleSave} className="flex-col gap-4" noValidate>
            {modalType === 'client' && (
              <>
                <FormField
                  label="Nom du client / Société"
                  name="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={formErrors.name}
                  placeholder="Ex: Société Carthage"
                  required
                />
                <FormField
                  label="Adresse email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@client.com"
                />
                <FormField
                  label="Numéro de téléphone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+216 71 000 000"
                />
              </>
            )}

            {modalType === 'supplier' && (
              <>
                <FormField
                  label="Nom du fournisseur"
                  name="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={formErrors.name}
                  placeholder="Ex: TechSupply SA"
                  required
                />
                <FormField
                  label="Adresse email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@fournisseur.com"
                />
                <FormField
                  label="Numéro de téléphone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+216 71 111 222"
                />
                <FormField
                  label="Adresse postale / Siège"
                  name="address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Zone Industrielle, Tunis"
                />
              </>
            )}

            {modalType === 'category' && (
              <FormField
                label="Nom de la catégorie"
                name="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                placeholder="Ex: Électronique, Alimentation…"
                required
              />
            )}

            {modalType === 'employee' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormField
                    label="Prénom"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    error={formErrors.firstName}
                    required
                  />
                  <FormField
                    label="Nom"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    error={formErrors.lastName}
                    required
                  />
                </div>

                {modalMode === 'create' && (
                  <>
                    <FormField
                      label="Email professionnel"
                      name="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      error={formErrors.email}
                      required
                    />
                    <FormField
                      label="Mot de passe initial (8+ caractères)"
                      name="password"
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      error={formErrors.password}
                      required
                    />
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">Rôle d'accès</label>
                  <select
                    className="form-select"
                    value={formData.role || 'staff'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="staff">Personnel (Vente & consultation)</option>
                    <option value="admin">Administrateur (Gestion complète)</option>
                  </select>
                </div>

                {modalMode === 'edit' && (
                  <label className="flex-gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Compte actif</span>
                  </label>
                )}
              </>
            )}
          </form>
        </Modal>
      )}

      {/* ── Modale de Confirmation de Suppression ──────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={
          deleteTarget?.type === 'client'
            ? 'Supprimer le client'
            : deleteTarget?.type === 'supplier'
              ? 'Supprimer le fournisseur'
              : deleteTarget?.type === 'category'
                ? 'Supprimer la catégorie'
                : 'Supprimer le collaborateur'
        }
        message={`Êtes-vous sûr de vouloir supprimer "${
          deleteTarget?.item?.name ||
          `${deleteTarget?.item?.first_name || ''} ${deleteTarget?.item?.last_name || ''}`
        }" ? Cette action est irréversible.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
