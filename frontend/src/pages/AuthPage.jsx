import { useState } from 'react';
import { Api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPage() {
  const { login } = useAuth();
  const toast = useToast();
  const [tab, setTab]       = useState('login');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setLoading(true);
    try {
      const res = await Api.login({ username: fd.get('username'), password: fd.get('password') });
      login(res.token, res.username, res.role);
      toast(`Welcome back, ${res.username}!`);
    } catch (err) { toast(err.message, 'danger'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setLoading(true);
    try {
      const res = await Api.register({
        fullName: fd.get('fullName'), username: fd.get('username'),
        email: fd.get('email'), phone: fd.get('phone'), password: fd.get('password')
      });
      login(res.token, res.username, res.role);
      toast('Account created — welcome!');
    } catch (err) { toast(err.message, 'danger'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <h1>Rent the right car,<br />every time.</h1>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-logo">
            <i className="bi bi-car-front-fill" style={{ color: 'var(--brand)' }}></i> DriveEasy
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Create Account</button>
          </div>

          {tab === 'login' ? (
            <>
              <h2 className="auth-title">Welcome back</h2>
              <p className="auth-subtitle">Sign in to manage your bookings.</p>
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input className="form-control" name="username" placeholder="Enter your username" required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" name="password" placeholder="Enter your password" required />
                </div>
                <div className="auth-hint mb-4">
                  <i className="bi bi-info-circle"></i>
                  Demo: <strong>admin</strong> / <strong>Admin@123</strong>
                </div>
                <button className="btn-brand w-full py-2" disabled={loading}>
                  {loading ? 'Signing in…' : 'Log In'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="auth-title">Create account</h2>
              <p className="auth-subtitle">Join DriveEasy and start booking.</p>
              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" name="fullName" placeholder="Jane Doe" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input className="form-control" name="username" placeholder="Choose a username" required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" name="email" placeholder="jane@example.com" required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input className="form-control" name="phone" placeholder="+91 90000 00000" />
                </div>
                <div className="mb-4">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" name="password" placeholder="Create a strong password" required />
                </div>
                <button className="btn-brand w-full py-2" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
