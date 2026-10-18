import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { saleService } from '../services';
import { Spinner, Alert, Badge } from '../components/UI';
import { formatCurrency, formatDateTime } from '../utils/format';
import {
  ArrowLeft,
  Receipt,
  User,
  CreditCard,
  Printer,
  Package,
} from 'lucide-react';

export default function DetailVentePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    saleService
      .getById(id)
      .then((res) => {
        if (mounted) {
          setSale(res.data.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.response?.data?.message || 'Impossible de charger les détails de la vente.');
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const getSaleBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <Badge type="success">Payée</Badge>;
      case 'pending':
        return <Badge type="warning">En attente</Badge>;
      case 'cancelled':
        return <Badge type="danger">Annulée</Badge>;
      default:
        return <Badge type="success">Payée</Badge>;
    }
  };

  if (loading) return <Spinner text="Chargement des informations de la vente…" />;

  if (error || !sale) {
    return (
      <div className="flex-col gap-6" style={{ maxWidth: 700, margin: '2rem auto' }}>
        <Alert type="danger">{error || 'Vente introuvable'}</Alert>
        <button type="button" onClick={() => navigate('/ventes')} className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
          <ArrowLeft size={16} strokeWidth={1.75} />
          Retour aux ventes
        </button>
      </div>
    );
  }

  return (
    <div className="flex-col gap-6" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* ── En-tête de la page ────────────────────────────────────────────── */}
      <div className="page-header flex-between">
        <div className="flex-gap-3">
          <Link to="/ventes" className="btn btn-icon" title="Retour aux ventes" aria-label="Retour">
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <div>
            <div className="flex-gap-2">
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                Vente #{sale.id}
              </h2>
              {getSaleBadge(sale.status)}
            </div>
            <p className="text-muted" style={{ fontSize: '13px', marginTop: '2px' }}>
              Enregistrée le {formatDateTime(sale.created_at)}
            </p>
          </div>
        </div>

        <div className="flex-gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.print()}
          >
            <Printer size={16} strokeWidth={1.75} />
            Imprimer le reçu
          </button>
        </div>
      </div>

      {/* ── Cartes d'informations récapitulatives ─────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="card" style={{ padding: '18px 20px' }}>
          <div className="flex-gap-3" style={{ marginBottom: '8px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={18} strokeWidth={1.75} />
            </div>
            <div>
              <span className="text-muted text-xs">Vendeur / Caissier</span>
              <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '15px' }}>
                {sale.first_name} {sale.last_name}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div className="flex-gap-3" style={{ marginBottom: '8px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'var(--color-secondary-light)',
                color: 'var(--color-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCard size={18} strokeWidth={1.75} />
            </div>
            <div>
              <span className="text-muted text-xs">Règlement & Note</span>
              <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '15px' }}>
                {sale.note || 'Paiement comptant standard'}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div className="flex-gap-3" style={{ marginBottom: '8px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Receipt size={18} strokeWidth={1.75} />
            </div>
            <div>
              <span className="text-muted text-xs">Montant Total TTC</span>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '18px' }}>
                {formatCurrency(sale.total_amount)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tableau des articles vendus ───────────────────────────────────── */}
      <div className="card">
        <div className="card-header flex-between">
          <div className="flex-gap-2">
            <Package size={18} strokeWidth={1.75} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
              Articles inclus dans la transaction
            </h3>
          </div>
          <span className="badge badge-neutral">
            {(sale.items || []).length} référence{(sale.items || []).length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>PRODUIT / ARTICLE</th>
                <th className="text-right">QUANTITÉ</th>
                <th className="text-right">PRIX UNITAIRE</th>
                <th className="text-right">TOTAL LIGNE</th>
              </tr>
            </thead>
            <tbody>
              {(sale.items || []).map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                      {item.product_name}
                    </div>
                    <div className="text-muted text-xs">SKU : {item.sku}</div>
                  </td>
                  <td className="text-right" style={{ fontWeight: 600 }}>
                    {item.quantity}
                  </td>
                  <td className="text-right">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="text-right" style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--color-primary-light)' }}>
                <td colSpan={3} style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)' }}>
                  Total Général Facturé (TTC)
                </td>
                <td
                  className="text-right"
                  style={{
                    fontWeight: 800,
                    fontSize: '18px',
                    color: 'var(--color-primary)',
                  }}
                >
                  {formatCurrency(sale.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
