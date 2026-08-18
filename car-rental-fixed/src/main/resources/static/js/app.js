'use strict';

const appEl   = document.getElementById('app');
const navRight = document.getElementById('navRight');

// ============================================================
// UTILITIES
// ============================================================
function toast(message, type = 'success') {
  const icons = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-circle-fill' };
  const host = document.getElementById('toastHost');
  const el = document.createElement('div');
  el.className = `toast-item ${type}`;
  el.innerHTML = `<i class="bi ${icons[type] || icons.success} toast-icon"></i><span>${message}</span>`;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

function money(n) { return 'Rs. ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function statusLabel(s) {
  const map = { PENDING: 'Pending Payment', CONFIRMED: 'Confirmed', CANCELLED: 'Cancelled', COMPLETED: 'Completed' };
  return map[s] || s;
}
function avatarInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
function togglePasswordField(btn) {
  const input = btn.previousElementSibling;
  const icon = btn.querySelector('i');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  icon.className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
  btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}

// ============================================================
// ROUTING
// ============================================================
function render() {
  renderNav();
  if (!Auth.isLoggedIn()) {
    renderAuth();
    document.getElementById('chatWidget').classList.add('d-none');
  } else if (Auth.getRole() === 'ADMIN') {
    renderAdminDashboard();
    document.getElementById('chatWidget').classList.add('d-none');
  } else {
    renderCustomerDashboard();
    document.getElementById('chatWidget').classList.remove('d-none');
  }
}

// ============================================================
// NAVBAR
// ============================================================
function renderNav() {
  const navLinks = document.getElementById('navLinks');
  if (!Auth.isLoggedIn()) {
    navLinks.innerHTML = '';
    navRight.innerHTML = `<span style="font-size:.85rem;color:rgba(255,255,255,.45)">Book smarter with AI</span>`;
    return;
  }
  const isAdmin = Auth.getRole() === 'ADMIN';

  function navScrollTo(sectionId, linkEl) {
    document.querySelectorAll('.nav-link-item').forEach(l => l.classList.remove('active'));
    linkEl.classList.add('active');
    const target = document.getElementById(sectionId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  navLinks.innerHTML = `
    <a href="#" class="nav-link-item" id="navFleet">Fleet</a>
    <a href="#" class="nav-link-item active" id="navReservations">Reservations</a>
    <a href="#" class="nav-link-item" id="navSupport">Support</a>
  `;
  navRight.innerHTML = `
    <button class="nav-bell" title="Notifications"><i class="bi bi-bell"></i></button>
    <span class="nav-role-badge">${isAdmin ? 'Admin' : 'Customer'}</span>
    <span class="nav-username">${Auth.getUsername()}</span>
    <div class="nav-avatar">${avatarInitials(Auth.getUsername())}</div>
    <button class="btn-nav-logout" id="logoutBtn">Logout</button>
  `;
  document.getElementById('logoutBtn').onclick = () => { Auth.clear(); render(); };

  // Wire nav links after DOM update
  requestAnimationFrame(() => {
    const nf = document.getElementById('navFleet');
    const nr = document.getElementById('navReservations');
    const ns = document.getElementById('navSupport');
    if (nf) nf.onclick = (e) => { e.preventDefault(); navScrollTo(isAdmin ? 'carGrid' : 'availableGrid', nf); };
    if (nr) nr.onclick = (e) => { e.preventDefault(); navScrollTo(isAdmin ? 'bookingsSection' : 'myBookings-anchor', nr); };
    if (ns) ns.onclick = (e) => { e.preventDefault(); navScrollTo('supportSection', ns); };
  });
}

// ============================================================
// AUTH
// ============================================================
function renderAuth() {
  appEl.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-left">
        <h1>Rent the right car,<br>every time.</h1>
      </div>
      <div class="auth-right">
        <div class="auth-form-wrap">
          <div class="auth-logo"><i class="bi bi-car-front-fill" style="color:var(--brand)"></i> DriveEasy</div>
          <div class="auth-tabs">
            <div class="auth-tab active" id="tabLogin" onclick="switchAuthTab('login')">Sign In</div>
            <div class="auth-tab" id="tabRegister" onclick="switchAuthTab('register')">Create Account</div>
          </div>

          <!-- LOGIN -->
          <div id="loginPane">
            <h2 class="auth-title">Welcome back</h2>
            <p class="auth-subtitle">Sign in to manage your bookings.</p>
            <form id="loginForm">
              <div class="mb-3">
                <label class="form-label">Username</label>
                <input class="form-control" name="username" placeholder="Enter your username" required autocomplete="username">
              </div>
              <div class="mb-3">
                <label class="form-label">Password</label>
                <div class="password-field">
                  <input type="password" class="form-control" name="password" placeholder="Enter your password" required autocomplete="current-password">
                  <button type="button" class="password-toggle-btn" onclick="togglePasswordField(this)" aria-label="Show password"><i class="bi bi-eye"></i></button>
                </div>
              </div>
              <div class="auth-hint mb-4">
                <i class="bi bi-info-circle"></i>
                Demo: <strong>admin</strong> / <strong>Admin@123</strong>
              </div>
              <button class="btn btn-brand w-100 py-2 mb-3">Log In</button>
            </form>
          </div>

          <!-- REGISTER -->
          <div id="registerPane" class="d-none">
            <h2 class="auth-title">Create account</h2>
            <p class="auth-subtitle">Join DriveEasy and start booking.</p>
            <form id="registerForm">
              <div class="mb-3">
                <label class="form-label">Full Name</label>
                <input class="form-control" name="fullName" placeholder="Jane Doe">
              </div>
              <div class="mb-3">
                <label class="form-label">Username</label>
                <input class="form-control" name="username" placeholder="Choose a username" required autocomplete="username">
              </div>
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" name="email" placeholder="jane@example.com" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Phone</label>
                <input class="form-control" name="phone" placeholder="+91 90000 00000">
              </div>
              <div class="mb-4">
                <label class="form-label">Password</label>
                <div class="password-field">
                  <input type="password" class="form-control" name="password" placeholder="Create a strong password" required autocomplete="new-password">
                  <button type="button" class="password-toggle-btn" onclick="togglePasswordField(this)" aria-label="Show password"><i class="bi bi-eye"></i></button>
                </div>
              </div>
              <button class="btn btn-brand w-100 py-2 mb-3">Create Account</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      const res = await Api.login({ username: fd.get('username'), password: fd.get('password') });
      Auth.setSession(res.token, res.username, res.role);
      toast(`Welcome back, ${res.username}!`);
      render();
    } catch (err) {
      toast(err.message, 'danger');
      btn.disabled = false; btn.textContent = 'Log In';
    }
  };

  document.getElementById('registerForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.textContent = 'Creating account…';
    try {
      const res = await Api.register({
        fullName: fd.get('fullName'), username: fd.get('username'),
        email: fd.get('email'), phone: fd.get('phone'), password: fd.get('password')
      });
      Auth.setSession(res.token, res.username, res.role);
      toast('Account created — welcome!');
      render();
    } catch (err) {
      toast(err.message, 'danger');
      btn.disabled = false; btn.textContent = 'Create Account';
    }
  };
}

function switchAuthTab(tab) {
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  document.getElementById('loginPane').classList.toggle('d-none', tab !== 'login');
  document.getElementById('registerPane').classList.toggle('d-none', tab !== 'register');
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
async function renderAdminDashboard() {
  appEl.innerHTML = `
    <div class="container-fluid py-4">
      <div class="row g-4">

        <!-- Sidebar -->
        <div class="col-xl-2 col-lg-3 d-none d-lg-block">
          <div class="admin-sidebar">
            <div class="mb-3">
              <div style="font-weight:800;font-size:.95rem;color:var(--ink)">Admin Panel</div>
              <div style="font-size:.75rem;color:var(--muted)">Fleet Overview</div>
            </div>
            <div class="sidebar-section-label">Main</div>
            <nav class="d-flex flex-column gap-1">
              <span class="sidebar-link active"><i class="bi bi-grid-1x2-fill"></i>Dashboard</span>
              <a href="#" class="sidebar-link" onclick="document.getElementById('carFormTitle').scrollIntoView({behavior:'smooth'});return false"><i class="bi bi-car-front"></i>Fleet Management</a>
              <a href="#" class="sidebar-link" onclick="document.getElementById('bookingsSection').scrollIntoView({behavior:'smooth'});return false"><i class="bi bi-calendar-check"></i>Bookings</a>
              <a href="#" class="sidebar-link" id="sidebarCustomersLink"><i class="bi bi-people"></i>Customers</a>
              <a href="#" class="sidebar-link" id="sidebarSettingsLink"><i class="bi bi-gear"></i>Settings</a>
            </nav>
            <hr class="sidebar-divider">
            <button class="btn btn-brand w-100" style="border-radius:10px;font-size:.85rem;padding:.6rem" id="sidebarAddVehicleBtn">
              <i class="bi bi-plus-lg me-1"></i>Add New Vehicle
            </button>
            <hr class="sidebar-divider">
            <a href="#" class="sidebar-link sidebar-logout" onclick="Auth.clear();render();return false">
              <i class="bi bi-box-arrow-left"></i>Logout
            </a>
          </div>
        </div>

        <!-- Main content -->
        <div class="col-xl-10 col-lg-9">
          <div class="page-header">
            <h1>Admin Console</h1>
            <p>Manage fleet inventory, rates and reservations.</p>
          </div>

          <!-- Stats -->
          <div class="row g-3 mb-4" id="fleetStats"></div>

          <!-- Form + Bookings -->
          <div class="row g-4 mb-4">
            <div class="col-lg-5">
              <div class="admin-form-card">
                <div class="admin-form-title" id="carFormTitle">
                  <i class="bi bi-plus-circle" style="color:var(--brand)"></i>Add a Car
                </div>
                <form id="carForm">
                  <input type="hidden" name="id">
                  <div class="row g-2 mb-2">
                    <div class="col-6">
                      <label class="form-label">Type</label>
                      <select class="form-select" name="type" required>
                        <option value="SUV">SUV</option>
                        <option value="SEDAN">Sedan</option>
                        <option value="TRAVELLER">Traveller</option>
                      </select>
                    </div>
                    <div class="col-6">
                      <label class="form-label">Model</label>
                      <input class="form-control" name="model" placeholder="e.g. Toyota Innova" required>
                    </div>
                  </div>
                  <div class="mb-2">
                    <label class="form-label">Registration No.</label>
                    <input class="form-control" name="registrationNumber" placeholder="ABC-1234" required>
                  </div>
                  <div class="row g-2 mb-2">
                    <div class="col-6">
                      <label class="form-label">Seats</label>
                      <input type="number" min="1" class="form-control" name="seats" placeholder="5" required>
                    </div>
                    <div class="col-6">
                      <label class="form-label">Daily Rate (Rs.)</label>
                      <input type="number" min="1" step="1" class="form-control" name="dailyRate" placeholder="2500" required>
                    </div>
                  </div>
                  <div class="row g-2 mb-2">
                    <div class="col-6">
                      <label class="form-label">Fuel</label>
                      <select class="form-select" name="fuelType">
                        <option value="">— Select —</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="CNG">CNG</option>
                      </select>
                    </div>
                    <div class="col-6">
                      <label class="form-label">Transmission</label>
                      <select class="form-select" name="transmission">
                        <option value="">— Select —</option>
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                        <option value="CVT">CVT</option>
                      </select>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Image URL</label>
                    <input class="form-control" name="imageUrl" placeholder="https://…">
                  </div>
                  <div class="d-grid gap-2">
                    <button type="submit" class="btn-save" id="carFormSubmitBtn">
                      <i class="bi bi-floppy me-1"></i>Save Vehicle
                    </button>
                    <button type="button" class="btn-cancel-form d-none" id="carFormCancelBtn">Cancel</button>
                  </div>
                </form>
              </div>
            </div>

            <div class="col-lg-7" id="bookingsSection">
              <div class="section-heading mb-3"><i class="bi bi-clock-history"></i>Recent Bookings</div>
              <div id="bookingsTable"></div>
            </div>
          </div>

          <!-- Fleet grid -->
          <div class="section-heading mb-3"><i class="bi bi-car-front"></i>Current Fleet Inventory</div>
          <div class="row g-3 mb-4" id="carGrid"></div>

          <!-- Customers -->
          <div class="section-heading mb-3" id="customersSection"><i class="bi bi-people"></i>Customer Directory</div>
          <div id="customersTable"></div>
        </div>
      </div>
    </div>

    <!-- SETTINGS MODAL -->
    <div class="modal fade" id="settingsModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-gear-fill me-2" style="color:var(--brand)"></i>Settings</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted mb-3" style="font-size:.875rem">Signed in as <strong>${escapeHtml(Auth.getUsername() || '')}</strong>. Update your password below.</p>
            <form id="changePasswordForm">
              <div class="mb-2">
                <label class="form-label">Current Password</label>
                <div class="password-field">
                  <input type="password" class="form-control" name="currentPassword" required>
                  <button type="button" class="password-toggle-btn" onclick="togglePasswordField(this)" aria-label="Show password"><i class="bi bi-eye"></i></button>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">New Password</label>
                <div class="password-field">
                  <input type="password" class="form-control" name="newPassword" minlength="6" required>
                  <button type="button" class="password-toggle-btn" onclick="togglePasswordField(this)" aria-label="Show password"><i class="bi bi-eye"></i></button>
                </div>
              </div>
              <button type="submit" class="btn-save w-100" id="changePasswordBtn">
                <i class="bi bi-check-lg me-1"></i>Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  await loadAdminCars();
  await loadAdminBookings();
  await loadAdminCustomers();

  document.getElementById('sidebarCustomersLink').onclick = (e) => {
    e.preventDefault();
    document.getElementById('customersSection').scrollIntoView({ behavior: 'smooth' });
  };

  document.getElementById('sidebarSettingsLink').onclick = (e) => {
    e.preventDefault();
    new bootstrap.Modal(document.getElementById('settingsModal')).show();
  };

  document.getElementById('changePasswordForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = document.getElementById('changePasswordBtn');
    btn.disabled = true;
    try {
      await Api.changePassword({
        currentPassword: fd.get('currentPassword'),
        newPassword: fd.get('newPassword')
      });
      toast('Password updated successfully');
      e.target.reset();
      bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
    } catch (err) {
      toast(err.message, 'danger');
    } finally {
      btn.disabled = false;
    }
  };

  document.getElementById('sidebarAddVehicleBtn').onclick = () => {
    document.getElementById('carFormTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => document.querySelector('#carForm [name=model]').focus(), 400);
  };

  document.getElementById('carForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = fd.get('id');
    const payload = {
      type: fd.get('type'), model: fd.get('model'),
      registrationNumber: fd.get('registrationNumber'),
      seats: Number(fd.get('seats')), dailyRate: Number(fd.get('dailyRate')),
      fuelType: fd.get('fuelType') || null,
      transmission: fd.get('transmission') || null,
      imageUrl: fd.get('imageUrl') || null
    };
    const btn = document.getElementById('carFormSubmitBtn');
    btn.disabled = true;
    try {
      if (id) {
        await Api.adminUpdateCar(id, payload);
        toast('Car updated successfully');
      } else {
        await Api.adminAddCar(payload);
        toast('Car added to fleet');
      }
      resetCarForm();
      await loadAdminCars();
    } catch (err) { toast(err.message, 'danger'); }
    finally { btn.disabled = false; }
  };

  document.getElementById('carFormCancelBtn').onclick = resetCarForm;
}

function resetCarForm() {
  const form = document.getElementById('carForm');
  form.reset();
  form.elements['id'].value = '';
  document.getElementById('carFormTitle').innerHTML = '<i class="bi bi-plus-circle" style="color:var(--brand)"></i>Add a Car';
  document.getElementById('carFormSubmitBtn').innerHTML = '<i class="bi bi-floppy me-1"></i>Save Vehicle';
  document.getElementById('carFormCancelBtn').classList.add('d-none');
}

async function loadAdminCars() {
  try {
    const cars = await Api.adminListCars();

    // Stats
    const byType = cars.reduce((a, c) => { a[c.type] = (a[c.type]||0)+1; return a; }, {});
    document.getElementById('fleetStats').innerHTML = [
      { t:'SUV',       icon:'bi-truck-front',  cls:'suv',       label:'SUVs Active' },
      { t:'SEDAN',     icon:'bi-car-front',    cls:'sedan',     label:'Sedans Active' },
      { t:'TRAVELLER', icon:'bi-bus-front',    cls:'traveller', label:'Travellers Active' }
    ].map(s => `
      <div class="col-md-4">
        <div class="stat-card">
          <div class="stat-icon ${s.cls}"><i class="bi ${s.icon}"></i></div>
          <div>
            <div class="stat-number">${byType[s.t]||0}</div>
            <div class="stat-label">${s.label}</div>
          </div>
        </div>
      </div>`).join('');

    // Grid
    const grid = document.getElementById('carGrid');
    grid.innerHTML = cars.length ? cars.map(adminCarCard).join('') : `
      <div class="col-12"><div class="empty-state">
        <i class="bi bi-car-front"></i>
        <p>No cars in the fleet yet. Add your first vehicle above.</p>
      </div></div>`;

    grid.querySelectorAll('[data-edit]').forEach(btn => {
      btn.onclick = () => {
        const car = cars.find(c => c.id == btn.dataset.edit);
        if (!car) return;
        const f = document.getElementById('carForm').elements;
        f['id'].value       = car.id;
        f['type'].value     = car.type;
        f['model'].value    = car.model;
        f['registrationNumber'].value = car.registrationNumber;
        f['seats'].value    = car.seats;
        f['dailyRate'].value = car.dailyRate;
        f['fuelType'].value  = car.fuelType || '';
        f['transmission'].value = car.transmission || '';
        f['imageUrl'].value  = car.imageUrl || '';
        document.getElementById('carFormTitle').innerHTML = '<i class="bi bi-pencil-square" style="color:var(--brand)"></i>Edit Car Details';
        document.getElementById('carFormSubmitBtn').innerHTML = '<i class="bi bi-check-lg me-1"></i>Update Car';
        document.getElementById('carFormCancelBtn').classList.remove('d-none');
        document.getElementById('carFormTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
    });

    grid.querySelectorAll('[data-remove]').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Remove this car from the fleet? Booking history will be preserved.')) return;
        try {
          await Api.adminRemoveCar(btn.dataset.remove);
          toast('Car removed from fleet');
          await loadAdminCars();
        } catch (err) { toast(err.message, 'danger'); }
      };
    });
  } catch (err) { toast(err.message, 'danger'); }
}

function adminCarCard(c) {
  const typeColors = { SUV: 'type-badge-SUV', SEDAN: 'type-badge-SEDAN', TRAVELLER: 'type-badge-TRAVELLER' };
  return `
    <div class="col-xl-3 col-md-4 col-sm-6">
      <div class="car-card">
        <div class="car-media">
          <img class="car-img" src="${c.imageUrl || 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600'}" alt="${c.model}">
          <span class="reg-badge">REG: ${c.registrationNumber}</span>
        </div>
        <div class="car-body">
          <div class="car-model">${c.model}</div>
          <div class="car-meta">${c.type} &middot; ${c.transmission||''} &middot; ${c.fuelType||''}</div>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="car-price">${money(c.dailyRate)}<span class="car-price-unit">/day</span></span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn-edit-car flex-fill" data-edit="${c.id}"><i class="bi bi-pencil"></i> Edit</button>
            <button class="btn-remove-car flex-fill" data-remove="${c.id}"><i class="bi bi-trash3"></i> Remove</button>
          </div>
        </div>
      </div>
    </div>`;
}

async function loadAdminBookings() {
  try {
    const bookings = await Api.adminAllBookings();
    const el = document.getElementById('bookingsTable');
    if (!bookings.length) {
      el.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i><p>No bookings yet.</p></div>`;
      return;
    }
    const recent = bookings.slice().reverse().slice(0, 10);
    el.innerHTML = `
      <div class="bookings-table-wrap">
        <table class="table mb-0">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Dates</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${recent.map(b => `
              <tr>
                <td><span class="booking-ref">#BKG-${String(b.id).padStart(4,'0')}</span></td>
                <td style="font-weight:600">${b.customer.username}</td>
                <td>${b.car.model}</td>
                <td style="font-size:.82rem;color:var(--muted)">${fmtDate(b.startDate)} → ${fmtDate(b.endDate)}</td>
                <td style="font-weight:700">${money(b.totalAmount)}</td>
                <td><span class="status-badge status-${b.status}">${statusLabel(b.status)}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) { toast(err.message, 'danger'); }
}

async function loadAdminCustomers() {
  try {
    const customers = await Api.adminCustomers();
    const el = document.getElementById('customersTable');
    if (!customers.length) {
      el.innerHTML = `<div class="empty-state"><i class="bi bi-people"></i><p>No registered customers yet.</p></div>`;
      return;
    }
    el.innerHTML = `
      <div class="bookings-table-wrap">
        <table class="table mb-0">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Joined</th>
              <th>Bookings</th>
              <th>Total Spent</th>
            </tr>
          </thead>
          <tbody>
            ${customers.map(c => `
              <tr>
                <td style="font-weight:600">${escapeHtml(c.fullName || c.username)}<div style="font-size:.78rem;color:var(--muted);font-weight:400">@${escapeHtml(c.username)}</div></td>
                <td style="font-size:.82rem;color:var(--muted)">${escapeHtml(c.email || '—')}${c.phone ? '<br>' + escapeHtml(c.phone) : ''}</td>
                <td style="font-size:.82rem;color:var(--muted)">${c.joinedAt ? fmtDate(c.joinedAt.split('T')[0]) : '—'}</td>
                <td>${c.totalBookings}</td>
                <td style="font-weight:700">${money(c.totalSpent)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) { toast(err.message, 'danger'); }
}

// ============================================================
// CUSTOMER DASHBOARD
// ============================================================
async function renderCustomerDashboard() {
  const start   = todayStr();
  const endDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  appEl.innerHTML = `
    <div class="container py-4">
      <div class="page-header text-center">
        <h1>Find Your Ride</h1>
        <p>Search availability by date, book instantly and pay securely.</p>
      </div>

      <!-- Search + AI -->
      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="search-card h-100">
            <div class="section-heading mb-3"><i class="bi bi-search"></i>Quick Search</div>
            <form id="searchForm">
              <div class="row g-3 mb-3">
                <div class="col-sm-6">
                  <label class="search-label">Pick-up Date</label>
                  <input type="date" class="form-control" name="startDate" id="startDateInput"
                    value="${start}" min="${start}" required
                    onchange="document.querySelector('[name=endDate]').min=this.value;if(document.querySelector('[name=endDate]').value<this.value)document.querySelector('[name=endDate]').value=this.value;">
                </div>
                <div class="col-sm-6">
                  <label class="search-label">Return Date</label>
                  <input type="date" class="form-control" name="endDate"
                    value="${endDate}" min="${start}" required>
                </div>
              </div>
              <button class="btn btn-brand w-100 py-2">
                <i class="bi bi-search me-2"></i>Search Available Cars
              </button>
            </form>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="ai-card h-100">
            <div class="d-flex align-items-center gap-2 mb-1">
              <i class="bi bi-stars" style="color:var(--brand);font-size:1.1rem"></i>
              <span style="font-weight:800;font-size:1rem">AI Recommendation</span>
            </div>
            <p class="mb-3" style="font-size:.82rem;color:rgba(255,255,255,.6)">Not sure which car? Let AI recommend the best match.</p>
            <form id="recommendForm">
              <div class="row g-2 mb-2">
                <div class="col-6">
                  <label class="form-label">Passengers</label>
                  <input type="number" min="1" class="form-control" name="passengers" placeholder="e.g. 4">
                </div>
                <div class="col-6">
                  <label class="form-label">Budget/day (Rs.)</label>
                  <input type="number" min="1" class="form-control" name="budgetPerDay" placeholder="e.g. 3000">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Trip Type</label>
                <select class="form-select" name="tripType">
                  <option value="CITY">City Commute</option>
                  <option value="OUTSTATION">Outstation</option>
                  <option value="GROUP">Group Travel</option>
                  <option value="LUGGAGE_HEAVY">Luggage-Heavy</option>
                </select>
              </div>
              <button type="submit" class="btn-ai">
                <i class="bi bi-stars me-1"></i>Get AI Picks
              </button>
            </form>
            <div id="recommendResults" class="mt-3"></div>
          </div>
        </div>
      </div>

      <!-- Available Cars -->
      <div class="section-heading"><i class="bi bi-car-front"></i>Available Cars</div>
      <div class="row g-3 mb-5" id="availableGrid"></div>

      <!-- My Bookings -->
      <div class="section-heading scroll-target" id="myBookings-anchor"><i class="bi bi-journal-check"></i>My Reservations</div>
      <div id="myBookings"></div>

      <!-- Support -->
      <div class="section-heading scroll-target mt-5" id="supportSection"><i class="bi bi-headset"></i>Support</div>
      <div class="row g-4 mb-5">
        <div class="col-lg-6">
          <div class="search-card">
            <div class="admin-form-title"><i class="bi bi-envelope" style="color:var(--brand)"></i>Contact Us</div>
            <form id="supportForm">
              <div class="mb-3">
                <label class="form-label">Subject</label>
                <select class="form-select" name="subject">
                  <option>Booking issue</option>
                  <option>Payment problem</option>
                  <option>Car condition complaint</option>
                  <option>Cancellation request</option>
                  <option>Other</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Message</label>
                <textarea class="form-control" name="message" rows="4" placeholder="Describe your issue…" required></textarea>
              </div>
              <button type="submit" class="btn-save">
                <i class="bi bi-send me-1"></i>Send Message
              </button>
            </form>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="search-card h-100">
            <div class="admin-form-title"><i class="bi bi-question-circle" style="color:var(--brand)"></i>FAQ</div>
            <div class="d-flex flex-column gap-3">
              ${[
                ['How do I cancel a booking?','Go to My Reservations, find the booking and click Cancel. Cancellations are free if made 24h before the pick-up date.'],
                ['When is payment charged?','Payment is processed immediately when you click Pay Now. The booking stays as Pending until payment is completed.'],
                ['Can I modify my booking dates?','Currently modifications are not supported online. Contact support and we will adjust your booking manually.'],
                ['What documents do I need?','A valid driving licence and a government-issued ID are required at pickup.'],
              ].map(([q,a]) => `
                <div>
                  <div style="font-weight:700;font-size:.9rem;color:var(--ink);margin-bottom:.25rem">${q}</div>
                  <div style="font-size:.83rem;color:var(--muted)">${a}</div>
                </div>`).join('<hr style="border-color:var(--border);margin:.25rem 0">')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('searchForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const s = fd.get('startDate'), en = fd.get('endDate');
    if (en < s) { toast('Return date cannot be before pick-up date', 'warning'); return; }
    await loadAvailableCars(s, en);
  };

  document.getElementById('recommendForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Thinking…';
    try {
      const recs = await Api.aiRecommend({
        passengers:   fd.get('passengers')   ? Number(fd.get('passengers'))   : null,
        budgetPerDay: fd.get('budgetPerDay') ? Number(fd.get('budgetPerDay')) : null,
        tripType:     fd.get('tripType')
      });
      const el = document.getElementById('recommendResults');
      if (!recs.length) {
        el.innerHTML = '<p style="color:rgba(255,255,255,.6);font-size:.85rem">No matching cars found.</p>';
      } else {
        el.innerHTML = `<div class="ai-section-label">Top Picks for You</div>` +
          recs.map(r => `
            <div class="recommend-card">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="rc-model">${r.car.model}</div>
                  <div class="rc-reason">${r.reason}</div>
                </div>
                <div class="rc-price ms-2">${money(r.car.dailyRate)}/day</div>
              </div>
            </div>`).join('');
      }
    } catch (err) { toast(err.message, 'danger'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="bi bi-stars me-1"></i>Get AI Picks'; }
  };

  await loadAvailableCars(start, endDate);
  await loadMyBookings();

  // Support form (simulated)
  document.getElementById('supportForm').onsubmit = (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Sent!';
    toast('Your message has been sent. We will get back to you within 24 hours.');
    e.target.reset();
    setTimeout(() => { btn.disabled = false; btn.innerHTML = '<i class="bi bi-send me-1"></i>Send Message'; }, 3000);
  };
}

let currentSearchDates = null;

async function loadAvailableCars(startDate, endDate) {
  currentSearchDates = { startDate, endDate };
  const grid = document.getElementById('availableGrid');
  grid.innerHTML = `<div class="col-12 text-center py-4"><div class="spinner-border text-danger" role="status"></div></div>`;
  try {
    const cars = await Api.availableCars(startDate, endDate);
    if (!cars.length) {
      grid.innerHTML = `<div class="col-12"><div class="empty-state">
        <i class="bi bi-car-front"></i>
        <p>No cars available for the selected dates. Try different dates.</p>
      </div></div>`;
      return;
    }
    grid.innerHTML = cars.map(c => customerCarCard(c)).join('');
    grid.querySelectorAll('[data-book]').forEach(btn => {
      btn.onclick = async () => {
        btn.disabled = true; btn.textContent = 'Booking…';
        try {
          const booking = await Api.bookCar({ carId: btn.dataset.book, startDate, endDate });
          toast(`Booked! Total: ${money(booking.totalAmount)}. Complete payment below.`);
          await loadMyBookings();
          await loadAvailableCars(startDate, endDate);
          document.getElementById('myBookings').scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
          toast(err.message, 'danger');
          btn.disabled = false; btn.textContent = 'Book Now';
        }
      };
    });
  } catch (err) {
    grid.innerHTML = '';
    toast(err.message, 'danger');
  }
}

function customerCarCard(c) {
  return `
    <div class="col-xl-3 col-md-4 col-sm-6">
      <div class="car-card">
        <div class="car-media">
          <img class="car-img" src="${c.imageUrl || 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600'}" alt="${c.model}">
          <span class="type-badge type-badge-${c.type}">${c.type}</span>
        </div>
        <div class="car-body">
          <div class="car-model">${c.model}</div>
          <div class="car-meta">${c.seats} Seats &middot; ${c.transmission||'—'} &middot; ${c.fuelType||'—'}</div>
          <div class="d-flex justify-content-between align-items-center">
            <span class="car-price">${money(c.dailyRate)}<span class="car-price-unit">/day</span></span>
            <button class="btn-book" data-book="${c.id}">Book Now</button>
          </div>
        </div>
      </div>
    </div>`;
}

async function loadMyBookings() {
  const el = document.getElementById('myBookings');
  try {
    const bookings = await Api.myBookings();
    if (!bookings.length) {
      el.innerHTML = `<div class="empty-state">
        <i class="bi bi-journal"></i>
        <p>You have no reservations yet. Search for a car above to get started.</p>
      </div>`;
      return;
    }
    el.innerHTML = bookings.slice().reverse().map(b => `
      <div class="booking-card">
        <div class="booking-card-header">
          <div>
            <div class="booking-car-name">${b.car.model}</div>
            <div class="booking-car-type">${b.car.type} &middot; ${b.car.seats} seats</div>
          </div>
          <span class="status-badge status-${b.status}">${statusLabel(b.status)}</span>
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
            <div class="booking-detail-value" style="font-family:monospace;font-size:.82rem">#BKG-${String(b.id).padStart(4,'0')}</div>
          </div>
        </div>
        <div class="booking-actions">
          ${b.status === 'PENDING'    ? `<button class="btn-pay" data-pay="${b.id}"><i class="bi bi-credit-card me-1"></i>Pay Now</button>` : ''}
          ${b.status === 'PENDING' || b.status === 'CONFIRMED'
              ? `<button class="btn-cancel-booking" data-cancel="${b.id}"><i class="bi bi-x-circle me-1"></i>Cancel</button>` : ''}
        </div>
      </div>`).join('');

    el.querySelectorAll('[data-pay]').forEach(btn => {
      btn.onclick = () => openPaymentModal(btn.dataset.pay);
    });
    el.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Cancel this booking?')) return;
        try {
          await Api.cancelBooking(btn.dataset.cancel);
          toast('Booking cancelled');
          await loadMyBookings();
          if (currentSearchDates) await loadAvailableCars(currentSearchDates.startDate, currentSearchDates.endDate);
        } catch (err) { toast(err.message, 'danger'); }
      };
    });
  } catch (err) { toast(err.message, 'danger'); }
}

// ============================================================
// PAYMENT MODAL
// ============================================================
let _payBookingId = null;
const _payModal = new bootstrap.Modal(document.getElementById('paymentModal'));

function openPaymentModal(bookingId) {
  _payBookingId = bookingId;
  document.getElementById('paymentMethodBtns').classList.remove('d-none');
  document.getElementById('paymentProcessing').classList.add('d-none');
  _payModal.show();
}

document.getElementById('paymentMethodBtns').addEventListener('click', async (e) => {
  const btn = e.target.closest('.pay-method-btn');
  if (!btn || !_payBookingId) return;
  document.getElementById('paymentMethodBtns').classList.add('d-none');
  document.getElementById('paymentProcessing').classList.remove('d-none');
  try {
    const p = await Api.pay({ bookingId: _payBookingId, method: btn.dataset.method });
    _payModal.hide();
    toast(`Payment successful! Ref: ${p.transactionId}`);
    loadMyBookings();
  } catch (err) {
    _payModal.hide();
    toast(err.message, 'danger');
  } finally { _payBookingId = null; }
});

// ============================================================
// AI CHAT WIDGET
// ============================================================
(function setupChatWidget() {
  const toggleBtn = document.getElementById('chatToggleBtn');
  const panel     = document.getElementById('chatPanel');
  const closeBtn  = document.getElementById('chatCloseBtn');
  const input     = document.getElementById('chatInput');
  const sendBtn   = document.getElementById('chatSendBtn');
  const body      = document.getElementById('chatBody');

  toggleBtn.onclick = () => panel.classList.toggle('d-none');
  closeBtn.onclick  = () => panel.classList.add('d-none');

  async function send() {
    const msg = input.value.trim();
    if (!msg) return;
    body.insertAdjacentHTML('beforeend',
      `<div class="chat-row user"><div class="chat-msg user">${msg}</div></div>`);
    input.value = '';
    body.scrollTop = body.scrollHeight;
    const typingId = 'typing_' + Date.now();
    body.insertAdjacentHTML('beforeend',
      `<div class="chat-row bot" id="${typingId}">
        <span class="chat-bubble-avatar"><i class="bi bi-robot"></i></span>
        <div class="chat-msg bot" style="color:var(--muted);font-style:italic">Typing…</div>
      </div>`);
    body.scrollTop = body.scrollHeight;
    try {
      const res = await Api.aiChat(msg);
      document.getElementById(typingId)?.remove();
      body.insertAdjacentHTML('beforeend',
        `<div class="chat-row bot">
          <span class="chat-bubble-avatar"><i class="bi bi-robot"></i></span>
          <div class="chat-msg bot">${res.reply}</div>
        </div>`);
    } catch (err) {
      document.getElementById(typingId)?.remove();
      body.insertAdjacentHTML('beforeend',
        `<div class="chat-row bot">
          <span class="chat-bubble-avatar"><i class="bi bi-robot"></i></span>
          <div class="chat-msg bot" style="color:var(--danger)">Sorry, something went wrong.</div>
        </div>`);
    }
    body.scrollTop = body.scrollHeight;
  }

  sendBtn.onclick = send;
  input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
})();

// ============================================================
// BOOT
// ============================================================
render();
