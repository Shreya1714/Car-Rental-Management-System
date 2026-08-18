'use strict';

if (initPage({ page: 'admin-bookings', requires: 'ADMIN' })) {

  const el = document.getElementById('bookingsTable');
  let allBookings = [];
  let statusFilter = 'ALL';

  document.getElementById('statusChips').onclick = (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('#statusChips .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    statusFilter = chip.dataset.status;
    paint();
  };

  function paint() {
    const bookings = (statusFilter === 'ALL'
        ? allBookings
        : allBookings.filter(b => b.status === statusFilter)).slice().reverse();

    if (!bookings.length) {
      el.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i>
        <p>${statusFilter === 'ALL' ? 'No bookings yet.' : 'No bookings with this status.'}</p></div>`;
      return;
    }

    el.innerHTML = `
      <div class="bookings-table-wrap">
        <table class="table mb-0">
          <thead>
            <tr>
              <th>Booking ID</th><th>Customer</th><th>Vehicle</th>
              <th>Dates</th><th>Amount</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${bookings.map(b => `
              <tr>
                <td><span class="booking-ref">${bookingRef(b.id)}</span></td>
                <td style="font-weight:600">${escapeHtml(b.customer.username)}</td>
                <td>${escapeHtml(b.car.model)}</td>
                <td style="font-size:.82rem;color:var(--muted)">${fmtDate(b.startDate)} → ${fmtDate(b.endDate)}</td>
                <td style="font-weight:700">${money(b.totalAmount)}</td>
                <td><span class="status-badge status-${escapeHtml(b.status)}">${statusLabel(b.status)}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  (async function load() {
    el.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div></div>`;
    try {
      allBookings = await Api.adminAllBookings();
      paint();
    } catch (err) {
      el.innerHTML = '';
      toast(err.message, 'danger');
    }
  })();
}
