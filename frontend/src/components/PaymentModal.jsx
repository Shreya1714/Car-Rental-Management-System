import { useState } from 'react';
import { Api } from '../api';
import { useToast } from '../context/ToastContext';

export default function PaymentModal({ bookingId, onClose, onSuccess }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const pay = async (method) => {
    setLoading(true);
    try {
      const p = await Api.pay({ bookingId: Number(bookingId), method });
      toast(`Payment successful! Ref: ${p.transactionId}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast(err.message, 'danger');
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <h5><i className="bi bi-lock-fill" style={{ color: 'var(--brand)', marginRight: '8px' }}></i>Secure Payment</h5>
          <button className="btn-close-modal" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="modal-bdy">
          <p className="modal-sub">Choose your payment method to confirm the booking.</p>
          {loading ? (
            <div className="modal-loading">
              <div className="spinner"></div>
              <p>Processing payment…</p>
            </div>
          ) : (
            <div className="pay-methods">
              {[
                { method: 'CARD',       icon: 'bi-credit-card-2-front', label: 'Credit / Debit Card' },
                { method: 'UPI',        icon: 'bi-phone',               label: 'UPI' },
                { method: 'NETBANKING', icon: 'bi-building',            label: 'Net Banking' },
              ].map(({ method, icon, label }) => (
                <button key={method} className="pay-method-btn" onClick={() => pay(method)}>
                  <i className={`bi ${icon}`}></i>
                  <span className="pm-label">{label}</span>
                  <i className="bi bi-chevron-right pm-arrow"></i>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
