import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produits from './pages/Produits';
import ClientsFournisseurs from './pages/ClientsFournisseurs';
import Ventes from './pages/Ventes';
import DetailVente from './pages/DetailVente';
import Previsions from './pages/Previsions';
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
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Modules Cœur StockPro */}
              <Route path="/produits" element={<Produits />} />
              <Route path="/clients-fournisseurs" element={<ClientsFournisseurs />} />
              <Route path="/ventes" element={<Ventes />} />
              <Route path="/ventes/:id" element={<DetailVente />} />
              <Route path="/previsions" element={<Previsions />} />
              <Route path="/movements" element={<MovementsPage />} />
              <Route path="/users" element={<UsersPage />} />

              {/* Redirections et alias rétrocompatibles */}
              <Route path="/products" element={<Navigate to="/produits" replace />} />
              <Route path="/sales" element={<Navigate to="/ventes" replace />} />
              <Route path="/sales/:id" element={<Navigate to="/ventes/:id" replace />} />
              <Route path="/categories" element={<Navigate to="/clients-fournisseurs" replace />} />
              <Route path="/suppliers" element={<Navigate to="/clients-fournisseurs" replace />} />
              <Route path="/customers" element={<Navigate to="/clients-fournisseurs" replace />} />
            </Route>

            {/* Redirection par défaut */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
