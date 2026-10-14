import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import RootRedirect from './pages/RootRedirect';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import MovementsPage from './pages/MovementsPage';
import CategoriesPage from './pages/CategoriesPage';
import SuppliersPage from './pages/SuppliersPage';
import UsersPage from './pages/UsersPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard"  element={<DashboardPage />} />
            <Route path="/products"   element={<ProductsPage />} />
            <Route path="/sales"      element={<SalesPage />} />
            <Route path="/movements"  element={<MovementsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/suppliers"  element={<SuppliersPage />} />
            <Route path="/users"      element={<UsersPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
