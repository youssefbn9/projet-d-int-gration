import { BrowserRouter, Routes, Route, Navigate, useParams, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import SuppliersPage from './pages/SuppliersPage';
import CategoriesPage from './pages/CategoriesPage';
import MovementsPage from './pages/MovementsPage';
import UsersPage from './pages/UsersPage';

function ComingSoon({ title, description = 'Cette fonctionnalité sera disponible prochainement dans le cadre de la roadmap StockPro.' }) {
  return (
    <div className="card" style={{ maxWidth: 600, margin: '2rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
      <h2 style={{ marginBottom: '0.5rem' }}>{title}</h2>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>{description}</p>
      <Link to="/dashboard" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
        ← Retour au Tableau de bord
      </Link>
    </div>
  );
}

function SaleDetailPlaceholder() {
  const { id } = useParams();
  return (
    <div className="card" style={{ maxWidth: 700, margin: '1rem auto' }}>
      <div className="card-header flex-between">
        <h2>Détail de la vente #{id}</h2>
        <Link to="/ventes" className="btn btn-secondary btn-sm">← Retour aux ventes</Link>
      </div>
      <div className="card-body">
        <p className="text-muted">Affichage détaillé de la facture et des articles vendus pour la transaction #{id}.</p>
      </div>
    </div>
  );
}

function ClientsFournisseursPage() {
  return (
    <div className="flex-col gap-6">
      <div className="page-header flex-between">
        <div>
          <h2 className="page-title">Partenaires Commerciaux</h2>
          <p className="page-sub">Gestion unifiée de vos clients et fournisseurs</p>
        </div>
      </div>
      <SuppliersPage />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Route publique */}
            <Route path="/login" element={<Login />} />

            {/* Routes protégées sous le Layout */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Routes spécifiées dans Passe 6 */}
              <Route path="/produits" element={<ProductsPage />} />
              <Route path="/clients-fournisseurs" element={<ClientsFournisseursPage />} />
              <Route path="/ventes" element={<SalesPage />} />
              <Route path="/ventes/:id" element={<SaleDetailPlaceholder />} />
              <Route path="/previsions" element={<ComingSoon title="Prévisions & IA" description="Module prédictif des ventes et optimisation des stocks (Sprint 3)." />} />

              {/* Alias et routes complémentaires existantes */}
              <Route path="/products" element={<Navigate to="/produits" replace />} />
              <Route path="/sales" element={<Navigate to="/ventes" replace />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/movements" element={<MovementsPage />} />
              <Route path="/users" element={<UsersPage />} />
            </Route>

            {/* Redirection par défaut */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
