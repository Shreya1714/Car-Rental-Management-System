const API_BASE = '/api';

// ── Auth helpers ─────────────────────────────────────────────
export const Auth = {
  getToken:    () => localStorage.getItem('token'),
  getRole:     () => localStorage.getItem('role'),
  getUsername: () => localStorage.getItem('username'),
  setSession(token, username, role) {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
  },
  clear() { localStorage.removeItem('token'); localStorage.removeItem('username'); localStorage.removeItem('role'); },
  isLoggedIn: () => !!localStorage.getItem('token'),
};

// ── Central fetch wrapper ────────────────────────────────────
async function apiCall(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }

  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    if (res.status === 401 && path !== '/auth/login') Auth.clear();
    throw new Error(msg);
  }
  return data;
}

// ── API methods ──────────────────────────────────────────────
export const Api = {
  register:        (p)  => apiCall('POST', '/auth/register', p),
  login:           (p)  => apiCall('POST', '/auth/login', p),

  availableCars:   (s, e) => apiCall('GET', `/cars/available?startDate=${s}&endDate=${e}`),

  adminListCars:   ()   => apiCall('GET',    '/admin/cars'),
  adminAddCar:     (p)  => apiCall('POST',   '/admin/cars', p),
  adminUpdateCar:  (id, p) => apiCall('PUT', `/admin/cars/${id}`, p),
  adminRemoveCar:  (id) => apiCall('DELETE', `/admin/cars/${id}`),
  adminAllBookings:()   => apiCall('GET',    '/admin/bookings'),

  myBookings:      ()   => apiCall('GET',    '/customer/bookings'),
  bookCar:         (p)  => apiCall('POST',   '/customer/bookings', p),
  cancelBooking:   (id) => apiCall('DELETE', `/customer/bookings/${id}`),
  pay:             (p)  => apiCall('POST',   '/customer/payments', p),

  aiChat:          (msg) => apiCall('POST',  '/ai/chat',      { message: msg }),
  aiRecommend:     (p)   => apiCall('POST',  '/ai/recommend', p),
};
