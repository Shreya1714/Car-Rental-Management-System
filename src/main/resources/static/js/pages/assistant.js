'use strict';

if (initPage({ page: 'assistant', requires: 'CUSTOMER', chat: true })) {

  const form    = document.getElementById('recommendForm');
  const btn     = document.getElementById('recommendBtn');
  const results = document.getElementById('recommendResults');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Thinking…';
    results.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div></div>`;
    try {
      const recs = await Api.aiRecommend({
        passengers:   fd.get('passengers')   ? Number(fd.get('passengers'))   : null,
        budgetPerDay: fd.get('budgetPerDay') ? Number(fd.get('budgetPerDay')) : null,
        tripType:     fd.get('tripType')
      });

      if (!recs.length) {
        results.innerHTML = `<div class="empty-state">
          <i class="bi bi-search"></i>
          <p>No cars matched those constraints. Try widening the budget or passenger count.</p>
        </div>`;
        return;
      }

      results.innerHTML = recs.map((r, i) => `
        <div class="recommend-row">
          <div class="rank-badge">${i + 1}</div>
          <img class="rec-img" src="${escapeHtml(carImage(r.car.imageUrl))}" alt="${escapeHtml(r.car.model)}" loading="lazy">
          <div class="rec-body">
            <div class="rec-model">${escapeHtml(r.car.model)}</div>
            <div class="rec-meta">${escapeHtml(r.car.type)} &middot; ${r.car.seats} seats &middot; ${escapeHtml(r.car.transmission || '—')}</div>
            <div class="rec-reason">${escapeHtml(r.reason)}</div>
          </div>
          <div class="rec-side">
            <div class="rec-price">${money(r.car.dailyRate)}<span class="car-price-unit">/day</span></div>
            <a href="cars.html" class="btn-book mt-2">Check dates</a>
          </div>
        </div>`).join('');
    } catch (err) {
      results.innerHTML = '';
      toast(err.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-stars me-1"></i>Get AI Picks';
    }
  };
}
