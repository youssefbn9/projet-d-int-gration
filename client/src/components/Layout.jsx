import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Spinner from './Spinner';

const PAGE_TITLES = {
  dashboard: 'Tableau de bord',
  produits: 'Gestion des Produits',
  'clients-fournisseurs': 'Clients & Fournisseurs',
  ventes: 'Gestion des Ventes',
  previsions: 'Prévisions des Ventes',
  products: 'Produits',
  sales: 'Ventes',
  movements: 'Mouvements de stock',
  categories: 'Catégories',
  suppliers: 'Fournisseurs',
  users: 'Utilisateurs',
};

export default function Layout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  const segment = location.pathname.split('/')[1] || 'dashboard';
  const title = PAGE_TITLES[segment] || 'StockPro';

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar
          title={title}
          onMenuToggle={() => setSidebarOpen((open) => !open)}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
