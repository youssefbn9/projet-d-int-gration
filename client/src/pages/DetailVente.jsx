import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Printer, User, ShoppingBag } from 'lucide-react';
import { salesService } from '../services';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { Spinner, Alert, Badge } from '../components/UI';
import { useToast } from '../components/Toast';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function DetailVente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const fetchSaleDetail = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await salesService.getById(id);
      setSale(res.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Impossible de charger les informations de la vente.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSaleDetail();
  }, [fetchSaleDetail]);

  const handleUpdateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      await salesService.updateStatus(id, newStatus);
      addToast(
        newStatus === 'paid'
          ? 'Vente marquée comme payée !'
          : 'Vente annulée avec succès. Le stock a été restitué !',
        'success'
      );
      setCancelDialogOpen(false);
      fetchSaleDetail();
    } catch (err) {
      addToast(
        err.response?.data?.message || 'Erreur lors du changement de statut de la vente.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <Badge type="success">Payée</Badge>;
      case 'pending':
        return <Badge type="warning">En attente</Badge>;
      case 'cancelled':
        return <Badge type="danger">Annulée</Badge>;
      default:
        return <Badge type="muted">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem' }}>
        <Spinner text="Chargement de la commande..." />
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="flex-col gap-4">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/ventes')}
          style={{ width: 'fit-content' }}
        >
          <ArrowLeft size={16} /> Retour aux ventes
        </button>
        <Alert type="danger">{error || 'Vente introuvable'}</Alert>
      </div>
    );
  }

  const columns = [
    {
      key: 'product_name',
      header: 'Désignation Produit',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{item.product_name}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>SKU: {item.sku}</div>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantité',
      style: { textAlign: 'center', width: '120px' },
      render: (item) => <span style={{ fontWeight: 700 }}>{item.quantity}</span>,
    },
    {
      key: 'unit_price',
      header: 'Prix Unitaire Figé',
      style: { textAlign: 'right', width: '160px' },
      render: (item) => formatCurrency(item.unit_price),
    },
    {
      key: 'subtotal',
      header: 'Sous-Total',
      style: { textAlign: 'right', width: '160px' },
      render: (item) => (
        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
          {formatCurrency(item.subtotal || item.unit_price * item.quantity)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex-col gap-6">
      {/* ── Bouton Retour & Actions rapides ─────────────────────────────────── */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/ventes')}
        >
          <ArrowLeft size={16} /> Retour à la liste des ventes
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <Printer size={16} /> Imprimer le ticket
          </button>

          {/* Transition pending -> paid */}
          {sale.status === 'pending' && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={actionLoading}
              onClick={() => handleUpdateStatus('paid')}
            >
              <CheckCircle2 size={16} /> Marquer payée
            </button>
          )}

          {/* Transitions pending/paid -> cancelled */}
          {(sale.status === 'pending' || sale.status === 'paid') && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={actionLoading}
              onClick={() => setCancelDialogOpen(true)}
            >
              <XCircle size={16} /> Annuler la vente
            </button>
          )}
        </div>
      </div>

      {/* ── En-tête de la Vente ─────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div
          className="flex-between"
          style={{
            flexWrap: 'wrap',
            gap: '1rem',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>
                Vente #{sale.id}
              </h1>
              {renderStatusBadge(sale.status)}
            </div>
            <p className="text-muted" style={{ marginTop: '4px', fontSize: '13px' }}>
              Enregistrée le {formatDateTime(sale.created_at)}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Montant Total Net
            </span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--color-primary)' }}>
              {formatCurrency(sale.total_amount)}
            </div>
          </div>
        </div>

        {/* Détails Métadonnées */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            marginTop: '1.5rem',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Client
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <User size={16} className="text-muted" />
              <strong style={{ color: 'var(--color-text)' }}>
                {sale.customer_name || 'Client comptoir (anonyme)'}
              </strong>
            </div>
            {sale.customer_email && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {sale.customer_email}
              </div>
            )}
            {sale.customer_phone && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {sale.customer_phone}
              </div>
            )}
          </div>

          <div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Vendeur / Caissier
            </span>
            <div style={{ marginTop: '4px', color: 'var(--color-text)', fontWeight: 600 }}>
              {sale.user_name || 'Staff StockPro'}
            </div>
          </div>

          <div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Note additionnelle
            </span>
            <div style={{ marginTop: '4px', color: 'var(--color-text)' }}>
              {sale.note || <em className="text-muted">Aucune note particulière</em>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tableau des Lignes d'articles ───────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShoppingBag size={18} className="text-primary" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
            Articles inclus dans la transaction ({sale.items?.length || 0})
          </h2>
        </div>

        <DataTable columns={columns} data={sale.items || []} keyExtractor={(item) => item.id} />

        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'var(--color-bg-alt)',
          }}
        >
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
              Total de la vente :
            </span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {formatCurrency(sale.total_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Dialogue de confirmation d'annulation ───────────────────────────── */}
      <ConfirmDialog
        open={cancelDialogOpen}
        title="Confirmation d'annulation de vente"
        message="Êtes-vous certain de vouloir annuler cette vente ? Tous les articles de cette commande seront automatiquement et immédiatement restitués dans le stock de votre commerce."
        confirmText="Confirmer l'annulation et restituer le stock"
        cancelText="Conserver la vente"
        danger={true}
        loading={actionLoading}
        onCancel={() => setCancelDialogOpen(false)}
        onConfirm={() => handleUpdateStatus('cancelled')}
      />
    </div>
  );
}
