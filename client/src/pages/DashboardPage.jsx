import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { productService, saleService } from '../services';
import { Spinner, Alert } from '../components/UI';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

export default function DashboardPage() {
  const [stockStats, setStockStats] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([productService.getStats(), saleService.getDashboard()])
      .then(([statsRes, dashRes]) => {
        setStockStats(statsRes.data.data);
        setDashData(dashRes.data.data);
      })
      .catch(() => setError('Impossible de charger les données'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert type="danger">{error}</Alert>;

  const totalRevenue = dashData?.revenue?.reduce((sum, d) => sum + parseFloat(d.revenue || 0), 0) || 0;

  return (
    <div>
      {/* ── Cartes KPI ─────────────────────────────────────────────────── */}
      <div className="stat-cards">
        <StatCard
          icon="📦"
          label="Produits"
          value={stockStats?.total_products ?? 0}
          accent="#6366f1"
        />
        <StatCard
          icon="⚠️"
          label="Stock faible"
          value={stockStats?.low_stock_count ?? 0}
          accent="#f59e0b"
        />
        <StatCard
          icon="💰"
          label="Valeur du stock"
          value={`${parseFloat(stockStats?.stock_value || 0).toLocaleString('fr-FR')} €`}
          accent="#10b981"
        />
        <StatCard
          icon="🛒"
          label="CA (30 jours)"
          value={`${totalRevenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`}
          accent="#3b82f6"
        />
      </div>

      {/* ── Graphiques ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Revenus (30 jours)</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dashData?.revenue || []}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${parseFloat(v).toFixed(2)} €`, 'Revenus']} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#gradRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Top 5 produits</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dashData?.topProducts || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => (v.length > 14 ? v.slice(0, 13) + '…' : v)}
              />
              <Tooltip />
              <Bar dataKey="total_qty" name="Qté vendue" radius={[0, 4, 4, 0]}>
                {(dashData?.topProducts || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
