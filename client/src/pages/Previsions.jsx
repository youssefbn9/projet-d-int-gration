import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
} from 'lucide-react';
import { forecastService, productService } from '../services';
import { Spinner, Alert, Badge } from '../components/UI';
import { formatNumber } from '../utils/format';

export default function Previsions() {
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productForecast, setProductForecast] = useState(null);

  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [error, setError] = useState('');

  // ── Chargement initial des alertes et de la liste des produits ─────────────
  useEffect(() => {
    let mounted = true;
    Promise.all([
      forecastService.getAlerts(),
      productService.getAll({ limit: 100 }),
    ])
      .then(([alertsRes, prodsRes]) => {
        if (!mounted) return;
        const alts = alertsRes.data.data || [];
        const prods = prodsRes.data.data?.items || prodsRes.data.data?.products || prodsRes.data.data || [];
        setAlerts(alts);
        setProducts(prods);

        // Sélectionner par défaut le premier produit en alerte, sinon le premier produit du catalogue
        if (alts.length > 0) {
          setSelectedProductId(String(alts[0].product.id));
        } else if (prods.length > 0) {
          setSelectedProductId(String(prods[0].id));
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.response?.data?.message || 'Erreur lors du chargement des prévisions.');
      })
      .finally(() => {
        if (mounted) setLoadingAlerts(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // ── Chargement du modèle et prévision pour le produit sélectionné ──────────
  const fetchProductForecast = useCallback(async (id) => {
    if (!id) return;
    setLoadingForecast(true);
    try {
      const res = await forecastService.getProductForecast(id);
      setProductForecast(res.data.data);
    } catch {
      setProductForecast(null);
    } finally {
      setLoadingForecast(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchProductForecast(selectedProductId);
    }
  }, [selectedProductId, fetchProductForecast]);

  // ── Préparation de la série de données Recharts combinée ───────────────────
  const chartData = useMemo(() => {
    if (!productForecast) return [];
    const { history = [], forecast = [] } = productForecast;

    const data = [];

    // 1. Les 30 jours d'historique
    history.forEach((h, idx) => {
      const isLastHistory = idx === history.length - 1;
      data.push({
        date: h.date ? h.date.slice(5) : `J-${29 - idx}`,
        fullDate: h.date,
        historique: h.quantity,
        // On connecte le dernier point historique au début de la courbe de prévision
        prevision: isLastHistory ? h.quantity : null,
      });
    });

    // 2. Les 7 jours de prévision
    forecast.forEach((f) => {
      data.push({
        date: f.date ? f.date.slice(5) : `+J`,
        fullDate: f.date,
        historique: null,
        prevision: f.quantity,
      });
    });

    return data;
  }, [productForecast]);

  // Gravité du délai avant rupture
  const getSeverityBadge = (days) => {
    if (days === null || days === undefined) {
      return <Badge type="success">Stock pérenne</Badge>;
    }
    if (days <= 2) {
      return <Badge type="danger">Critique : ~{days} j</Badge>;
    }
    if (days <= 4) {
      return <Badge type="warning">Urgent : ~{days} j</Badge>;
    }
    return <Badge type="info">Attention : ~{days} j</Badge>;
  };

  if (loadingAlerts) {
    return (
      <div style={{ padding: '3rem' }}>
        <Spinner text="Calcul des modèles prédictifs..." />
      </div>
    );
  }

  const model = productForecast?.model || { slope: 0, intercept: 0, r2: 0 };
  const avgPerDay = productForecast?.avgForecastPerDay ?? 0;
  const daysLeft = productForecast?.daysBeforeStockout;
  const currentStock = productForecast?.product?.stock ?? 0;

  // Calcul du total des ventes passées sur les 30 jours
  const totalSales30Days = productForecast?.history?.reduce((acc, h) => acc + h.quantity, 0) || 0;
  const isInsufficientData = totalSales30Days < 3;

  return (
    <div className="flex-col gap-6">
      {/* ── En-tête ─────────────────────────────────────────────────────────── */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)' }}>
              Prévisions des Ventes & Alertes de Rupture
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '12px',
                backgroundColor: '#ede9fe',
                color: '#6d28d9',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={12} /> IA / Moindres Carrés
            </span>
          </div>
          <p className="text-muted" style={{ marginTop: '4px' }}>
            Modèle prédictif linéaire analysant la vélocité et les tendances pour anticiper les réapprovisionnements.
          </p>
        </div>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* ── Section des Produits en Risque de Rupture Imminente ──────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <AlertTriangle size={18} style={{ color: '#e53e3e' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
            Produits en Alerte de Rupture (&lt; 7 jours) — {alerts.length} produit(s)
          </h2>
        </div>

        {alerts.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--color-bg-alt)', borderRadius: '8px' }}>
            <CheckCircle2 size={32} style={{ color: '#38a169', margin: '0 auto 8px' }} />
            <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>
              Excellent ! Aucun produit n'est menacé de rupture dans les 7 prochains jours.
            </p>
            <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
              Le rythme de vos ventes et vos niveaux de stock actuels garantissent une continuité opérationnelle.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {alerts.map((al) => {
              const isSelected = String(al.product.id) === selectedProductId;
              return (
                <div
                  key={al.product.id}
                  onClick={() => setSelectedProductId(String(al.product.id))}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: isSelected ? 'var(--color-primary-light, #fff8f3)' : 'var(--color-bg-alt)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                        {al.product.name}
                      </strong>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        SKU: {al.product.sku}
                      </div>
                    </div>
                    {getSeverityBadge(al.daysBeforeStockout)}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <span>Stock : <strong>{al.product.stock}</strong></span>
                    <span>Ventes : <strong>~{al.avgForecastPerDay}/j</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Sélecteur de produit & Vue Prévisionnelle Détaillée ───────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
              Courbe Prévisionnelle du Produit
            </h2>
            <span className="text-muted" style={{ fontSize: '12px' }}>
              Historique des 30 derniers jours et projection sur les 7 prochains jours
            </span>
          </div>

          {/* Sélecteur déroulant de produit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Produit sélectionné :
            </span>
            <select
              className="form-input form-select"
              style={{ minWidth: '240px' }}
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) [Stock: {p.stock_quantity}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bannière si données insuffisantes */}
        {isInsufficientData && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#ebf8ff',
              border: '1px solid #bee3f8',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '1.25rem',
              color: '#2b6cb0',
              fontSize: '13px',
            }}
          >
            <Info size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Données historiques restreintes :</strong> Très peu de ventes ont été enregistrées pour ce produit sur les 30 derniers jours. La prévision linéaire reflète une demande minimale.
            </span>
          </div>
        )}

        {/* Cartes d'indicateurs du modèle */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Stock actuel */}
          <div className="card" style={{ padding: '12px', backgroundColor: 'var(--color-bg-alt)' }}>
            <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
              Stock Actuel
            </span>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px', color: 'var(--color-text)' }}>
              {currentStock} unité(s)
            </div>
          </div>

          {/* Vélocité prévue */}
          <div className="card" style={{ padding: '12px', backgroundColor: 'var(--color-bg-alt)' }}>
            <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
              Moyenne Prévue / Jour
            </span>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px', color: '#6d28d9' }}>
              ~{avgPerDay} unité(s)/j
            </div>
          </div>

          {/* Délai avant rupture */}
          <div className="card" style={{ padding: '12px', backgroundColor: 'var(--color-bg-alt)' }}>
            <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
              Délai Avant Rupture
            </span>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px', color: daysLeft !== null && daysLeft < 7 ? '#e53e3e' : '#38a169' }}>
              {daysLeft !== null ? `~${daysLeft} jour(s)` : 'Stock assuré'}
            </div>
          </div>

          {/* Qualité du modèle R² */}
          <div className="card" style={{ padding: '12px', backgroundColor: 'var(--color-bg-alt)' }}>
            <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
              Indice de Fiabilité R²
            </span>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px', color: 'var(--color-text)' }}>
              {(model.r2 * 100).toFixed(1)} %
            </div>
          </div>
        </div>

        {/* Graphique Recharts */}
        {loadingForecast ? (
          <div style={{ padding: '3rem' }}>
            <Spinner text="Mise à jour du graphique prévisionnel..." />
          </div>
        ) : (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip
                  formatter={(value, name) => [
                    `${value} unité(s)`,
                    name === 'historique' ? 'Ventes Réelles' : 'Projection Prédictive (J+7)',
                  ]}
                  labelFormatter={(lbl, arr) => arr[0]?.payload?.fullDate || lbl}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  formatter={(val) => (val === 'historique' ? 'Historique réel (30j)' : 'Prévision ML (7j)')}
                  wrapperStyle={{ paddingTop: '10px' }}
                />
                {/* Historique réel (trait plein orange) */}
                <Line
                  type="monotone"
                  dataKey="historique"
                  stroke="#e65100"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#e65100' }}
                  connectNulls={false}
                />
                {/* Prévision 7 jours (pointillé violet) */}
                <Line
                  type="monotone"
                  dataKey="prevision"
                  stroke="#805ad5"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#805ad5' }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
