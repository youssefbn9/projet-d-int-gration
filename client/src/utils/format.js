const currencyFormatter = new Intl.NumberFormat('fr-TN', {
  style: 'currency',
  currency: 'TND',
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

const numberFormatter = new Intl.NumberFormat('fr-TN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '0,000 TND';
  return currencyFormatter.format(Number(amount));
};

export const formatNumber = (value) => {
  if (value === undefined || value === null || isNaN(Number(value))) return '0';
  return numberFormatter.format(Number(value));
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    return dateFormatter.format(new Date(dateString));
  } catch (_e) {
    return dateString;
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  try {
    return dateTimeFormatter.format(new Date(dateString));
  } catch (_e) {
    return dateString;
  }
};
