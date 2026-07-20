const BASE_URL = 'http://localhost:5000/api/v1';
// const BASE_URL = 'https://transport-management-system-1-jbat.onrender.com/api/v1'
// const BASE_URL = "https://tm-backend-dn3t.onrender.com/api/v1";
// const BASE_URL = "https://tm-backend-virid.vercel.app/api/v1";

async function request(path, options = {}) {
  const token = localStorage.getItem('authToken');
  const headers = new Headers(options.headers || {});

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw data || { message: 'Request failed' };
  }

  return data;
}

function toFormData(driver) {
  const formData = new FormData();
  ['name', 'email', 'password', 'phone', 'vehicleNumber', 'address', 'emergencyContact'].forEach((key) => {
    formData.append(key, driver[key] || '');
  });
  formData.append('experience', String(driver.experience || '0'));
  if (driver.license) formData.append('license', driver.license);
  return formData;
}

export const auth = {
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('role');
  },
  saveFcmToken: (fcmToken) => request('/auth/fcm-token', { method: 'PUT', body: JSON.stringify({ fcmToken }) }),
  getMe: () => request('/auth/me'),
  updatePassword: (data) => request('/auth/updatepassword', { method: 'PUT', body: JSON.stringify(data) })
};

export const adminApi = {
  getAllDrivers: () => request('/drivers'),
  updateDriverStatus: (id, status) => request(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify({ isVerified: status }) }),
  addDriver: (driver) => request('/auth/register', { method: 'POST', body: toFormData(driver) }),
  updateDriver: (id, driver) => request(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(driver) }),
  deleteDriver: (id) => request(`/drivers/${id}`, { method: 'DELETE' }),
  addTrip: (trip) => request('/trips', { method: 'POST', body: JSON.stringify(trip) }),
  getTrips: () => request('/trips'),
  assignDriver: (tripId, driverId, distance) => request(`/trips/${tripId}/assign`, { method: 'PATCH', body: JSON.stringify({ driverId, distance }) }),
  updateTrip: (id, trip) => request(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(trip) }),
  deleteTrip: (id) => request(`/trips/${id}`, { method: 'DELETE' }),
  getFareConfig: () => request('/trips/fare-config'),
  updateFareConfig: (data) => request('/trips/fare-config', { method: 'PATCH', body: JSON.stringify(data) }),
  getPayments: (params) => request('/payments' + (params ? '?' + new URLSearchParams(params) : '')),
  getPaymentStats: () => request('/payments/stats'),
  collectCustomerPayment: (data) => request('/payments/collect', { method: 'POST', body: JSON.stringify(data) }),
  payoutDriver: (data) => request('/payments/payout', { method: 'POST', body: JSON.stringify(data) }),
  getReports: (params) => request('/trips/reports' + (params ? '?' + new URLSearchParams(params) : '')),
  getNotifications: () => request('/notifications/admin'),
  sendNotification: (data) => request('/notifications', { method: 'POST', body: JSON.stringify(data) })
};

export const driverApi = {
  getMyTrips: () => request('/trips/my-trips'),
  acceptTrip: (id) => request(`/trips/${id}/accept`, { method: 'PATCH', body: JSON.stringify({}) }),
  cancelTrip: (id) => request(`/trips/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({}) }),
  startTrip: (id) => request(`/trips/${id}/start`, { method: 'PATCH', body: JSON.stringify({}) }),
  completeTrip: (id) => request(`/trips/${id}/complete`, { method: 'PATCH', body: JSON.stringify({}) }),
  getMyEarnings: () => request('/trips/my-earnings'),
  getNotifications: () => request('/notifications/driver')
};
