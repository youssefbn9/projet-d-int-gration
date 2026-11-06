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
import {
  Wallet,
  Receipt,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  Package,
} from 'lucide-react';

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
    return <Spinner text="Chargement du tableau de bord..." />;
  }

  if (error) {
    return <Alert type="danger">{error}</Alert>;
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
      {/* ── En-tête avec message de bienvenue et actions rapides ─────────────── */}
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Bonjour, {firstName}</h1>
          <p className="page-subtitle">
            Voici la situation financière, les tendances de vente et les alertes prédictives de
            votre commerce.
          </p>
        </div>

        <div className="flex-gap-2">
          <Link to="/ventes" className="btn btn-primary btn-sm">
            <Receipt size={16} strokeWidth={1.75} />
            <span>Nouvelle vente</span>
          </Link>
          <Link to="/previsions" className="btn btn-secondary btn-sm">
            <Sparkles size={16} strokeWidth={1.75} />
            <span>Prévisions ML</span>
          </Link>
        </div>
      </div>

      {/* ── 4 Cartes Métriques Clés en Grille ─────────────────────────────────── */}
      <div className="stats-grid">
        {/* Chiffre d'affaires du mois */}
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Chiffre d'affaires du mois</span>
            <div className="stat-value text-primary">{formatCurrency(monthRevenue)}</div>
            <span className="stat-sub">Ventes finalisées ce mois</span>
          </div>
          <div className="stat-icon-wrap blue">
            <Wallet size={22} strokeWidth={1.75} />
          </div>
        </div>

        {/* Nombre de ventes du mois */}
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Commandes du mois</span>
            <div className="stat-value">{formatNumber(monthSalesCount)}</div>
            <span className="stat-sub">Transactions finalisées</span>
          </div>
          <div className="stat-icon-wrap green">
            <Receipt size={22} strokeWidth={1.75} />
          </div>
        </div>

        {/* Produits en stock bas */}
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Produits en stock bas</span>
            <div
              className={`stat-value ${lowStockProducts.length > 0 ? 'text-danger' : ''}`}
            >
              {lowStockProducts.length}
            </div>
            <span className="stat-sub">Sous le seuil d'alerte</span>
          </div>
          <div className="stat-icon-wrap red">
            <AlertTriangle size={22} strokeWidth={1.75} />
          </div>
        </div>

        {/* Alertes de rupture prévues (ML) */}
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Ruptures sous 7 jours</span>
            <div className="stat-value" style={{ color: 'var(--color-purple)' }}>
              {alerts.length}
            </div>
            <span className="stat-sub">Modèle prédictif ML</span>
          </div>
          <div className="stat-icon-wrap purple">
            <Clock size={22} strokeWidth={1.75} />
          </div>
        </div>
      </div>

      {/* ── Graphiques Principaux ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Graphique 1 : Évolution des ventes sur 30 jours avec dégradé bleu léger */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <div>
              <h2 className="card-title">Évolution des Ventes (30 jours)</h2>
              <span className="text-muted text-xs">Total des encaissements journaliers</span>
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
                  <linearGradient id="colorSalesBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
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
                  axisLine={{ stroke: 'var(--color-border)' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), "Chiffre d'affaires"]}
                  labelFormatter={(lbl, arr) => arr[0]?.payload?.date || lbl}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '10px',
                    boxShadow: 'var(--shadow-md)',
                    color: 'var(--color-text)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSalesBlue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique 2 : Top 5 des produits vendus en barres horizontales */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <div>
              <h2 className="card-title">Top 5 des Produits les Plus Vendus</h2>
              <span className="text-muted text-xs">Volumes écoulés sur les 30 derniers jours</span>
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
              <span className="text-muted text-sm">Aucune vente enregistrée récemment</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'var(--color-text)' }}
                    width={110}
                    axisLine={{ stroke: 'var(--color-border)' }}
                  />
                  <Tooltip
                    formatter={(val) => [`${val} unités vendues`, 'Quantité']}
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-md)',
                      color: 'var(--color-text)',
                    }}
                  />
                  <Bar dataKey="total_qty" fill="#2563EB" radius={[0, 6, 6, 0]}>
                    {topProducts.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#2563EB' : index === 1 ? '#06B6D4' : '#60A5FA'}
                      />
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
          gap: '24px',
        }}
      >
        {/* Encart Alertes de Rupture Prévues (Module ML) */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <div className="flex-gap-2">
              <Sparkles size={18} style={{ color: 'var(--color-purple)' }} />
              <h2 className="card-title">Alertes Prédictives ML (&lt; 7 jours)</h2>
            </div>
            <Link
              to="/previsions"
              className="text-primary font-semibold text-xs flex-gap-2"
            >
              <span>Voir tout ({alerts.length})</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div className="flex-col" style={{ padding: '24px 16px', alignItems: 'center', textAlign: 'center' }}>
              <CheckCircle2 size={32} className="text-success" style={{ marginBottom: '8px' }} />
              <p className="font-semibold text-sm">Aucune rupture critique prévue</p>
              <p className="text-muted text-xs" style={{ marginTop: '4px' }}>
                Vos stocks actuels sont suffisants pour les 7 prochains jours.
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
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor:
                      al.daysBeforeStockout <= 2
                        ? 'var(--color-danger-bg)'
                        : 'var(--color-surface-subtle)',
                    border: `1px solid ${
                      al.daysBeforeStockout <= 2
                        ? 'var(--color-danger-border)'
                        : 'var(--color-border)'
                    }`,
                  }}
                >
                  <div>
                    <strong className="text-sm" style={{ color: 'var(--color-text)' }}>
                      {al.product.name}
                    </strong>
                    <div className="text-muted text-xs" style={{ marginTop: '2px' }}>
                      Stock actuel: <strong>{al.product.stock}</strong> | Vente moy.:{' '}
                      {al.avgForecastPerDay}/j
                    </div>
                  </div>

                  <div className="text-right">
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
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <div className="flex-gap-2">
              <AlertTriangle size={18} className="text-danger" />
              <h2 className="card-title">Produits en Stock Bas</h2>
            </div>
            <Link
              to="/produits"
              className="text-primary font-semibold text-xs flex-gap-2"
            >
              <span>Gérer le stock</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="flex-col" style={{ padding: '24px 16px', alignItems: 'center', textAlign: 'center' }}>
              <Package size={32} className="text-success" style={{ marginBottom: '8px' }} />
              <p className="font-semibold text-sm">Stocks sous contrôle</p>
              <p className="text-muted text-xs" style={{ marginTop: '4px' }}>
                Tous vos produits sont au-dessus de leur seuil minimal de sécurité.
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
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <strong className="text-sm" style={{ color: 'var(--color-text)' }}>
                      {p.name}
                    </strong>
                    <div className="text-muted text-xs" style={{ marginTop: '2px' }}>
                      SKU: {p.sku} {p.category_name && `- ${p.category_name}`}
                    </div>
                  </div>

                  <div className="text-right">
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
