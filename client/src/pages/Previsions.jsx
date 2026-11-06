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
import { Sparkles, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { forecastService, productService } from '../services';
import { Spinner, Alert, Badge } from '../components/UI';

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
    Promise.all([forecastService.getAlerts(), productService.getAll({ limit: 100 })])
      .then(([alertsRes, prodsRes]) => {
        if (!mounted) return;
        const alts = alertsRes.data.data || [];
        const prods =
          prodsRes.data.data?.items || prodsRes.data.data?.products || prodsRes.data.data || [];
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
      <div className="page-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              Prévisions des Ventes & Alertes de Rupture
            </h1>
            <Badge type="purple">
              <Sparkles size={12} strokeWidth={2} /> IA / Moindres Carrés
            </Badge>
          </div>
          <p className="text-muted" style={{ marginTop: '4px', fontSize: '14px' }}>
            Modèle prédictif linéaire analysant la vélocité et les tendances pour anticiper les
            réapprovisionnements.
          </p>
        </div>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* ── Section des Produits en Risque de Rupture Imminente ──────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <AlertTriangle size={18} strokeWidth={1.75} style={{ color: 'var(--color-danger)' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
            Produits en Alerte de Rupture (&lt; 7 jours) — {alerts.length} produit(s)
          </h2>
        </div>

        {alerts.length === 0 ? (
          <div
            style={{
              padding: '1.75rem',
              textAlign: 'center',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            <CheckCircle2 size={32} strokeWidth={1.75} style={{ color: 'var(--color-success)', margin: '0 auto 8px' }} />
            <p style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '15px' }}>
              Aucun produit n'est menacé de rupture dans les 7 prochains jours.
            </p>
            <p className="text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>
              Le rythme des ventes et les niveaux de stock actuels garantissent une continuité
              d'activité optimale.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {alerts.map((al) => {
              const isSelected = String(al.product.id) === selectedProductId;
              return (
                <div
                  key={al.product.id}
                  onClick={() => setSelectedProductId(String(al.product.id))}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: isSelected
                      ? 'var(--color-primary-light)'
                      : 'var(--color-surface)',
                    transition: 'all var(--transition)',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                        {al.product.name}
                      </strong>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                        SKU: {al.product.sku}
                      </div>
                    </div>
                    {getSeverityBadge(al.daysBeforeStockout)}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      Stock : <strong style={{ color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>{al.product.stock}</strong>
                    </span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      Ventes : <strong style={{ color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>~{al.avgForecastPerDay}/j</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Sélecteur de produit & Vue Prévisionnelle Détaillée ───────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div
          className="flex-between"
          style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
              Courbe Prévisionnelle du Produit
            </h2>
            <span className="text-muted" style={{ fontSize: '13px' }}>
              Historique réel (30 jours, trait plein) et projection prédictive (7 jours, pointillés)
            </span>
          </div>

          {/* Sélecteur déroulant de produit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Produit :
            </span>
            <select
              className="form-select"
              style={{ minWidth: '240px', height: '38px', fontSize: '13px' }}
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
              padding: '12px 16px',
              backgroundColor: 'var(--color-primary-light)',
              border: '1px solid var(--color-primary-border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '1.5rem',
              color: 'var(--color-primary)',
              fontSize: '13px',
            }}
          >
            <Info size={18} strokeWidth={1.75} style={{ flexShrink: 0 }} />
            <span>
              <strong>Données historiques restreintes :</strong> Très peu de ventes ont été
              enregistrées pour ce produit sur les 30 derniers jours. La prévision linéaire reflète
              une demande minimale.
            </span>
          </div>
        )}

        {/* Cartes d'indicateurs du modèle */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Stock actuel */}
          <div className="card" style={{ padding: '16px', backgroundColor: 'var(--color-bg)' }}>
            <span
              className="text-muted"
              style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
            >
              Stock Actuel
            </span>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                marginTop: '4px',
                color: 'var(--color-text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {currentStock} unité(s)
            </div>
          </div>

          {/* Vélocité prévue */}
          <div className="card" style={{ padding: '16px', backgroundColor: 'var(--color-bg)' }}>
            <span
              className="text-muted"
              style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
            >
              Moyenne Prévue / Jour
            </span>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                marginTop: '4px',
                color: 'var(--color-purple)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ~{avgPerDay} unité(s)/j
            </div>
          </div>

          {/* Délai avant rupture */}
          <div className="card" style={{ padding: '16px', backgroundColor: 'var(--color-bg)' }}>
            <span
              className="text-muted"
              style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
            >
              Délai Avant Rupture
            </span>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                marginTop: '4px',
                color: daysLeft !== null && daysLeft < 7 ? 'var(--color-danger)' : 'var(--color-success)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {daysLeft !== null ? `~${daysLeft} jour(s)` : 'Stock assuré'}
            </div>
          </div>

          {/* Qualité du modèle R² */}
          <div className="card" style={{ padding: '16px', backgroundColor: 'var(--color-bg)' }}>
            <span
              className="text-muted"
              style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
            >
              Indice de Fiabilité R²
            </span>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                marginTop: '4px',
                color: 'var(--color-text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip
                  formatter={(value, name) => [
                    `${value} unité(s)`,
                    name === 'historique' ? 'Ventes Réelles' : 'Projection Prédictive (J+7)',
                  ]}
                  labelFormatter={(lbl, arr) => arr[0]?.payload?.fullDate || lbl}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: 'var(--color-border)',
                    borderRadius: '10px',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <Legend
                  formatter={(val) =>
                    val === 'historique' ? 'Historique réel (30j)' : 'Prévision ML (7j)'
                  }
                  wrapperStyle={{ paddingTop: '10px' }}
                />
                {/* Historique réel (trait plein bleu #2563EB) */}
                <Line
                  type="monotone"
                  dataKey="historique"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563EB' }}
                  connectNulls={false}
                />
                {/* Prévision 7 jours (pointillé violet #8B5CF6) */}
                <Line
                  type="monotone"
                  dataKey="prevision"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#8B5CF6' }}
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
