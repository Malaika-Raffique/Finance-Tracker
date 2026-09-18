export function formatCurrency(amount, symbol = 'Rs.') {
  if (amount === undefined || amount === null || isNaN(amount)) return `${symbol} 0`;
  const val = Number(amount);
  const formatted = Math.abs(val).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return `${val < 0 ? '-' : ''}${symbol} ${formatted}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function getMonthName(monthStr) { // YYYY-MM
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
