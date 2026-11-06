export const formatCurrency = (n) =>
  new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(n ?? 0);

export const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(d));
  } catch {
    return String(d);
  }
};

export const formatDateTime = (d) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(d));
  } catch {
    return String(d);
  }
};

export const formatNumber = (value) => {
  if (value === undefined || value === null || isNaN(Number(value))) return '0';
  return new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
};
