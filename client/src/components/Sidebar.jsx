import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Package2,
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  History,
  TrendingUp,
  UserCheck,
  LogOut,
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'Pilotage',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { to: '/produits', icon: Package, label: 'Produits' },
      { to: '/clients-fournisseurs', icon: Users, label: 'Clients & Fournisseurs' },
      { to: '/ventes', icon: ShoppingCart, label: 'Ventes' },
      { to: '/movements', icon: History, label: 'Mouvements' },
    ],
  },
  {
    title: 'Analytique',
    items: [
      { to: '/previsions', icon: TrendingUp, label: 'Prévisions' },
    ],
  },
];

const ADMIN_SECTION = {
  title: 'Administration',
  items: [
    { to: '/users', icon: UserCheck, label: 'Équipe & Utilisateurs' },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] || user.name?.[0] || 'U'}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  const companyDisplayName =
    user?.companyName ||
    user?.company_name ||
    (user?.companyId ? `Commerce #${user.companyId}` : 'Mon Commerce');

  return (
    <>
      {open && (
        <div
          className="modal-overlay"
          style={{ zIndex: 49 }}
          onClick={onClose}
          aria-label="Fermer le menu"
        />
      )}

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Package2 size={20} strokeWidth={1.75} />
          </div>
          <div>
            <div className="sidebar-logo-text">StockPro</div>
            <div className="sidebar-company-name" title={companyDisplayName}>
              {companyDisplayName}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="sidebar-section-title">{section.title}</div>
              {section.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar-link${isActive ? ' active' : ''}`
                    }
                  >
                    <span className="sidebar-link-icon">
                      <IconComponent size={18} strokeWidth={1.75} />
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}

          {user?.role === 'admin' && (
            <div>
              <div className="sidebar-section-title">{ADMIN_SECTION.title}</div>
              {ADMIN_SECTION.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar-link${isActive ? ' active' : ''}`
                    }
                  >
                    <span className="sidebar-link-icon">
                      <IconComponent size={18} strokeWidth={1.75} />
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.name ||
                  `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                  user?.email}
              </div>
              <div className="sidebar-user-role">
                {user?.role === 'admin' ? 'Administrateur' : 'Personnel'}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-icon btn-sm"
              onClick={handleLogout}
              title="Se déconnecter"
              aria-label="Déconnexion"
            >
              <LogOut size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
