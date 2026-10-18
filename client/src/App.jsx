import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import DetailVentePage from './pages/DetailVentePage';
import ClientsFournisseursPage from './pages/ClientsFournisseursPage';
import PrevisionsPage from './pages/PrevisionsPage';
import SuppliersPage from './pages/SuppliersPage';
import CategoriesPage from './pages/CategoriesPage';
import MovementsPage from './pages/MovementsPage';
import UsersPage from './pages/UsersPage';

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

              {/* Routes cœur StockPro */}
              <Route path="/produits" element={<ProductsPage />} />
              <Route path="/clients-fournisseurs" element={<ClientsFournisseursPage />} />
              <Route path="/ventes" element={<SalesPage />} />
              <Route path="/ventes/:id" element={<DetailVentePage />} />
              <Route path="/previsions" element={<PrevisionsPage />} />

              {/* Alias & modules complémentaires */}
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
