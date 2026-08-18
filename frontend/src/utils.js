export const money  = (n) => 'Rs. ' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
export const today  = ()  => new Date().toISOString().split('T')[0];
export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
export const statusLabel = (s) =>
  ({ PENDING: 'Pending Payment', CONFIRMED: 'Confirmed', CANCELLED: 'Cancelled', COMPLETED: 'Completed' }[s] || s);
export const avatarInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
export const bookingRef = (id) => '#BKG-' + String(id).padStart(4, '0');
