'use strict';

if (initPage({ page: 'admin-fleet', requires: 'ADMIN' })) {

  const form     = document.getElementById('carForm');
  const grid     = document.getElementById('carGrid');
  const countEl  = document.getElementById('fleetCount');
  const titleEl  = document.getElementById('carFormTitle');
  const submitEl = document.getElementById('carFormSubmitBtn');
  const cancelEl = document.getElementById('carFormCancelBtn');

  let cars = [];

  /* ---------- form ---------- */
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const id = fd.get('id');
    const payload = {
      type: fd.get('type'),
      model: fd.get('model').trim(),
      registrationNumber: fd.get('registrationNumber').trim(),
      seats: Number(fd.get('seats')),
      dailyRate: Number(fd.get('dailyRate')),
      fuelType: fd.get('fuelType') || null,
      transmission: fd.get('transmission') || null,
      imageUrl: fd.get('imageUrl').trim() || null
    };
    submitEl.disabled = true;
    try {
      if (id) {
        await Api.adminUpdateCar(id, payload);
        toast('Car updated successfully');
      } else {
        await Api.adminAddCar(payload);
        toast('Car added to fleet');
      }
      resetForm();
      await loadCars();
    } catch (err) {
      toast(err.message, 'danger');
    } finally {
      submitEl.disabled = false;
    }
  };

  cancelEl.onclick = resetForm;

  function resetForm() {
    form.reset();
    form.elements['id'].value = '';
    titleEl.innerHTML  = '<i class="bi bi-plus-circle" style="color:var(--brand)"></i>Add a Car';
    submitEl.innerHTML = '<i class="bi bi-floppy me-1"></i>Save Vehicle';
    cancelEl.classList.add('d-none');
  }

  function fillForm(car) {
    const f = form.elements;
    f['id'].value = car.id;
    f['type'].value = car.type;
    f['model'].value = car.model;
    f['registrationNumber'].value = car.registrationNumber;
    f['seats'].value = car.seats;
    f['dailyRate'].value = car.dailyRate;
    f['fuelType'].value = car.fuelType || '';
    f['transmission'].value = car.transmission || '';
    f['imageUrl'].value = car.imageUrl || '';
    titleEl.innerHTML  = '<i class="bi bi-pencil-square" style="color:var(--brand)"></i>Edit Car Details';
    submitEl.innerHTML = '<i class="bi bi-check-lg me-1"></i>Update Car';
    cancelEl.classList.remove('d-none');
    titleEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------- inventory ---------- */
  async function loadCars() {
    grid.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-danger" role="status"></div></div>`;
    try {
      cars = await Api.adminListCars();
      countEl.textContent = cars.length ? `${cars.length} vehicle${cars.length === 1 ? '' : 's'}` : '';

      if (!cars.length) {
        grid.innerHTML = `<div class="col-12"><div class="empty-state">
          <i class="bi bi-car-front"></i>
          <p>No cars in the fleet yet. Add your first vehicle using the form.</p>
        </div></div>`;
        return;
      }

      grid.innerHTML = cars.map(c => `
        <div class="col-xl-4 col-md-6">
          <div class="car-card">
            <div class="car-media">
              <img class="car-img" src="${escapeHtml(carImage(c.imageUrl))}" alt="${escapeHtml(c.model)}" loading="lazy">
              <span class="reg-badge">REG: ${escapeHtml(c.registrationNumber)}</span>
            </div>
            <div class="car-body">
              <div class="car-model">${escapeHtml(c.model)}</div>
              <div class="car-meta">${escapeHtml(c.type)} &middot; ${escapeHtml(c.transmission || '—')} &middot; ${escapeHtml(c.fuelType || '—')}</div>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="car-price">${money(c.dailyRate)}<span class="car-price-unit">/day</span></span>
                <span class="car-meta mb-0">${c.seats} seats</span>
              </div>
              <div class="d-flex gap-2">
                <button class="btn-edit-car flex-fill" data-edit="${c.id}"><i class="bi bi-pencil"></i> Edit</button>
                <button class="btn-remove-car flex-fill" data-remove="${c.id}"><i class="bi bi-trash3"></i> Remove</button>
              </div>
            </div>
          </div>
        </div>`).join('');

      grid.querySelectorAll('[data-edit]').forEach(btn => {
        btn.onclick = () => {
          const car = cars.find(c => String(c.id) === btn.dataset.edit);
          if (car) fillForm(car);
        };
      });

      grid.querySelectorAll('[data-remove]').forEach(btn => {
        btn.onclick = async () => {
          if (!confirm('Remove this car from the fleet? Booking history will be preserved.')) return;
          try {
            await Api.adminRemoveCar(btn.dataset.remove);
            toast('Car removed from fleet');
            await loadCars();
          } catch (err) { toast(err.message, 'danger'); }
        };
      });
    } catch (err) {
      grid.innerHTML = '';
      toast(err.message, 'danger');
    }
  }

  loadCars().then(() => {
    // admin-dashboard.html links here with ?action=add to jump straight to the form.
    if (new URLSearchParams(location.search).get('action') === 'add') {
      document.getElementById('carModel').focus();
    }
  });
}
