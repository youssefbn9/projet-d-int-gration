import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '📊', label: 'Tableau de bord' },
  { to: '/products',  icon: '📦', label: 'Produits' },
  { to: '/sales',     icon: '🛒', label: 'Ventes' },
  { to: '/movements', icon: '🔄', label: 'Mouvements' },
  { to: '/categories',icon: '🏷️', label: 'Catégories' },
  { to: '/suppliers', icon: '🏭', label: 'Fournisseurs' },
];

const ADMIN_ITEMS = [
  { to: '/users', icon: '👥', label: 'Utilisateurs' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="modal-overlay"
          style={{ zIndex: 99 }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📈</div>
          <span className="sidebar-logo-text">StockPro</span>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-title">Navigation</p>
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

          {user?.role === 'admin' && (
            <>
              <p className="nav-section-title" style={{ marginTop: '1rem' }}>Administration</p>
              {ADMIN_ITEMS.map((item) => (
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
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="sidebar-user-role">
                {user?.role === 'admin' ? 'Administrateur' : 'Personnel'}
              </div>
            </div>
            <button
              className="btn btn-icon btn-secondary btn-sm"
              onClick={handleLogout}
              title="Se déconnecter"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
