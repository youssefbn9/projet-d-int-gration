import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { dashboardService, forecastService } from '../services';
import { useAuth } from '../context/AuthContext';
import { Spinner, Alert, Badge } from '../components/UI';
import { formatCurrency, formatNumber } from '../utils/format';
import { Wallet, Receipt, AlertTriangle, ArrowRight, Sparkles, Clock } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Gérant';

  useEffect(() => {
    let mounted = true;
    Promise.all([dashboardService.getStats(), forecastService.getAlerts()])
      .then(([statsRes, alertsRes]) => {
        if (!mounted) return;
        setStats(statsRes.data.data);
        setAlerts((alertsRes.data.data || []).slice(0, 5));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(
          err.response?.data?.message || 'Impossible de charger les données du tableau de bord.'
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem' }}>
        <Spinner text="Chargement du tableau de bord..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <Alert type="danger">{error}</Alert>
      </div>
    );
  }

  const monthRevenue = stats?.monthRevenue || 0;
  const monthSalesCount = stats?.monthSalesCount || 0;
  const lowStockProducts = stats?.lowStockProducts || [];
  const salesByDay = stats?.salesByDay || [];
  const topProducts = stats?.topProducts || [];

  // Formater les dates pour l'axe X (JJ/MM)
  const chartSalesData = salesByDay.map((d) => ({
    ...d,
    formattedDate: d.date ? d.date.slice(5).replace('-', '/') : '',
  }));

  return (
    <div className="flex-col gap-6">
      {/* ── Message de bienvenue ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--color-text)',
              letterSpacing: '-0.02em',
            }}
          >
            Bonjour, {firstName}
          </h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>
            Voici la situation financière, les tendances de vente et les alertes prédictives de
            votre commerce.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/ventes" className="btn btn-primary btn-sm">
            <Receipt size={16} /> Nouvelle vente
          </Link>
          <Link to="/previsions" className="btn btn-secondary btn-sm">
            <Sparkles size={16} /> Prévisions ML
          </Link>
        </div>
      </div>

      {/* ── Cartes métriques clés ────────────────────────────────────────────── */}
      <div className="stats-grid">
        {/* Chiffre d'affaires du mois */}
        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ backgroundColor: 'rgba(230, 81, 0, 0.1)', color: 'var(--color-primary)' }}
          >
            <Wallet size={24} />
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Chiffre d'affaires du mois</span>
            <div className="stat-card-value" style={{ color: 'var(--color-primary)' }}>
              {formatCurrency(monthRevenue)}
            </div>
            <span className="stat-card-sub text-muted">Ventes payées ce mois</span>
          </div>
        </div>

        {/* Nombre de ventes du mois */}
        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ backgroundColor: 'rgba(56, 161, 105, 0.1)', color: '#38a169' }}
          >
            <Receipt size={24} />
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Commandes du mois</span>
            <div className="stat-card-value">{formatNumber(monthSalesCount)}</div>
            <span className="stat-card-sub text-muted">Transactions finalisées</span>
          </div>
        </div>

        {/* Produits en stock bas */}
        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ backgroundColor: 'rgba(229, 62, 62, 0.1)', color: '#e53e3e' }}
          >
            <AlertTriangle size={24} />
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Produits en stock bas</span>
            <div
              className="stat-card-value"
              style={{ color: lowStockProducts.length > 0 ? '#e53e3e' : 'inherit' }}
            >
              {lowStockProducts.length}
            </div>
            <span className="stat-card-sub text-muted">Sous le seuil d'alerte</span>
          </div>
        </div>

        {/* Alertes de rupture prévues */}
        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ backgroundColor: 'rgba(128, 90, 213, 0.1)', color: '#805ad5' }}
          >
            <Clock size={24} />
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Ruptures sous 7 jours</span>
            <div
              className="stat-card-value"
              style={{ color: alerts.length > 0 ? '#805ad5' : 'inherit' }}
            >
              {alerts.length}
            </div>
            <span className="stat-card-sub text-muted">Modèle prédictif ML</span>
          </div>
        </div>
      </div>

      {/* ── Graphiques principaux ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Graphique 1 : Évolution des ventes sur 30 jours */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                Évolution des Ventes (30 jours)
              </h2>
              <span className="text-muted" style={{ fontSize: '12px' }}>
                Total des ventes journalières en DT
              </span>
            </div>
            <Badge type="info">Temps réel</Badge>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartSalesData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e65100" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#e65100" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), "Chiffre d'affaires"]}
                  labelFormatter={(lbl, arr) => arr[0]?.payload?.date || lbl}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#e65100"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique 2 : Top 5 des produits vendus */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                Top 5 des Produits les Plus Vendus
              </h2>
              <span className="text-muted" style={{ fontSize: '12px' }}>
                Volumes écoulés sur les 30 derniers jours
              </span>
            </div>
            <Badge type="muted">Volume</Badge>
          </div>

          {topProducts.length === 0 ? (
            <div
              style={{
                height: 260,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="text-muted">Aucune vente enregistrée récemment</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'var(--color-text)' }}
                    width={120}
                  />
                  <Tooltip
                    formatter={(val) => [`${val} unités vendues`, 'Quantité']}
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="total_qty" fill="#e65100" radius={[0, 4, 4, 0]}>
                    {topProducts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#e65100' : '#f97316'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Deuxième section : Alertes de rupture ML & Produits en stock bas ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Encart Alertes de Rupture Prévues (Module ML) */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: '#805ad5' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                Alertes Prédictives ML (Rupture sous 7 jours)
              </h2>
            </div>
            <Link
              to="/previsions"
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}
            >
              Voir tout ({alerts.length}) <ArrowRight size={12} style={{ display: 'inline' }} />
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <p className="text-muted" style={{ fontSize: '14px' }}>
                ✅ Aucune rupture critique prévue pour les 7 prochains jours.
              </p>
            </div>
          ) : (
            <div className="flex-col gap-3">
              {alerts.map((al) => (
                <div
                  key={al.product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: al.daysBeforeStockout <= 2 ? '#fff5f5' : 'var(--color-bg-alt)',
                    border: `1px solid ${al.daysBeforeStockout <= 2 ? '#feb2b2' : 'var(--color-border)'}`,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                      {al.product.name}
                    </strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Stock actuel: <strong>{al.product.stock}</strong> | Vente moy.:{' '}
                      {al.avgForecastPerDay}/j
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <Badge type={al.daysBeforeStockout <= 2 ? 'danger' : 'warning'}>
                      Rupture dans ~{al.daysBeforeStockout} j
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Encart Produits en stock bas */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: '#e53e3e' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                Produits en Stock Bas (Seuil d'alerte)
              </h2>
            </div>
            <Link
              to="/produits"
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}
            >
              Gérer le stock <ArrowRight size={12} style={{ display: 'inline' }} />
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <p className="text-muted" style={{ fontSize: '14px' }}>
                🎉 Tous vos stocks sont au-dessus de leur seuil minimal de sécurité.
              </p>
            </div>
          ) : (
            <div className="flex-col gap-3">
              {lowStockProducts.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-bg-alt)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                      {p.name}
                    </strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      SKU: {p.sku} {p.category_name && `• Catégorie: ${p.category_name}`}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <Badge type="danger">
                      {p.stock_quantity} / min {p.stock_min}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
