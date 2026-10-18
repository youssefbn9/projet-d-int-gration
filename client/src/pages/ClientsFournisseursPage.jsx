import { useState } from 'react';
import SuppliersPage from './SuppliersPage';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../utils/format';
import { Modal, EmptyState } from '../components/UI';
import {
  Users,
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building,
} from 'lucide-react';

const INITIAL_CLIENTS = [
  {
    id: 1,
    name: 'Société Carthage Distribution',
    contact: 'Amine Ben Salem',
    email: 'contact@carthage-distrib.tn',
    phone: '+216 71 890 120',
    address: 'Zone Industrielle Charguia, Tunis',
    ordersCount: 24,
    totalSpent: 18450.0,
    status: 'Actif',
  },
  {
    id: 2,
    name: 'Supérette Les Oliviers',
    contact: 'Sonia Trabelsi',
    email: 'direction@lesoliviers.tn',
    phone: '+216 73 456 789',
    address: 'Avenue Habib Bourguiba, Sousse',
    ordersCount: 15,
    totalSpent: 9280.5,
    status: 'Actif',
  },
  {
    id: 3,
    name: 'Hôtel Thalassa & Spa',
    contact: 'Karim Mansour',
    email: 'achats@thalassa-resort.com',
    phone: '+216 72 230 450',
    address: 'Zone Touristique, Hammamet',
    ordersCount: 38,
    totalSpent: 42100.0,
    status: 'Actif',
  },
  {
    id: 4,
    name: 'Café & Lounge La Marina',
    contact: 'Youssef Gharbi',
    email: 'lamarina.bizerte@gmail.com',
    phone: '+216 72 550 110',
    address: 'Vieux Port, Bizerte',
    ordersCount: 8,
    totalSpent: 3450.0,
    status: 'Actif',
  },
];

export default function ClientsFournisseursPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('fournisseurs');
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [search, setSearch] = useState('');
  const [clientModal, setClientModal] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
  });

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateClient = (e) => {
    e.preventDefault();
    if (!clientForm.name.trim()) return;
    const newClient = {
      id: Date.now(),
      name: clientForm.name,
      contact: clientForm.contact || 'Contact Principal',
      email: clientForm.email,
      phone: clientForm.phone,
      address: clientForm.address,
      ordersCount: 0,
      totalSpent: 0,
      status: 'Actif',
    };
    setClients([newClient, ...clients]);
    setClientModal(false);
    setClientForm({ name: '', contact: '', email: '', phone: '', address: '' });
  };

  const handleDeleteClient = (id) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex-col gap-6">
      {/* ── En-tête Général ──────────────────────────────────────────────── */}
      <div className="page-header flex-between">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Clients & Fournisseurs
          </h2>
          <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>
            Gestion de vos relations commerciales, partenariats et comptes clients
          </p>
        </div>
      </div>

      {/* ── Onglets soulignés ────────────────────────────────────────────── */}
      <div className="tabs-nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'fournisseurs'}
          className={`tab-btn${activeTab === 'fournisseurs' ? ' active' : ''}`}
          onClick={() => setActiveTab('fournisseurs')}
        >
          <Package size={18} strokeWidth={1.75} />
          Fournisseurs & Approvisionnements
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'clients'}
          className={`tab-btn${activeTab === 'clients' ? ' active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          <Users size={18} strokeWidth={1.75} />
          Comptes Clients & Professionnels
        </button>
      </div>

      {/* ── Contenu Onglet Fournisseurs ──────────────────────────────────── */}
      {activeTab === 'fournisseurs' && (
        <div>
          <SuppliersPage />
        </div>
      )}

      {/* ── Contenu Onglet Clients ───────────────────────────────────────── */}
      {activeTab === 'clients' && (
        <div className="flex-col gap-6">
          <div className="filter-bar flex-between">
            <div className="search-input-wrap" style={{ minWidth: 280 }}>
              <Search
                size={16}
                strokeWidth={1.75}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-secondary)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Rechercher par raison sociale, contact…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36, height: 42 }}
              />
            </div>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setClientModal(true)}
              >
                <Plus size={16} strokeWidth={2} />
                Nouveau client
              </button>
            )}
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>CLIENT / RAISON SOCIALE</th>
                  <th>CONTACT & COORDONNÉES</th>
                  <th>LOCALISATION</th>
                  <th className="text-right">COMMANDES</th>
                  <th className="text-right">TOTAL ACHATS</th>
                  {isAdmin && <th className="text-right">ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5}>
                      <EmptyState
                        icon={Users}
                        text="Aucun client trouvé"
                        sub="Ajoutez vos premiers comptes clients ou modifiez vos critères de recherche."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {client.name}
                        </div>
                        <div className="text-muted text-xs">Contact : {client.contact}</div>
                      </td>
                      <td>
                        <div className="flex-col gap-1 text-xs">
                          {client.email && (
                            <span className="flex-gap-2">
                              <Mail size={12} strokeWidth={1.75} className="text-muted" />
                              {client.email}
                            </span>
                          )}
                          {client.phone && (
                            <span className="flex-gap-2">
                              <Phone size={12} strokeWidth={1.75} className="text-muted" />
                              {client.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex-gap-2 text-xs text-muted">
                          <Building size={14} strokeWidth={1.75} />
                          <span>{client.address || '—'}</span>
                        </div>
                      </td>
                      <td className="text-right" style={{ fontWeight: 600 }}>
                        {formatNumber(client.ordersCount)}
                      </td>
                      <td className="text-right" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formatCurrency(client.totalSpent)}
                      </td>
                      {isAdmin && (
                        <td className="text-right">
                          <div className="flex-gap-1" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn-icon"
                              title="Modifier le client"
                              aria-label="Modifier"
                            >
                              <Pencil size={15} strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => handleDeleteClient(client.id)}
                              title="Supprimer le client"
                              aria-label="Supprimer"
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

          {/* ── Modal Nouveau Client ──────────────────────────────────────── */}
          {clientModal && (
            <Modal
              title="Ajouter un compte client"
              onClose={() => setClientModal(false)}
              footer={
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setClientModal(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" form="new-client-form" className="btn btn-primary">
                    Enregistrer le client
                  </button>
                </>
              }
            >
              <form id="new-client-form" onSubmit={handleCreateClient} className="flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Raison sociale / Nom complet *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    placeholder="Ex: Société Maghreb Épicerie"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom du contact direct</label>
                  <input
                    type="text"
                    className="form-input"
                    value={clientForm.contact}
                    onChange={(e) => setClientForm({ ...clientForm, contact: e.target.value })}
                    placeholder="Ex: Mourad Ben Amor"
                  />
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Adresse email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={clientForm.email}
                      onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                      placeholder="client@domaine.tn"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Numéro de téléphone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={clientForm.phone}
                      onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                      placeholder="+216 71 ..."
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Adresse & Ville</label>
                  <input
                    type="text"
                    className="form-input"
                    value={clientForm.address}
                    onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                    placeholder="Ex: 12 Rue de la Liberté, Tunis"
                  />
                </div>
              </form>
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}
