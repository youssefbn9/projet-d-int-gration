import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  CheckCircle2,
  Package,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/format';

const PREVISION_DATA = [
  { date: '01 Oct', historique: 1200, prevision: null },
  { date: '05 Oct', historique: 1850, prevision: null },
  { date: '10 Oct', historique: 1400, prevision: null },
  { date: '15 Oct', historique: 2200, prevision: null },
  { date: '20 Oct', historique: 2900, prevision: null },
  { date: '25 Oct', historique: 2600, prevision: null },
  { date: '30 Oct', historique: 3100, prevision: 3100 },
  { date: '05 Nov', historique: null, prevision: 3450 },
  { date: '10 Nov', historique: null, prevision: 3800 },
  { date: '15 Nov', historique: null, prevision: 4100 },
  { date: '20 Nov', historique: null, prevision: 3950 },
  { date: '25 Nov', historique: null, prevision: 4400 },
  { date: '30 Nov', historique: null, prevision: 4850 },
];

const RECOMMANDATIONS = [
  {
    id: 1,
    product: 'Café Espresso Sublime 1kg',
    sku: 'CAF-ESP-01',
    stockActuel: 4,
    demandePrevue: 28,
    dateRecommandee: 'Dans 3 jours',
    urgence: 'danger',
    statut: 'Rupture imminente',
  },
  {
    id: 2,
    product: 'Huile d’Olive Vierge Extra 1L',
    sku: 'HUI-OLV-02',
    stockActuel: 12,
    demandePrevue: 45,
    dateRecommandee: 'Dans 6 jours',
    urgence: 'warning',
    statut: 'Stock bas prévu',
  },
  {
    id: 3,
    product: 'Farine Pâtissière Spéciale 5kg',
    sku: 'FAR-PAT-03',
    stockActuel: 18,
    demandePrevue: 35,
    dateRecommandee: 'Dans 10 jours',
    urgence: 'warning',
    statut: 'À commander',
  },
  {
    id: 4,
    product: 'Chocolat Noir Pâtissier 70%',
    sku: 'CHO-NOI-04',
    stockActuel: 50,
    demandePrevue: 32,
    dateRecommandee: 'Optimisé',
    urgence: 'success',
    statut: 'Niveau optimal',
  },
];

export default function PrevisionsPage() {
  const [horizon, setHorizon] = useState('30j');

  return (
    <div className="flex-col gap-6">
      {/* ── En-tête de page ──────────────────────────────────────────────── */}
      <div className="page-header flex-between">
        <div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--color-text)',
              letterSpacing: '-0.02em',
            }}
          >
            Prévisions & Intelligence des Ventes
          </h2>
          <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>
            Modélisation prédictive de la demande et anticipation des ruptures de stock
          </p>
        </div>
        <div className="flex-gap-3">
          <div className="search-input-wrap" style={{ minWidth: 160 }}>
            <Calendar
              size={16}
              strokeWidth={1.75}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-secondary)',
                pointerEvents: 'none',
              }}
            />
            <select
              className="form-select"
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              style={{ paddingLeft: 36, height: 40 }}
            >
              <option value="15j">Horizon 15 jours</option>
              <option value="30j">Horizon 30 jours</option>
              <option value="60j">Horizon 60 jours</option>
            </select>
          </div>
          <button type="button" className="btn btn-secondary">
            <SlidersHorizontal size={16} strokeWidth={1.75} />
            Paramètres IA
          </button>
        </div>
      </div>

      {/* ── Cartes d'indicateurs colorées ─────────────────────────────────── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Ventes Prévues (30j)</span>
            <div
              className="stat-icon-wrapper"
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <TrendingUp size={20} strokeWidth={1.75} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(24500)}</div>
          <div className="stat-meta" style={{ color: 'var(--color-success)' }}>
            +14.2% vs période précédente
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Indice de Confiance IA</span>
            <div
              className="stat-icon-wrapper"
              style={{
                background: 'var(--color-secondary-light)',
                color: 'var(--color-secondary)',
              }}
            >
              <Sparkles size={20} strokeWidth={1.75} />
            </div>
          </div>
          <div className="stat-value">96.4%</div>
          <div className="stat-meta" style={{ color: 'var(--color-secondary)' }}>
            Modèle calibré sur 180 jours
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Articles à Réapprovisionner</span>
            <div
              className="stat-icon-wrapper"
              style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}
            >
              <AlertTriangle size={20} strokeWidth={1.75} />
            </div>
          </div>
          <div className="stat-value">{formatNumber(3)}</div>
          <div className="stat-meta text-danger">Avant risque de rupture</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Gain Prévisionnel Estimé</span>
            <div
              className="stat-icon-wrapper"
              style={{
                background: 'var(--color-accent-purple-bg)',
                color: 'var(--color-accent-purple)',
              }}
            >
              <CheckCircle2 size={20} strokeWidth={1.75} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(1850)}</div>
          <div className="stat-meta text-muted">Économie sur ventes manquées</div>
        </div>
      </div>

      {/* ── Graphique Prévisionnel Recharts ───────────────────────────────── */}
      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
              Projection de la Demande & Trajectoire des Ventes
            </h3>
            <p className="text-muted" style={{ fontSize: '13px', marginTop: '2px' }}>
              Trait plein orange : Historique réel • Pointillés turquoise : Projection IA
            </p>
          </div>
        </div>
        <div className="card-body">
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={PREVISION_DATA}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFE5D2" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#7A6A5E', fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#7A6A5E', fontSize: 12 }}
                  tickFormatter={(val) => `${val} DT`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #EFE5D2',
                    boxShadow: '0 4px 20px rgba(249, 115, 22, 0.08)',
                    fontSize: '13px',
                    color: '#3A2E28',
                  }}
                  formatter={(val, name) => [
                    `${formatCurrency(val)}`,
                    name === 'historique' ? 'Ventes réelles' : 'Projection IA',
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: '#3A2E28', fontSize: '13px', fontWeight: 600 }}>
                      {value === 'historique'
                        ? 'Ventes réelles (Historique)'
                        : 'Prévision IA (Estimée)'}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="historique"
                  stroke="#F97316"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorHist)"
                />
                <Area
                  type="monotone"
                  dataKey="prevision"
                  stroke="#14B8A6"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#colorPrev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Tableau des recommandations IA ───────────────────────────────── */}
      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
              Recommandations d’Approvisionnement Intelligentes
            </h3>
            <p className="text-muted" style={{ fontSize: '13px', marginTop: '2px' }}>
              Actions préventives suggérées pour garantir la continuité des opérations
            </p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>PRODUIT</th>
                <th className="text-right">STOCK ACTUEL</th>
                <th className="text-right">DEMANDE PROJETÉE</th>
                <th>DÉLAI COMMANDE</th>
                <th>STATUT IA</th>
                <th className="text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {RECOMMANDATIONS.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.product}</div>
                    <div className="text-muted text-xs">SKU: {r.sku}</div>
                  </td>
                  <td className="text-right" style={{ fontWeight: 600 }}>
                    {r.stockActuel} unités
                  </td>
                  <td
                    className="text-right"
                    style={{ fontWeight: 600, color: 'var(--color-primary)' }}
                  >
                    {r.demandePrevue} unités
                  </td>
                  <td>{r.dateRecommandee}</td>
                  <td>
                    <span className={`badge badge-${r.urgence}`}>
                      <span className="badge-dot" />
                      {r.statut}
                    </span>
                  </td>
                  <td className="text-right">
                    <button type="button" className="btn btn-secondary btn-sm">
                      <Package size={14} strokeWidth={1.75} />
                      Commander
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
