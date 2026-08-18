'use strict';

if (initPage({ page: 'admin-customers', requires: 'ADMIN' })) {

  const el       = document.getElementById('customersTable');
  const searchEl = document.getElementById('customerSearch');
  let customers = [];

  searchEl.oninput = paint;

  function paint() {
    const q = searchEl.value.trim().toLowerCase();
    const rows = q
      ? customers.filter(c =>
          [c.fullName, c.username, c.email].some(v => (v || '').toLowerCase().includes(q)))
      : customers;

    if (!rows.length) {
      el.innerHTML = `<div class="empty-state"><i class="bi bi-people"></i>
        <p>${customers.length ? 'No customers match that search.' : 'No registered customers yet.'}</p></div>`;
      return;
    }

    el.innerHTML = `
      <div class="bookings-table-wrap">
        <table class="table mb-0">
          <thead>
            <tr><th>Customer</th><th>Contact</th><th>Joined</th><th>Bookings</th><th>Total Spent</th></tr>
          </thead>
          <tbody>
            ${rows.map(c => `
              <tr>
                <td style="font-weight:600">${escapeHtml(c.fullName || c.username)}
                  <div style="font-size:.78rem;color:var(--muted);font-weight:400">@${escapeHtml(c.username)}</div>
                </td>
                <td style="font-size:.82rem;color:var(--muted)">
                  ${escapeHtml(c.email || '—')}${c.phone ? '<br>' + escapeHtml(c.phone) : ''}
                </td>
                <td style="font-size:.82rem;color:var(--muted)">${c.joinedAt ? fmtDate(c.joinedAt.split('T')[0]) : '—'}</td>
                <td>${c.totalBookings}</td>
                <td style="font-weight:700">${money(c.totalSpent)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  (async function load() {
    el.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div></div>`;
    try {
      customers = await Api.adminCustomers();
      paint();
    } catch (err) {
      el.innerHTML = '';
      toast(err.message, 'danger');
    }
  })();
}
