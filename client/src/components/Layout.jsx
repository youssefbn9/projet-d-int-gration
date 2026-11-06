import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Spinner from './Spinner';

const PAGE_CONFIG = {
  dashboard: { title: 'Tableau de bord', section: 'Pilotage' },
  produits: { title: 'Catalogue Produits', section: 'Commerce' },
  'clients-fournisseurs': { title: 'Clients & Fournisseurs', section: 'Commerce' },
  ventes: { title: 'Gestion des Ventes', section: 'Commerce' },
  movements: { title: 'Mouvements de stock', section: 'Commerce' },
  previsions: { title: 'Prévisions des Ventes', section: 'Analytique' },
  users: { title: 'Équipe & Utilisateurs', section: 'Administration' },
};

export default function Layout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  const segment = location.pathname.split('/')[1] || 'dashboard';
  const config = PAGE_CONFIG[segment] || { title: 'StockPro', section: 'Application' };

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar
          title={config.title}
          section={config.section}
          onMenuToggle={() => setSidebarOpen((open) => !open)}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
