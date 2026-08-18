'use strict';

if (initPage({ page: 'admin-dashboard', requires: 'ADMIN' })) {

  (async function load() {
    try {
      const [cars, bookings] = await Promise.all([
        Api.adminListCars(),
        Api.adminAllBookings()
      ]);
      paintFleetStats(cars);
      paintRevenueStats(bookings);
      paintRecentBookings(bookings);
    } catch (err) {
      toast(err.message, 'danger');
    }
  })();

  function paintFleetStats(cars) {
    const byType = cars.reduce((a, c) => { a[c.type] = (a[c.type] || 0) + 1; return a; }, {});
    document.getElementById('fleetStats').innerHTML = [
      { t: 'SUV',       icon: 'bi-truck-front', cls: 'suv',       label: 'SUVs Active' },
      { t: 'SEDAN',     icon: 'bi-car-front',   cls: 'sedan',     label: 'Sedans Active' },
      { t: 'TRAVELLER', icon: 'bi-bus-front',   cls: 'traveller', label: 'Travellers Active' }
    ].map(s => `
      <div class="col-md-4">
        <div class="stat-card">
          <div class="stat-icon ${s.cls}"><i class="bi ${s.icon}"></i></div>
          <div>
            <div class="stat-number">${byType[s.t] || 0}</div>
            <div class="stat-label">${s.label}</div>
          </div>
        </div>
      </div>`).join('');
  }

  function paintRevenueStats(bookings) {
    const confirmed = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
    const revenue = confirmed.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
    const pending = bookings.filter(b => b.status === 'PENDING').length;

    document.getElementById('revenueStats').innerHTML = [
      { icon: 'bi-journal-check',   cls: 'sedan',     value: bookings.length, label: 'Total Bookings' },
      { icon: 'bi-hourglass-split', cls: 'traveller', value: pending,         label: 'Awaiting Payment' },
      { icon: 'bi-check-circle',    cls: 'suv',       value: confirmed.length, label: 'Confirmed' },
      { icon: 'bi-cash-stack',      cls: 'sedan',     value: money(revenue),  label: 'Revenue Collected' }
    ].map(s => `
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-icon ${s.cls}"><i class="bi ${s.icon}"></i></div>
          <div>
            <div class="stat-number">${s.value}</div>
            <div class="stat-label">${s.label}</div>
          </div>
        </div>
      </div>`).join('');
  }

  function paintRecentBookings(bookings) {
    const el = document.getElementById('recentBookings');
    if (!bookings.length) {
      el.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i><p>No bookings yet.</p></div>`;
      return;
    }
    const recent = bookings.slice().reverse().slice(0, 8);
    el.innerHTML = `
      <div class="bookings-table-wrap">
        <table class="table mb-0">
          <thead>
            <tr><th>Ref</th><th>Customer</th><th>Vehicle</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${recent.map(b => `
              <tr>
                <td><span class="booking-ref">${bookingRef(b.id)}</span></td>
                <td style="font-weight:600">${escapeHtml(b.customer.username)}</td>
                <td>${escapeHtml(b.car.model)}</td>
                <td style="font-weight:700">${money(b.totalAmount)}</td>
                <td><span class="status-badge status-${escapeHtml(b.status)}">${statusLabel(b.status)}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }
}
