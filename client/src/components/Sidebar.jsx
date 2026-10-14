import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/produits', icon: '📦', label: 'Produits' },
  { to: '/clients-fournisseurs', icon: '👥', label: 'Clients & Fournisseurs' },
  { to: '/ventes', icon: '🛒', label: 'Ventes' },
  { to: '/previsions', icon: '📈', label: 'Prévisions' },
];

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

  const companyDisplayName = user?.companyName || user?.company_name || (user?.companyId ? `Commerce #${user.companyId}` : 'Mon Commerce');

  return (
    <>
      {open && (
        <div
          className="modal-overlay"
          style={{ zIndex: 99 }}
          onClick={onClose}
          aria-label="Fermer le menu"
        />
      )}

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📈</div>
          <div>
            <div className="sidebar-logo-text">StockPro</div>
            <div className="sidebar-company-name text-xs text-muted" title={companyDisplayName}>
              🏢 {companyDisplayName}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-title">Menu principal</p>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email}
              </div>
              <div className="sidebar-user-role">
                {user?.role === 'admin' ? 'Administrateur' : 'Personnel'}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-icon btn-secondary btn-sm"
              onClick={handleLogout}
              title="Se déconnecter"
              aria-label="Déconnexion"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
