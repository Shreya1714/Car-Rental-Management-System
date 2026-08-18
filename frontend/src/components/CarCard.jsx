import { money } from '../utils';

const FALLBACK = 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600';

export default function CarCard({ car, actionLabel, onAction, actionLoading, badge = 'type' }) {
  return (
    <div className="car-card">
      <div className="car-media">
        <img className="car-img" src={car.imageUrl || FALLBACK} alt={car.model} />
        {badge === 'type' && (
          <span className={`type-badge type-badge-${car.type}`}>{car.type}</span>
        )}
        {badge === 'reg' && (
          <span className="reg-badge">REG: {car.registrationNumber}</span>
        )}
      </div>
      <div className="car-body">
        <div className="car-model">{car.model}</div>
        <div className="car-meta">{car.seats} Seats · {car.transmission || '—'} · {car.fuelType || '—'}</div>
        <div className="car-footer">
          <span className="car-price">
            {money(car.dailyRate)}<span className="car-price-unit">/day</span>
          </span>
          {onAction && (
            <button className="btn-book" onClick={() => onAction(car)} disabled={actionLoading}>
              {actionLoading ? '…' : (actionLabel || 'Book Now')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
