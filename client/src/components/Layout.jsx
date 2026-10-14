import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Spinner } from './UI';

// Map des titres par segment de route
const PAGE_TITLES = {
  dashboard:  'Tableau de bord',
  products:   'Produits',
  sales:      'Ventes',
  movements:  'Mouvements de stock',
  categories: 'Catégories',
  suppliers:  'Fournisseurs',
  users:      'Utilisateurs',
};

function getTitle() {
  const segment = window.location.pathname.split('/')[1];
  return PAGE_TITLES[segment] || 'StockPro';
}

export default function Layout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar
          title={getTitle()}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
