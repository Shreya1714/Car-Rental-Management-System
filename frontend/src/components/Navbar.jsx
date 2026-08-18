import { useAuth } from '../context/AuthContext';
import { avatarInitials } from '../utils';

export default function Navbar({ activeTab, onTabChange }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <nav className="navbar sticky-top">
      <div className="nav-inner">
        <a className="navbar-brand" href="#">
          <i className="bi bi-car-front-fill" style={{ color: 'var(--brand)' }}></i>
          DriveEasy Rentals
        </a>

        {user && (
          <div className="nav-links">
            {['Fleet', 'Reservations', 'Support'].map(tab => (
              <button
                key={tab}
                className={`nav-link-item${activeTab === tab ? ' active' : ''}`}
                onClick={() => onTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <div className="nav-right">
          {user ? (
            <>
              <button className="nav-bell"><i className="bi bi-bell"></i></button>
              <span className="nav-role-badge">{isAdmin ? 'Admin' : 'Customer'}</span>
              <span className="nav-username">{user.username}</span>
              <div className="nav-avatar">{avatarInitials(user.username)}</div>
              <button className="btn-nav-logout" onClick={logout}>Logout</button>
            </>
          ) : (
            <span style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.45)' }}>Book smarter with AI</span>
          )}
        </div>
      </div>
    </nav>
  );
}
