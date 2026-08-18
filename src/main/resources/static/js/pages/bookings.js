'use strict';

if (initPage({ page: 'bookings', requires: 'CUSTOMER', chat: true })) {

  const listEl  = document.getElementById('myBookings');
  const statsEl = document.getElementById('bookingStats');
  const payModal = new bootstrap.Modal(document.getElementById('paymentModal'));

  let allBookings  = [];
  let statusFilter = 'ALL';
  let payBookingId = null;

  document.getElementById('statusChips').onclick = (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('#statusChips .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    statusFilter = chip.dataset.status;
    paintList();
  };

  async function loadMyBookings() {
    listEl.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div></div>`;
    try {
      allBookings = await Api.myBookings();
      paintStats();
      paintList();
    } catch (err) {
      listEl.innerHTML = '';
      toast(err.message, 'danger');
    }
  }

  function paintStats() {
    const pending   = allBookings.filter(b => b.status === 'PENDING').length;
    const confirmed = allBookings.filter(b => b.status === 'CONFIRMED').length;
    const spent = allBookings
      .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

    statsEl.innerHTML = [
      { icon: 'bi-journal-check', cls: 'sedan',     value: allBookings.length, label: 'Total Bookings' },
      { icon: 'bi-hourglass-split', cls: 'traveller', value: pending,          label: 'Awaiting Payment' },
      { icon: 'bi-check-circle',  cls: 'suv',       value: confirmed,          label: 'Confirmed' },
      { icon: 'bi-wallet2',       cls: 'sedan',     value: money(spent),       label: 'Total Paid' }
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

  function paintList() {
    const bookings = (statusFilter === 'ALL' ? allBookings : allBookings.filter(b => b.status === statusFilter))
      .slice().reverse();

    if (!bookings.length) {
      listEl.innerHTML = `<div class="empty-state">
        <i class="bi bi-journal"></i>
        <p>${statusFilter === 'ALL'
              ? 'You have no reservations yet.'
              : 'Nothing in this category.'}</p>
        <a href="cars.html" class="btn btn-brand mt-2 px-4">Browse cars</a>
      </div>`;
      return;
    }

    listEl.innerHTML = bookings.map(b => `
      <div class="booking-card">
        <div class="booking-card-header">
          <div>
            <div class="booking-car-name">${escapeHtml(b.car.model)}</div>
            <div class="booking-car-type">${escapeHtml(b.car.type)} &middot; ${b.car.seats} seats</div>
          </div>
          <span class="status-badge status-${escapeHtml(b.status)}">${statusLabel(b.status)}</span>
        </div>
        <div class="booking-detail-grid">
          <div>
            <div class="booking-detail-label">Pick-up</div>
            <div class="booking-detail-value">${fmtDate(b.startDate)}</div>
          </div>
          <div>
            <div class="booking-detail-label">Return</div>
            <div class="booking-detail-value">${fmtDate(b.endDate)}</div>
          </div>
          <div>
            <div class="booking-detail-label">Total Amount</div>
            <div class="booking-detail-value">${money(b.totalAmount)}</div>
          </div>
          <div>
            <div class="booking-detail-label">Booking Ref</div>
            <div class="booking-detail-value" style="font-family:monospace;font-size:.82rem">${bookingRef(b.id)}</div>
          </div>
        </div>
        <div class="booking-actions">
          ${b.status === 'PENDING'
            ? `<button class="btn-pay" data-pay="${b.id}"><i class="bi bi-credit-card me-1"></i>Pay Now</button>` : ''}
          ${b.status === 'PENDING' || b.status === 'CONFIRMED'
            ? `<button class="btn-cancel-booking" data-cancel="${b.id}"><i class="bi bi-x-circle me-1"></i>Cancel</button>` : ''}
        </div>
      </div>`).join('');

    listEl.querySelectorAll('[data-pay]').forEach(btn => {
      btn.onclick = () => openPaymentModal(btn.dataset.pay);
    });
    listEl.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Cancel this booking?')) return;
        try {
          await Api.cancelBooking(btn.dataset.cancel);
          toast('Booking cancelled');
          await loadMyBookings();
        } catch (err) { toast(err.message, 'danger'); }
      };
    });
  }

  /* ---------- payment ---------- */
  function openPaymentModal(bookingId) {
    payBookingId = bookingId;
    document.getElementById('paymentMethodBtns').classList.remove('d-none');
    document.getElementById('paymentProcessing').classList.add('d-none');
    payModal.show();
  }

  document.getElementById('paymentMethodBtns').addEventListener('click', async (e) => {
    const btn = e.target.closest('.pay-method-btn');
    if (!btn || !payBookingId) return;
    document.getElementById('paymentMethodBtns').classList.add('d-none');
    document.getElementById('paymentProcessing').classList.remove('d-none');
    try {
      const p = await Api.pay({ bookingId: payBookingId, method: btn.dataset.method });
      payModal.hide();
      toast(`Payment successful! Ref: ${p.transactionId}`);
      await loadMyBookings();
    } catch (err) {
      payModal.hide();
      toast(err.message, 'danger');
    } finally {
      payBookingId = null;
    }
  });

  loadMyBookings();
}
