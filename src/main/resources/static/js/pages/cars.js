'use strict';

if (initPage({ page: 'cars', requires: 'CUSTOMER', chat: true })) {

  const grid        = document.getElementById('availableGrid');
  const countEl     = document.getElementById('resultsCount');
  const startInput  = document.getElementById('startDate');
  const endInput    = document.getElementById('endDate');

  let allCars    = [];
  let typeFilter = 'ALL';

  /* ---------- date inputs ---------- */
  // Dates survive navigation, so coming back from "My Reservations" keeps the search.
  const saved = JSON.parse(sessionStorage.getItem('searchDates') || 'null');
  startInput.value = saved?.startDate || todayStr();
  endInput.value   = saved?.endDate   || daysFromNow(2);
  startInput.min   = todayStr();
  endInput.min     = startInput.value;

  startInput.onchange = () => {
    endInput.min = startInput.value;
    if (endInput.value < startInput.value) endInput.value = startInput.value;
  };

  /* ---------- search ---------- */
  document.getElementById('searchForm').onsubmit = (e) => {
    e.preventDefault();
    if (endInput.value < startInput.value) {
      toast('Return date cannot be before pick-up date', 'warning');
      return;
    }
    loadAvailableCars(startInput.value, endInput.value);
  };

  /* ---------- type filter ---------- */
  document.getElementById('filterChips').onclick = (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('#filterChips .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    typeFilter = chip.dataset.type;
    paintGrid();
  };

  async function loadAvailableCars(startDate, endDate) {
    sessionStorage.setItem('searchDates', JSON.stringify({ startDate, endDate }));
    grid.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-danger" role="status"></div></div>`;
    countEl.textContent = '';
    try {
      allCars = await Api.availableCars(startDate, endDate);
      paintGrid();
    } catch (err) {
      allCars = [];
      grid.innerHTML = '';
      toast(err.message, 'danger');
    }
  }

  function paintGrid() {
    const cars = typeFilter === 'ALL' ? allCars : allCars.filter(c => c.type === typeFilter);
    countEl.textContent = cars.length ? `${cars.length} car${cars.length === 1 ? '' : 's'} available` : '';

    if (!cars.length) {
      grid.innerHTML = `<div class="col-12"><div class="empty-state">
        <i class="bi bi-car-front"></i>
        <p>No cars available for these dates${typeFilter !== 'ALL' ? ' in this category' : ''}. Try adjusting your search.</p>
      </div></div>`;
      return;
    }

    grid.innerHTML = cars.map(c => `
      <div class="col-xl-3 col-md-4 col-sm-6">
        <div class="car-card">
          <div class="car-media">
            <img class="car-img" src="${escapeHtml(carImage(c.imageUrl))}" alt="${escapeHtml(c.model)}" loading="lazy">
            <span class="type-badge type-badge-${escapeHtml(c.type)}">${escapeHtml(c.type)}</span>
          </div>
          <div class="car-body">
            <div class="car-model">${escapeHtml(c.model)}</div>
            <div class="car-meta">${c.seats} Seats &middot; ${escapeHtml(c.transmission || '—')} &middot; ${escapeHtml(c.fuelType || '—')}</div>
            <div class="d-flex justify-content-between align-items-center">
              <span class="car-price">${money(c.dailyRate)}<span class="car-price-unit">/day</span></span>
              <button class="btn-book" data-book="${c.id}">Book Now</button>
            </div>
          </div>
        </div>
      </div>`).join('');

    grid.querySelectorAll('[data-book]').forEach(btn => {
      btn.onclick = () => book(btn);
    });
  }

  async function book(btn) {
    btn.disabled = true;
    btn.textContent = 'Booking…';
    try {
      const booking = await Api.bookCar({
        carId: btn.dataset.book,
        startDate: startInput.value,
        endDate: endInput.value
      });
      // The next step is payment, which lives on the reservations page.
      toastAfterRedirect(`Booked! Total ${money(booking.totalAmount)} — complete payment to confirm.`);
      location.href = 'bookings.html';
    } catch (err) {
      toast(err.message, 'danger');
      btn.disabled = false;
      btn.textContent = 'Book Now';
    }
  }

  loadAvailableCars(startInput.value, endInput.value);
}
