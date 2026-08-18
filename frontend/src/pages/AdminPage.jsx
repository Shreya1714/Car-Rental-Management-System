import { useState, useEffect, useRef, useCallback } from 'react';
import { Api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { money, fmtDate, bookingRef } from '../utils';
import CarCard from '../components/CarCard';
import StatusBadge from '../components/StatusBadge';

const EMPTY_FORM = { id: '', type: 'SUV', model: '', registrationNumber: '', seats: '', dailyRate: '', fuelType: '', transmission: '', imageUrl: '' };

export default function AdminPage({ activeTab }) {
  const { logout } = useAuth();
  const toast = useToast();
  const [cars, setCars]         = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [editMode, setEditMode] = useState(false);

  const fleetRef   = useRef(null);
  const reserveRef = useRef(null);

  useEffect(() => {
    const map = { Fleet: fleetRef, Reservations: reserveRef };
    const ref = map[activeTab];
    if (ref?.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeTab]);

  const loadCars     = useCallback(async () => { try { setCars(await Api.adminListCars()); } catch (e) { toast(e.message, 'danger'); } }, [toast]);
  const loadBookings = useCallback(async () => { try { setBookings(await Api.adminAllBookings()); } catch (e) { toast(e.message, 'danger'); } }, [toast]);

  useEffect(() => { loadCars(); loadBookings(); }, []);

  const byType = cars.reduce((a, c) => { a[c.type] = (a[c.type] || 0) + 1; return a; }, {});

  const resetForm = () => { setForm(EMPTY_FORM); setEditMode(false); };

  const handleEdit = (car) => {
    setForm({ id: car.id, type: car.type, model: car.model, registrationNumber: car.registrationNumber,
      seats: car.seats, dailyRate: car.dailyRate, fuelType: car.fuelType || '', transmission: car.transmission || '', imageUrl: car.imageUrl || '' });
    setEditMode(true);
    fleetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this car from the fleet?')) return;
    try { await Api.adminRemoveCar(id); toast('Car removed'); loadCars(); }
    catch (e) { toast(e.message, 'danger'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { type: form.type, model: form.model, registrationNumber: form.registrationNumber,
      seats: Number(form.seats), dailyRate: Number(form.dailyRate), fuelType: form.fuelType || null,
      transmission: form.transmission || null, imageUrl: form.imageUrl || null };
    try {
      if (editMode) { await Api.adminUpdateCar(form.id, payload); toast('Car updated'); }
      else          { await Api.adminAddCar(payload); toast('Car added to fleet'); }
      resetForm(); loadCars();
    } catch (e) { toast(e.message, 'danger'); }
    finally { setSaving(false); }
  };

  const F = (field) => ({ value: form[field], onChange: e => setForm(f => ({ ...f, [field]: e.target.value })) });

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--ink)' }}>Admin Panel</div>
        <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: '1rem' }}>Fleet Overview</div>
        <div className="sidebar-section-label">Main</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
            { icon: 'bi-car-front',     label: 'Fleet Management' },
            { icon: 'bi-calendar-check',label: 'Bookings' },
            { icon: 'bi-people',        label: 'Customers' },
            { icon: 'bi-gear',          label: 'Settings' },
          ].map(({ icon, label }) => (
            <span key={label} className={`sidebar-link${label === 'Dashboard' ? ' active' : ''}`}>
              <i className={`bi ${icon}`}></i>{label}
            </span>
          ))}
        </nav>
        <hr className="sidebar-divider" />
        <button className="btn-brand w-full" style={{ borderRadius: '10px', fontSize: '.85rem', padding: '.6rem' }}
          onClick={() => fleetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
          <i className="bi bi-plus-lg me-1"></i>Add New Vehicle
        </button>
        <hr className="sidebar-divider" />
        <button className="sidebar-link sidebar-logout w-full" onClick={logout}>
          <i className="bi bi-box-arrow-left"></i>Logout
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="page-header">
          <h1>Admin Console</h1>
          <p>Manage fleet inventory, rates and reservations.</p>
        </div>

        {/* Stats */}
        <div className="stats-grid mb-4">
          {[{ t:'SUV', icon:'bi-truck-front', cls:'suv', label:'SUVs Active' },
            { t:'SEDAN', icon:'bi-car-front', cls:'sedan', label:'Sedans Active' },
            { t:'TRAVELLER', icon:'bi-bus-front', cls:'traveller', label:'Travellers Active' }
          ].map(s => (
            <div key={s.t} className="stat-card">
              <div className={`stat-icon ${s.cls}`}><i className={`bi ${s.icon}`}></i></div>
              <div><div className="stat-number">{byType[s.t] || 0}</div><div className="stat-label">{s.label}</div></div>
            </div>
          ))}
        </div>

        {/* Form + Bookings */}
        <div className="two-col-grid mb-4">
          {/* Car Form */}
          <div className="admin-form-card" ref={fleetRef} style={{ scrollMarginTop: '80px' }}>
            <div className="admin-form-title">
              <i className={`bi ${editMode ? 'bi-pencil-square' : 'bi-plus-circle'}`} style={{ color: 'var(--brand)' }}></i>
              {editMode ? 'Edit Car Details' : 'Add a Car'}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="date-row mb-2">
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-select" {...F('type')} required>
                    {['SUV','SEDAN','TRAVELLER'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Model</label>
                  <input className="form-control" placeholder="e.g. Toyota Innova" {...F('model')} required />
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label">Registration No.</label>
                <input className="form-control" placeholder="ABC-1234" {...F('registrationNumber')} required />
              </div>
              <div className="date-row mb-2">
                <div>
                  <label className="form-label">Seats</label>
                  <input type="number" min="1" className="form-control" placeholder="5" {...F('seats')} required />
                </div>
                <div>
                  <label className="form-label">Daily Rate (Rs.)</label>
                  <input type="number" min="1" className="form-control" placeholder="2500" {...F('dailyRate')} required />
                </div>
              </div>
              <div className="date-row mb-2">
                <div>
                  <label className="form-label">Fuel</label>
                  <select className="form-select" {...F('fuelType')}>
                    <option value="">— Select —</option>
                    {['Petrol','Diesel','Electric','Hybrid','CNG'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Transmission</label>
                  <select className="form-select" {...F('transmission')}>
                    <option value="">— Select —</option>
                    {['Automatic','Manual','CVT'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Image URL</label>
                <input className="form-control" placeholder="https://…" {...F('imageUrl')} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button type="submit" className="btn-save" disabled={saving}>
                  <i className={`bi ${editMode ? 'bi-check-lg' : 'bi-floppy'} me-1`}></i>
                  {saving ? 'Saving…' : (editMode ? 'Update Car' : 'Save Vehicle')}
                </button>
                {editMode && <button type="button" className="btn-cancel-form" onClick={resetForm}>Cancel</button>}
              </div>
            </form>
          </div>

          {/* Bookings Table */}
          <div ref={reserveRef} style={{ scrollMarginTop: '80px' }}>
            <div className="section-heading mb-3"><i className="bi bi-clock-history"></i>Recent Bookings</div>
            {bookings.length === 0 ? (
              <div className="empty-state"><i className="bi bi-calendar-x"></i><p>No bookings yet.</p></div>
            ) : (
              <div className="bookings-table-wrap">
                <table>
                  <thead>
                    <tr>{['Booking ID','Customer','Vehicle','Dates','Amount','Status'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[...bookings].reverse().slice(0, 10).map(b => (
                      <tr key={b.id}>
                        <td><span className="booking-ref">{bookingRef(b.id)}</span></td>
                        <td style={{ fontWeight: 600 }}>{b.customer.username}</td>
                        <td>{b.car.model}</td>
                        <td style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{fmtDate(b.startDate)} → {fmtDate(b.endDate)}</td>
                        <td style={{ fontWeight: 700 }}>{money(b.totalAmount)}</td>
                        <td><StatusBadge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Fleet Grid */}
        <div className="section-heading mb-3"><i className="bi bi-car-front"></i>Current Fleet Inventory</div>
        {cars.length === 0 ? (
          <div className="empty-state"><i className="bi bi-car-front"></i><p>No cars in the fleet yet.</p></div>
        ) : (
          <div className="car-grid">
            {cars.map(c => (
              <div key={c.id} className="car-card">
                <div className="car-media">
                  <img className="car-img" src={c.imageUrl || 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600'} alt={c.model} />
                  <span className="reg-badge">REG: {c.registrationNumber}</span>
                </div>
                <div className="car-body">
                  <div className="car-model">{c.model}</div>
                  <div className="car-meta">{c.type} · {c.transmission || ''} · {c.fuelType || ''}</div>
                  <div className="car-footer mb-3">
                    <span className="car-price">{money(c.dailyRate)}<span className="car-price-unit">/day</span></span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-edit-car" style={{ flex: 1 }} onClick={() => handleEdit(c)}><i className="bi bi-pencil"></i> Edit</button>
                    <button className="btn-remove-car" style={{ flex: 1 }} onClick={() => handleRemove(c.id)}><i className="bi bi-trash3"></i> Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
