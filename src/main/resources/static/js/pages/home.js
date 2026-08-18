'use strict';

if (initPage({ page: 'home' })) {

  // A taste of the fleet for visitors who aren't signed in yet.
  (async function loadFleetPreview() {
    const grid = document.getElementById('fleetPreview');
    grid.innerHTML = `<div class="col-12 text-center py-4"><div class="spinner-border text-danger" role="status"></div></div>`;
    try {
      const cars = await Api.availableCars(todayStr(), daysFromNow(2));
      if (!cars.length) {
        grid.innerHTML = `<div class="col-12"><div class="empty-state">
          <i class="bi bi-car-front"></i><p>No cars are free for the next few days. Try other dates once you're signed in.</p>
        </div></div>`;
        return;
      }
      grid.innerHTML = cars.slice(0, 4).map(c => `
        <div class="col-xl-3 col-md-6">
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
                <a href="cars.html" class="btn-book">Book</a>
              </div>
            </div>
          </div>
        </div>`).join('');
    } catch (err) {
      grid.innerHTML = `<div class="col-12"><div class="empty-state">
        <i class="bi bi-wifi-off"></i><p>Couldn't load the fleet right now.</p>
      </div></div>`;
    }
  })();
}
