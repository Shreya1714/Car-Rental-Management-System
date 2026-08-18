const API_BASE = '/api';

const Auth = {
  getToken() { return localStorage.getItem('token'); },
  getRole() { return localStorage.getItem('role'); },
  getUsername() { return localStorage.getItem('username'); },
  setSession(token, username, role) {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
  },
  clear() { localStorage.clear(); },
  isLoggedIn() { return !!this.getToken(); }
};

async function apiCall(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch (e) { data = text; }
  }

  if (!res.ok) {
    const message = (data && data.message) ? data.message : ('Request failed (' + res.status + ')');
    if (res.status === 401 && path !== '/auth/login') {
      Auth.clear();
    }
    throw new Error(message);
  }
  return data;
}

const Api = {
  register: (payload) => apiCall('POST', '/auth/register', payload),
  login: (payload) => apiCall('POST', '/auth/login', payload),

  availableCars: (startDate, endDate) =>
    apiCall('GET', `/cars/available?startDate=${startDate}&endDate=${endDate}`),

  adminAddCar: (payload) => apiCall('POST', '/admin/cars', payload),
  adminUpdateCar: (id, payload) => apiCall('PUT', `/admin/cars/${id}`, payload),
  adminRemoveCar: (id) => apiCall('DELETE', `/admin/cars/${id}`),
  adminListCars: () => apiCall('GET', '/admin/cars'),
  adminAllBookings: () => apiCall('GET', '/admin/bookings'),
  adminCustomers: () => apiCall('GET', '/admin/customers'),

  changePassword: (payload) => apiCall('PUT', '/auth/password', payload),

  bookCar: (payload) => apiCall('POST', '/customer/bookings', payload),
  cancelBooking: (id) => apiCall('DELETE', `/customer/bookings/${id}`),
  myBookings: () => apiCall('GET', '/customer/bookings'),
  pay: (payload) => apiCall('POST', '/customer/payments', payload),

  aiChat: (message) => apiCall('POST', '/ai/chat', { message }),
  aiRecommend: (payload) => apiCall('POST', '/ai/recommend', payload)
};
