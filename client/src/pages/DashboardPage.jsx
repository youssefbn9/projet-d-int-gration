import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { productService, saleService } from '../services';
import { useAuth } from '../context/AuthContext';
import { Spinner, Alert, Badge } from '../components/UI';
import { formatCurrency, formatNumber } from '../utils/format';
import { Wallet, Receipt, AlertTriangle, Package } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stockStats, setStockStats] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Gérant';

  useEffect(() => {
    Promise.all([
      productService.getStats(),
      saleService.getDashboard(),
      productService.getAll({ limit: 5 }),
    ])
      .then(([statsRes, dashRes, prodRes]) => {
        setStockStats(statsRes.data.data);
        setDashData(dashRes.data.data);
        const prods = prodRes.data.data?.products || prodRes.data.data || [];
        setLowStockProducts(prods.filter((p) => p.stock_quantity <= (p.stock_min || 5)).slice(0, 5));
      })
      .catch(() => setError('Impossible de charger les données du tableau de bord'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert type="danger">{error}</Alert>;

  const totalRevenue =
    dashData?.revenue?.reduce((sum, d) => sum + parseFloat(d.revenue || 0), 0) || 0;
  const salesCount = dashData?.salesCount ?? 0;

  return (
    <div className="flex-col gap-6">
      {/* ── Message d'accueil ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
          Bonjour, {firstName}
        </h2>
        <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>
          Voici l'état actuel de votre stock et de votre activité commerciale.
        </p>
      </div>

      {/* ── 4 Cartes de statistiques colorées ──────────────────────────── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Chiffre d'affaires</span>
            <span className="stat-value">{formatCurrency(totalRevenue)}</span>
            <span className="stat-sub">Sur les 30 derniers jours</span>
          </div>
          <div className="stat-icon-wrap orange">
            <Wallet size={20} strokeWidth={1.75} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Ventes du mois</span>
            <span className="stat-value">{formatNumber(salesCount)}</span>
            <span className="stat-sub">Commandes finalisées</span>
          </div>
          <div className="stat-icon-wrap turquoise">
            <Receipt size={20} strokeWidth={1.75} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Produits en stock bas</span>
            <span className="stat-value">{formatNumber(stockStats?.low_stock_count ?? 0)}</span>
            <span className="stat-sub">Sous le seuil d'alerte</span>
          </div>
          <div className="stat-icon-wrap emerald">
            <AlertTriangle size={20} strokeWidth={1.75} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Alertes de rupture</span>
            <span className="stat-value">{formatNumber(stockStats?.out_of_stock_count ?? 0)}</span>
            <span className="stat-sub">Stock nul à réapprovisionner</span>
          </div>
          <div className="stat-icon-wrap coral">
            <Package size={20} strokeWidth={1.75} />
          </div>
        </div>
      </div>

      {/* ── Graphiques ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Évolution CA 30 jours */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Évolution des ventes (30 jours)</h3>
            <span className="badge badge-info">Temps réel</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashData?.revenue || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.00} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFE5D2" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#7A6A5E', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(d) => {
                    if (!d) return '';
                    const str = String(d).split('T')[0];
                    const parts = str.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : str;
                  }}
                />
                <YAxis
                  tick={{ fill: '#7A6A5E', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v} TND`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #EFE5D2',
                    boxShadow: '0 4px 16px rgba(58, 46, 40, 0.08)',
                    fontSize: '12px',
                    color: '#3A2E28',
                  }}
                  formatter={(v) => [formatCurrency(v), 'Chiffre d\'affaires']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F97316"
                  strokeWidth={2.5}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 produits */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top 5 des produits vendus</h3>
            <span className="badge badge-muted">Volume</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashData?.topProducts || []}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EFE5D2" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#7A6A5E', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fill: '#7A6A5E', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v.length > 14 ? v.slice(0, 13) + '…' : v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #EFE5D2',
                    boxShadow: '0 4px 16px rgba(58, 46, 40, 0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(v) => [v, 'Unités vendues']}
                />
                <Bar dataKey="total_qty" name="Quantité vendue" fill="#F97316" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Listes "Stock bas" et "Alertes de rupture" ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Articles en alerte stock</h3>
            <Badge type="warning">À réapprovisionner</Badge>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-muted" style={{ padding: '16px 0', fontSize: '13px' }}>
              Aucun produit en stock critique actuellement.
            </p>
          ) : (
            <div className="flex-col" style={{ gap: '10px' }}>
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex-between"
                  style={{
                    padding: '10px 14px',
                    background: 'var(--color-surface-subtle)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text)' }}>{p.name}</div>
                    <div className="text-muted text-xs">SKU: {p.sku}</div>
                  </div>
                  <Badge type={p.stock_quantity === 0 ? 'danger' : 'warning'}>
                    {p.stock_quantity === 0 ? 'Rupture' : `${p.stock_quantity} restants`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Synthèse de gestion</h3>
            <Badge type="success">En ligne</Badge>
          </div>
          <div className="flex-col gap-3" style={{ fontSize: '13px' }}>
            <div className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-muted">Total des références au catalogue</span>
              <span style={{ fontWeight: 700 }}>{formatNumber(stockStats?.total_products ?? 0)}</span>
            </div>
            <div className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-muted">Valeur financière du stock</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                {formatCurrency(stockStats?.stock_value ?? 0)}
              </span>
            </div>
            <div className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-muted">Fournisseurs référencés</span>
              <span style={{ fontWeight: 700 }}>{formatNumber(stockStats?.total_suppliers ?? 2)}</span>
            </div>
            <div className="flex-between" style={{ padding: '8px 0' }}>
              <span className="text-muted">Catégories actives</span>
              <span style={{ fontWeight: 700 }}>{formatNumber(stockStats?.total_categories ?? 4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
