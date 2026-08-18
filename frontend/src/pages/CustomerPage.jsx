import { useState, useEffect, useRef, useCallback } from 'react';
import { Api } from '../api';
import { useToast } from '../context/ToastContext';
import { money, today, fmtDate, statusLabel, bookingRef } from '../utils';
import CarCard from '../components/CarCard';
import StatusBadge from '../components/StatusBadge';
import PaymentModal from '../components/PaymentModal';

const tomorrow2 = () => { const d = new Date(Date.now() + 86400000*2); return d.toISOString().split('T')[0]; };

export default function CustomerPage({ activeTab }) {
  const toast = useToast();
  const [startDate, setStartDate]   = useState(today());
  const [endDate, setEndDate]       = useState(tomorrow2());
  const [cars, setCars]             = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [bookingCarId, setBookingCarId] = useState(null);
  const [bookings, setBookings]     = useState([]);
  const [payBookingId, setPayBookingId] = useState(null);
  const [recommend, setRecommend]   = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  // Section refs for scroll
  const fleetRef       = useRef(null);
  const reserveRef     = useRef(null);
  const supportRef     = useRef(null);

  useEffect(() => {
    const map = { Fleet: fleetRef, Reservations: reserveRef, Support: supportRef };
    const ref = map[activeTab];
    if (ref?.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeTab]);

  const loadCars = useCallback(async (s, e) => {
    setCarsLoading(true);
    try { setCars(await Api.availableCars(s, e)); }
    catch (err) { toast(err.message, 'danger'); }
    finally { setCarsLoading(false); }
  }, [toast]);

  const loadBookings = useCallback(async () => {
    try { setBookings(await Api.myBookings()); }
    catch (err) { toast(err.message, 'danger'); }
  }, [toast]);

  useEffect(() => { loadCars(startDate, endDate); loadBookings(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (endDate < startDate) { toast('Return date cannot be before pick-up date', 'warning'); return; }
    loadCars(startDate, endDate);
  };

  const handleBook = async (car) => {
    setBookingCarId(car.id);
    try {
      const b = await Api.bookCar({ carId: car.id, startDate, endDate });
      toast(`Booked! Total: ${money(b.totalAmount)}`);
      loadBookings(); loadCars(startDate, endDate);
    } catch (err) { toast(err.message, 'danger'); }
    finally { setBookingCarId(null); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try { await Api.cancelBooking(id); toast('Booking cancelled'); loadBookings(); loadCars(startDate, endDate); }
    catch (err) { toast(err.message, 'danger'); }
  };

  const handleRecommend = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setRecLoading(true);
    try {
      const recs = await Api.aiRecommend({
        passengers:   fd.get('passengers')   ? Number(fd.get('passengers'))   : null,
        budgetPerDay: fd.get('budgetPerDay') ? Number(fd.get('budgetPerDay')) : null,
        tripType:     fd.get('tripType'),
      });
      setRecommend(recs);
    } catch (err) { toast(err.message, 'danger'); }
    finally { setRecLoading(false); }
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    toast('Your message has been sent. We will get back to you within 24 hours.');
    e.target.reset();
  };

  return (
    <div className="page-container">
      <div className="page-header text-center">
        <h1>Find Your Ride</h1>
        <p>Search availability by date, book instantly and pay securely.</p>
      </div>

      {/* Search + AI */}
      <div className="two-col-grid mb-4">
        <div className="search-card" ref={fleetRef} style={{ scrollMarginTop: '80px' }}>
          <div className="section-heading"><i className="bi bi-search"></i>Quick Search</div>
          <form onSubmit={handleSearch}>
            <div className="date-row">
              <div>
                <label className="search-label">Pick-up Date</label>
                <input type="date" className="form-control" value={startDate} min={today()}
                  onChange={e => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value); }}
                  required />
              </div>
              <div>
                <label className="search-label">Return Date</label>
                <input type="date" className="form-control" value={endDate} min={startDate}
                  onChange={e => setEndDate(e.target.value)} required />
              </div>
            </div>
            <button className="btn-brand w-full mt-3" type="submit">
              <i className="bi bi-search me-2"></i>Search Available Cars
            </button>
          </form>
        </div>

        <div className="ai-card">
          <div className="ai-card-title">
            <i className="bi bi-stars" style={{ color: 'var(--brand)' }}></i>
            AI Recommendation
          </div>
          <p className="ai-card-sub">Not sure which car? Let AI recommend the best match.</p>
          <form onSubmit={handleRecommend}>
            <div className="date-row mb-2">
              <div>
                <label className="form-label" style={{ color: 'rgba(255,255,255,.6)' }}>Passengers</label>
                <input type="number" min="1" className="form-control" name="passengers" placeholder="e.g. 4" />
              </div>
              <div>
                <label className="form-label" style={{ color: 'rgba(255,255,255,.6)' }}>Budget/day (Rs.)</label>
                <input type="number" min="1" className="form-control" name="budgetPerDay" placeholder="e.g. 3000" />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ color: 'rgba(255,255,255,.6)' }}>Trip Type</label>
              <select className="form-select" name="tripType">
                <option value="CITY">City Commute</option>
                <option value="OUTSTATION">Outstation</option>
                <option value="GROUP">Group Travel</option>
                <option value="LUGGAGE_HEAVY">Luggage-Heavy</option>
              </select>
            </div>
            <button type="submit" className="btn-ai" disabled={recLoading}>
              <i className="bi bi-stars me-1"></i>{recLoading ? 'Thinking…' : 'Get AI Picks'}
            </button>
          </form>
          {recommend.length > 0 && (
            <div className="mt-3">
              <div className="ai-section-label">Top Picks for You</div>
              {recommend.map((r, i) => (
                <div key={i} className="recommend-card">
                  <div className="rc-model">{r.car.model}</div>
                  <div className="d-flex justify-between">
                    <div className="rc-reason">{r.reason}</div>
                    <div className="rc-price">{money(r.car.dailyRate)}/day</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Cars */}
      <div className="section-heading"><i className="bi bi-car-front"></i>Available Cars</div>
      {carsLoading ? (
        <div className="center-spinner"><div className="spinner"></div></div>
      ) : cars.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-car-front"></i>
          <p>No cars available for the selected dates. Try different dates.</p>
        </div>
      ) : (
        <div className="car-grid mb-5">
          {cars.map(c => (
            <CarCard key={c.id} car={c} badge="type"
              onAction={handleBook}
              actionLoading={bookingCarId === c.id}
            />
          ))}
        </div>
      )}

      {/* My Reservations */}
      <div className="section-heading" ref={reserveRef} style={{ scrollMarginTop: '80px' }}>
        <i className="bi bi-journal-check"></i>My Reservations
      </div>
      {bookings.length === 0 ? (
        <div className="empty-state mb-5">
          <i className="bi bi-journal"></i>
          <p>No reservations yet. Search for a car above to get started.</p>
        </div>
      ) : (
        <div className="mb-5">
          {[...bookings].reverse().map(b => (
            <div key={b.id} className="booking-card">
              <div className="booking-card-header">
                <div>
                  <div className="booking-car-name">{b.car.model}</div>
                  <div className="booking-car-type">{b.car.type} · {b.car.seats} seats</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="booking-detail-grid">
                <div><div className="booking-detail-label">Pick-up</div><div className="booking-detail-value">{fmtDate(b.startDate)}</div></div>
                <div><div className="booking-detail-label">Return</div><div className="booking-detail-value">{fmtDate(b.endDate)}</div></div>
                <div><div className="booking-detail-label">Total Amount</div><div className="booking-detail-value">{money(b.totalAmount)}</div></div>
                <div><div className="booking-detail-label">Booking Ref</div><div className="booking-detail-value" style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{bookingRef(b.id)}</div></div>
              </div>
              <div className="booking-actions">
                {b.status === 'PENDING' && <button className="btn-pay" onClick={() => setPayBookingId(b.id)}><i className="bi bi-credit-card me-1"></i>Pay Now</button>}
                {(b.status === 'PENDING' || b.status === 'CONFIRMED') && <button className="btn-cancel-booking" onClick={() => handleCancel(b.id)}><i className="bi bi-x-circle me-1"></i>Cancel</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Support */}
      <div className="section-heading" ref={supportRef} style={{ scrollMarginTop: '80px' }}>
        <i className="bi bi-headset"></i>Support
      </div>
      <div className="two-col-grid mb-5">
        <div className="search-card">
          <div className="admin-form-title"><i className="bi bi-envelope" style={{ color: 'var(--brand)' }}></i>Contact Us</div>
          <form onSubmit={handleSupportSubmit}>
            <div className="mb-3">
              <label className="form-label">Subject</label>
              <select className="form-select" name="subject">
                {['Booking issue','Payment problem','Car condition complaint','Cancellation request','Other'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Message</label>
              <textarea className="form-control" name="message" rows="4" placeholder="Describe your issue…" required></textarea>
            </div>
            <button type="submit" className="btn-save"><i className="bi bi-send me-1"></i>Send Message</button>
          </form>
        </div>

        <div className="search-card">
          <div className="admin-form-title"><i className="bi bi-question-circle" style={{ color: 'var(--brand)' }}></i>FAQ</div>
          {[
            ['How do I cancel a booking?', 'Go to My Reservations, find the booking and click Cancel. Cancellations are free if made 24h before the pick-up date.'],
            ['When is payment charged?', 'Payment is processed immediately when you click Pay Now. The booking stays Pending until payment is completed.'],
            ['Can I modify my booking dates?', 'Contact support and we will adjust your booking manually.'],
            ['What documents do I need?', 'A valid driving licence and a government-issued ID are required at pickup.'],
          ].map(([q, a], i, arr) => (
            <div key={q}>
              <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--ink)', marginBottom: '.25rem' }}>{q}</div>
              <div style={{ fontSize: '.83rem', color: 'var(--muted)' }}>{a}</div>
              {i < arr.length - 1 && <hr style={{ borderColor: 'var(--border)', margin: '.65rem 0' }} />}
            </div>
          ))}
        </div>
      </div>

      {payBookingId && (
        <PaymentModal
          bookingId={payBookingId}
          onClose={() => setPayBookingId(null)}
          onSuccess={loadBookings}
        />
      )}
    </div>
  );
}
