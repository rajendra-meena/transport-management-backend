import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { adminApi, auth, driverApi } from './api';
import { listenForMessages, requestPermissionAndGetToken } from './fcm';
import logo from './assets/e27bbbd3-fe74-43dd-8707-17f62674af2d.jpg';

const emptyDriver = {
  name: '', email: '', password: '', phone: '', vehicleNumber: '', experience: '', address: '', emergencyContact: '', license: null
};
const emptyTrip = { pickupLocation: '', dropLocation: '', customerName: '', customerPhone: '' };

function fmtDate(value, options = {}) {
  if (!value) return '-';
  return new Date(value).toLocaleString(undefined, options);
}

function Placeholder({ title }) {
  return <div className="placeholder-page">{title} works!</div>;
}

function Toasts({ alerts, removeAlert }) {
  return (
    <div className="toast-container-custom">
      {alerts.map((alert) => (
        <div className={`custom-toast ${alert.type}`} key={alert.id}>
          <div className="toast-content">
            <span className="icon"><i className={alert.type === 'success' ? 'fa-solid fa-check' : 'fa-solid fa-xmark'} /></span>
            <p>{alert.message}</p>
          </div>
          <button className="close-toast" onClick={() => removeAlert(alert.id)}>&times;</button>
        </div>
      ))}
    </div>
  );
}

function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const showAlert = (type, message) => {
    const id = crypto.randomUUID();
    setAlerts((items) => [...items, { id, type, message }]);
    setTimeout(() => setAlerts((items) => items.filter((item) => item.id !== id)), 3000);
  };
  const removeAlert = (id) => setAlerts((items) => items.filter((item) => item.id !== id));
  return { alerts, showAlert, removeAlert };
}

function ProtectedRoute({ children }) {
  return localStorage.getItem('authToken') ? children : <Navigate to="/" replace />;
}

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const invalidEmail = touched.email && !/^\S+@\S+\.\S+$/.test(form.email);
  const invalidPassword = touched.password && form.password.length < 3;

  const login = async (event) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    if (!/^\S+@\S+\.\S+$/.test(form.email) || form.password.length < 3) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await auth.login(form);
      if (res?.token) localStorage.setItem('authToken', res.token);
      if (res?.role) localStorage.setItem('role', res.role);
      requestPermissionAndGetToken().catch(console.error);
      navigate(res?.role === 'driver' ? '/driver' : res?.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setErrorMessage(err?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-lg p-4 login-card">
        <h3 className="text-center mb-4"><img src={logo} className="img-fluid w-50 h-25" alt="Ram Transport" /></h3>
        <form onSubmit={login}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" placeholder="Enter email" value={form.email} onBlur={() => setTouched((v) => ({ ...v, email: true }))} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} />
            {invalidEmail && <div className="text-danger small">Enter valid email</div>}
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" placeholder="Enter password" value={form.password} onBlur={() => setTouched((v) => ({ ...v, password: true }))} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} />
            {invalidPassword && <div className="text-danger small">Minimum 3 characters required</div>}
          </div>
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
          <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>{isLoading && <span className="spinner-border spinner-border-sm me-2" />}{isLoading ? 'Logging in...' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
}

function Shell({ role, links, children }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const logout = () => { auth.logout(); navigate('/'); };
  return (
    <div className="wrapper d-flex">
      <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header d-flex align-items-center justify-content-between p-3">
          <h5 className="logo text-white m-auto text-center"><img src={logo} className="img-fluid w-50 rounded-4" alt="Ram Transport" /></h5>
          <button className="btn toggle-btn" onClick={() => setCollapsed((v) => !v)}><i className="fa-solid fa-bars" /></button>
        </div>
        <ul className="nav flex-column px-2">
          {links.map((link) => (
            <li className="nav-item" key={link.to}>
              <NavLink className="nav-link" to={link.to}><i className={`${link.icon} me-2`} /><span>{link.label}</span></NavLink>
            </li>
          ))}
          <li className="nav-item mt-4"><button className="nav-link text-danger logout-link" onClick={logout}><i className="fa-solid fa-right-from-bracket me-2" /><span>Logout</span></button></li>
        </ul>
        <div className="sidebar-footer mt-auto p-3 text-white"><small>{role}</small></div>
      </nav>
      <div className="main flex-grow-1">
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-3"><button className="btn btn-sm text-dark toggle-btn" onClick={() => setCollapsed((v) => !v)}><i className="fa-solid fa-bars" /></button></nav>
        <div className="p-4 content-area">{children}</div>
      </div>
    </div>
  );
}

function AdminLayout() {
  const links = [
    { to: '/admin/admin_dashboard', icon: 'fa-solid fa-table-columns', label: 'Dashboard' },
    { to: '/admin/driver_management', icon: 'fa-solid fa-id-card', label: 'Driver Management' },
    { to: '/admin/trip_management', icon: 'fa-solid fa-route', label: 'Trip Management' },
    { to: '/admin/reports', icon: 'fa-solid fa-chart-line', label: 'Reports' },
    { to: '/admin/billing_payment', icon: 'fa-solid fa-file-invoice-dollar', label: 'Billing & Payments' },
    { to: '/admin/notification', icon: 'fa-solid fa-bell', label: 'Notifications' },
    { to: '/admin/settings', icon: 'fa-solid fa-gear', label: 'Settings' },
    { to: '/admin/profile', icon: 'fa-solid fa-user-circle', label: 'Profile' }
  ];
  return <Shell role="Admin" links={links}><Routes><Route index element={<Navigate to="admin_dashboard" replace />} /><Route path="admin_dashboard" element={<AdminDashboard />} /><Route path="driver_management" element={<DriverManagement />} /><Route path="trip_management" element={<TripManagement />} /><Route path="settings" element={<AdminSettings />} /><Route path="billing_payment" element={<AdminBillingAndPayments />} /><Route path="notification" element={<AdminNotifications />} /><Route path="profile" element={<AdminProfile />} /><Route path="reports" element={<AdminReports />} /></Routes></Shell>;
}

function DriverLayout() {
  const links = [
    { to: '/driver/my_trips', icon: 'fa-solid fa-table-columns', label: 'Trips' },
    { to: '/driver/my_earnings', icon: 'fa-solid fa-id-card', label: 'Earnings' },
    { to: '/driver/notifications', icon: 'fa-solid fa-bell', label: 'Notifications' },
    { to: '/driver/profile', icon: 'fa-solid fa-user-circle', label: 'Profile' }
  ];
  return <Shell role="Driver" links={links}><Routes><Route index element={<Navigate to="my_trips" replace />} /><Route path="my_trips" element={<MyTrips />} /><Route path="my_earnings" element={<DriverEarnings />} /><Route path="notifications" element={<DriverNotifications />} /><Route path="profile" element={<DriverProfile />} /></Routes></Shell>;
}

function AdminDashboard() {
  const [stats, setStats] = useState({ totalTrips: 0, totalDrivers: 0, completedTrips: 0, activeDrivers: 0, recentTrips: [] });
  useEffect(() => {
    Promise.all([adminApi.getTrips(), adminApi.getAllDrivers()]).then(([tripRes, driverRes]) => {
      const trips = tripRes.data || [];
      const drivers = driverRes.data || [];
      setStats({ totalTrips: trips.length, completedTrips: trips.filter((t) => t.status === 'COMPLETED').length, totalDrivers: drivers.length, activeDrivers: drivers.filter((d) => d.isVerified).length, recentTrips: trips.slice(0, 6) });
    }).catch(console.error);
  }, []);
  return <><div className="row mb-4">{[['Total Trips', stats.totalTrips], ['Completed Trips', stats.completedTrips], ['Total Drivers', stats.totalDrivers], ['Active Drivers', stats.activeDrivers]].map(([label, value]) => <div className="col-md-3" key={label}><div className="stat-card"><h6>{label}</h6><h3>{value}</h3></div></div>)}</div><h5 className="mb-3">Recent Trips</h5><div className="row">{stats.recentTrips.map((trip) => <div className="col-md-4 mb-3" key={trip._id}><div className="trip-card"><div className={`status-badge ${trip.status}`}>{trip.status}</div><div className="route">{trip.pickupLocation} -&gt; {trip.dropLocation}</div><div className="customer mt-2"><strong>{trip.customerName}</strong><p>{trip.customerPhone}</p></div>{trip.driverId && <div className="driver mt-2">Car {trip.driverId.name}</div>}<div className="trip-footer mt-2"><small>{fmtDate(trip.createdAt)}</small></div></div></div>)}</div></>;
}

function DriverManagement() {
  const { alerts, showAlert, removeAlert } = useAlerts();
  const [drivers, setDrivers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState(emptyDriver);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = 5;
  const loadDrivers = () => adminApi.getAllDrivers().then((res) => setDrivers(res.data || [])).catch(console.error);
  useEffect(() => { loadDrivers(); }, []);
  const filteredDrivers = useMemo(() => drivers.filter((d) => [d.name, d.email, d.phone, d.vehicleNumber].some((v) => String(v || '').toLowerCase().includes(searchText.toLowerCase()))), [drivers, searchText]);
  const pages = Math.max(1, Math.ceil(filteredDrivers.length / itemsPerPage));
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const updateForm = (key, value) => setForm((v) => ({ ...v, [key]: value }));
  const resetForm = () => { setSelectedDriverId(''); setForm(emptyDriver); };
  const saveDriver = async () => {
    try {
      selectedDriverId ? await adminApi.updateDriver(selectedDriverId, form) : await adminApi.addDriver(form);
      showAlert('success', selectedDriverId ? 'Driver updated successfully' : 'Driver added successfully');
      resetForm(); await loadDrivers();
    } catch { showAlert('error', selectedDriverId ? 'Failed to update driver' : 'Failed to add driver'); }
  };
  const editDriver = (driver) => { setSelectedDriverId(driver._id); setForm({ ...emptyDriver, ...driver, password: '', license: null }); };
  const toggleDriverStatus = async (driver) => {
    try { await adminApi.updateDriverStatus(driver._id, !driver.isVerified); setDrivers((items) => items.map((d) => d._id === driver._id ? { ...d, isVerified: !d.isVerified } : d)); showAlert('success', `Driver ${!driver.isVerified ? 'Activated' : 'Deactivated'} successfully`); } catch { showAlert('error', 'Failed to update driver status'); }
  };
  const confirmDelete = async () => { try { await adminApi.deleteDriver(deleteTarget._id); setDeleteTarget(null); showAlert('success', 'Driver deleted successfully'); await loadDrivers(); } catch { showAlert('error', 'Failed to delete driver'); } };
  return <><Toasts alerts={alerts} removeAlert={removeAlert} /><div className="text-end m-1 mb-4"><button className="btn add-btn mb-3 shadow" onClick={resetForm}>+ Add Driver</button></div><div className="modal-panel mb-4"><h5>{selectedDriverId ? 'Edit Driver' : 'Add Driver'}</h5><div className="row">{['name','email','password','phone','vehicleNumber','experience','emergencyContact'].map((key) => <div className="col-md-6 mb-3" key={key}><input type={key === 'password' ? 'password' : key === 'experience' ? 'number' : 'text'} className="form-control" placeholder={key.replace(/([A-Z])/g, ' $1')} value={form[key] || ''} onChange={(e) => updateForm(key, e.target.value)} /></div>)}<div className="col-md-6 mb-3"><input type="file" className="form-control" onChange={(e) => updateForm('license', e.target.files?.[0] || null)} /></div><div className="col-12 mb-3"><textarea className="form-control" placeholder="Address" value={form.address || ''} onChange={(e) => updateForm('address', e.target.value)} /></div></div><button className="btn submit-btn" onClick={saveDriver}>{selectedDriverId ? 'Update Driver' : 'Add Driver'}</button></div><div className="table-card"><div className="table-header d-flex justify-content-between align-items-center"><h5 className="m-0">Drivers List</h5><input className="form-control search-input" placeholder="Search drivers..." value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} /></div><div className="table-responsive"><table className="custom-table"><thead><tr><th>#</th><th>Driver</th><th>Contact</th><th>Vehicle</th><th>Experience</th><th>Status</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead><tbody>{paginatedDrivers.map((driver, index) => <tr key={driver._id}><td>{(currentPage - 1) * itemsPerPage + index + 1}</td><td className="driver-cell"><div className="avatar">{driver.name?.charAt(0)}</div><div><p className="name">{driver.name}</p><small>{driver.email}</small></div></td><td>{driver.phone}</td><td>{driver.vehicleNumber}</td><td><span className="exp-badge">{driver.experience} yrs</span></td><td><span className={`status-badge-inline ${driver.isVerified ? 'verified' : 'not-verified'}`}>{driver.isVerified ? 'Verified' : 'Pending'}</span></td><td>{fmtDate(driver.createdAt, { dateStyle: 'medium' })}</td><td><button className={`status-toggle-btn ${driver.isVerified ? 'active-btn' : 'inactive-btn'}`} onClick={() => toggleDriverStatus(driver)}>{driver.isVerified ? 'Deactivate' : 'Activate'}</button></td><td><button className="btn btn-sm add-btn me-2 shadow" onClick={() => editDriver(driver)}>Edit</button><button className="btn btn-sm btn-danger shadow" onClick={() => setDeleteTarget(driver)}>Delete</button></td></tr>)}</tbody></table></div><div className="d-flex justify-content-between align-items-center mt-3"><p className="text-muted m-0">Showing {filteredDrivers.length ? (currentPage - 1) * itemsPerPage + 1 : 0} - {(currentPage - 1) * itemsPerPage + paginatedDrivers.length} of {filteredDrivers.length}</p><nav className="custom-pagination"><ul><li className={currentPage === 1 ? 'disabled' : ''} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</li>{Array.from({ length: pages }, (_, i) => <li className={currentPage === i + 1 ? 'active' : ''} key={i} onClick={() => setCurrentPage(i + 1)}>{i + 1}</li>)}<li className={currentPage === pages ? 'disabled' : ''} onClick={() => setCurrentPage((p) => Math.min(pages, p + 1))}>Next</li></ul></nav></div></div>{deleteTarget && <div className="confirm-overlay"><div className="confirm-box"><h5>Confirm Delete</h5><p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>?</p><button className="btn btn-secondary me-2" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="btn btn-danger" onClick={confirmDelete}>Yes, Delete</button></div></div>}</>;
}

function TripManagement() {
  const { alerts, showAlert, removeAlert } = useAlerts();
  const [trips, setTrips] = useState([]), [drivers, setDrivers] = useState([]), [searchText, setSearchText] = useState(''), [newTrip, setNewTrip] = useState(emptyTrip), [editTrip, setEditTrip] = useState(null), [deleteTrip, setDeleteTrip] = useState(null);
  const load = () => Promise.all([adminApi.getTrips(), adminApi.getAllDrivers()]).then(([t, d]) => { setTrips(t.data || []); setDrivers(d.data || []); }).catch(console.error);
  useEffect(() => { load(); }, []);
  const filteredTrips = trips.filter((trip) => [trip.pickupLocation, trip.dropLocation, trip.customerName, trip.customerPhone, trip.status, trip.driverId?.name].some((v) => String(v || '').toLowerCase().includes(searchText.toLowerCase())));
  const updateTripState = (id, patch) => setTrips((items) => items.map((trip) => trip._id === id ? { ...trip, ...patch } : trip));
  const addTrip = async () => { try { await adminApi.addTrip(newTrip); setNewTrip(emptyTrip); showAlert('success', 'Trip created successfully'); await load(); } catch { showAlert('error', 'Failed to create trip'); } };
  const saveTrip = async () => { try { await adminApi.updateTrip(editTrip._id, editTrip); updateTripState(editTrip._id, editTrip); setEditTrip(null); showAlert('success', 'Trip updated successfully'); } catch { showAlert('error', 'Failed to update trip'); } };
  const removeTrip = async () => { try { await adminApi.deleteTrip(deleteTrip._id); setTrips((items) => items.filter((trip) => trip._id !== deleteTrip._id)); setDeleteTrip(null); showAlert('success', 'Trip deleted successfully'); } catch { showAlert('error', 'Failed to delete trip'); } };
  const assignDriver = async (trip) => { if (!trip.selectedDriver) return; try { await adminApi.assignDriver(trip._id, trip.selectedDriver, trip.distance); const driver = drivers.find((d) => d._id === trip.selectedDriver); updateTripState(trip._id, { driverId: driver }); showAlert('success', 'Driver assigned successfully'); } catch { showAlert('error', 'Failed to assign driver'); } };
  const tripForm = (trip, setTrip) => <div className="row">{['pickupLocation','dropLocation','customerName','customerPhone'].map((key) => <div className="col-md-6 mb-3" key={key}><label>{key.replace(/([A-Z])/g, ' $1')}</label><input className="form-control" value={trip[key] || ''} onChange={(e) => setTrip((v) => ({ ...v, [key]: e.target.value }))} /></div>)}</div>;
  return <><Toasts alerts={alerts} removeAlert={removeAlert} /><div className="modal-panel mb-4"><h5>Create Trip</h5>{tripForm(newTrip, setNewTrip)}<button className="btn submit-btn" onClick={addTrip}>Create Trip</button></div><div className="search-box mb-4"><input className="form-control" placeholder="Search by location, name, phone..." value={searchText} onChange={(e) => setSearchText(e.target.value)} /></div><div className="row">{filteredTrips.map((trip) => <div className="col-md-4 mb-4" key={trip._id}><div className="trip-card"><div className={`status-badge ${trip.status}`}>{trip.status}</div><div className="route mt-2"><span>{trip.pickupLocation}</span><span className="arrow"> -&gt; </span><span>{trip.dropLocation}</span></div><button className="btn btn-sm btn-danger" onClick={() => setDeleteTrip(trip)}>Delete</button><div className="customer mt-3"><h6>{trip.customerName}</h6><p>{trip.customerPhone}</p></div>{trip.driverId && <div className="driver mt-2"><small>Car {trip.driverId.name} ({trip.driverId.vehicleNumber})</small></div>}<div className="stats mt-3"><div><small>Distance</small><p>{trip.distance || 0} km</p></div><div><small>Fare</small><p>Rs {trip.fare || 0}</p></div><div><small>Earning</small><p>Rs {trip.driverEarning || 0}</p></div></div>{!trip.driverId && <div className="assign-section mt-3"><input type="number" className="form-control mb-2" placeholder="Distance (km)" value={trip.distance || ''} onChange={(e) => updateTripState(trip._id, { distance: e.target.value })} /><select className="form-select" value={trip.selectedDriver || ''} onChange={(e) => updateTripState(trip._id, { selectedDriver: e.target.value })}><option value="" hidden>Select Driver</option>{drivers.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.vehicleNumber})</option>)}</select><button className="btn assign-btn mt-2 w-100" disabled={!trip.selectedDriver} onClick={() => assignDriver(trip)}>Assign Driver</button></div>}<div className="trip-footer mt-3"><small>{fmtDate(trip.createdAt)}</small><button className="btn btn-sm btn-warning me-2" onClick={() => setEditTrip({ ...trip })}>Edit</button></div></div></div>)}</div>{editTrip && <div className="confirm-overlay"><div className="confirm-box wide"><h5>Edit Trip</h5>{tripForm(editTrip, setEditTrip)}<button className="btn btn-secondary me-2" onClick={() => setEditTrip(null)}>Cancel</button><button className="btn submit-btn" onClick={saveTrip}>Update Trip</button></div></div>}{deleteTrip && <div className="confirm-overlay"><div className="confirm-box"><h5>Delete Trip</h5><p>Are you sure you want to delete this trip?</p><strong>{deleteTrip.pickupLocation} -&gt; {deleteTrip.dropLocation}</strong><div className="mt-3"><button className="btn btn-secondary me-2" onClick={() => setDeleteTrip(null)}>Cancel</button><button className="btn btn-danger" onClick={removeTrip}>Yes, Delete</button></div></div></div>}</>;
}

function AdminSettings() {
  const { alerts, showAlert, removeAlert } = useAlerts();
  const [fare, setFare] = useState({ baseFare: 0, perKmRate: 0, commissionRate: 0 });
  useEffect(() => { adminApi.getFareConfig().then((res) => setFare(res.data || fare)).catch(console.error); }, []);
  const updateFare = async () => { try { await adminApi.updateFareConfig(fare); showAlert('success', 'Fare configuration updated successfully'); } catch (err) { showAlert('error', err?.message || 'Failed to update fare configuration'); } };
  return <><Toasts alerts={alerts} removeAlert={removeAlert} /><div className="container py-4"><div className="config-card"><div className="config-header"><div><h3>Fare Configuration</h3><p>Manage fare and commission settings</p></div><button type="button" className="save-btn" onClick={updateFare}>Update Settings</button></div><div className="row g-4 mt-2">{[['baseFare','Rs','Base Fare','Minimum trip amount'], ['perKmRate','KM','Per KM Rate','Charge per kilometer'], ['commissionRate','%','Commission Rate','Platform commission']].map(([key, icon, label, help]) => <div className="col-md-4" key={key}><div className="setting-box"><div className="setting-icon">{icon}</div><label>{label}</label><input type="number" value={fare[key] || 0} onChange={(e) => setFare((v) => ({ ...v, [key]: e.target.value }))} /><small>{help}</small></div></div>)}</div><div className="preview"><h5>Current Summary</h5><div className="preview-grid"><div>Rs {fare.baseFare || 0}<span>Base Fare</span></div><div>Rs {fare.perKmRate || 0}<span>Per KM</span></div><div>{fare.commissionRate || 0}%<span>Commission</span></div></div></div></div></div></>;
}

function AdminBillingAndPayments() {
  const { alerts, showAlert, removeAlert } = useAlerts();
  const [stats, setStats] = useState({ totalCollected: 0, totalPaidOut: 0, pendingPayouts: { count: 0, amount: 0 }, estimatedRevenue: 0 });
  const [payments, setPayments] = useState([]);
  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState('history');
  const [search, setSearch] = useState('');
  const [actionTrip, setActionTrip] = useState(null);
  const [actionType, setActionType] = useState('');
  const [paymentForm, setPaymentForm] = useState({ paymentMethod: 'CASH', transactionId: '' });
  const [invoiceTrip, setInvoiceTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, paymentsRes, tripsRes] = await Promise.all([
        adminApi.getPaymentStats(),
        adminApi.getPayments(),
        adminApi.getTrips()
      ]);
      if (statsRes?.success) setStats(statsRes.data);
      if (paymentsRes?.success) setPayments(paymentsRes.data || []);
      if (tripsRes?.success) setTrips(tripsRes.data || []);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingCollections = useMemo(() => {
    return trips.filter(trip => {
      if (trip.status !== 'COMPLETED') return false;
      return !payments.some(p => p.tripId?._id === trip._id && p.paymentType === 'CUSTOMER_PAYMENT');
    });
  }, [trips, payments]);

  const pendingPayoutsList = useMemo(() => {
    return trips.filter(trip => {
      if (trip.status !== 'COMPLETED' || !trip.driverId) return false;
      return !payments.some(p => p.tripId?._id === trip._id && p.paymentType === 'DRIVER_PAYOUT');
    });
  }, [trips, payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const driverName = p.driverId?.name || '';
      const txId = p.transactionId || '';
      const type = p.paymentType || '';
      const method = p.paymentMethod || '';
      return [driverName, txId, type, method].some(v => v.toLowerCase().includes(search.toLowerCase()));
    });
  }, [payments, search]);

  const openActionModal = (trip, type) => {
    setActionTrip(trip);
    setActionType(type);
    setPaymentForm({ paymentMethod: type === 'collect' ? 'CASH' : 'BANK_TRANSFER', transactionId: '' });
  };

  const closeActionModal = () => {
    setActionTrip(null);
    setActionType('');
  };

  const handlePaymentAction = async () => {
    if (!actionTrip) return;
    try {
      const payload = {
        tripId: actionTrip._id,
        paymentMethod: paymentForm.paymentMethod,
        transactionId: paymentForm.transactionId
      };
      if (actionType === 'collect') {
        await adminApi.collectCustomerPayment(payload);
        showAlert('success', 'Customer payment collected successfully');
      } else {
        await adminApi.payoutDriver(payload);
        showAlert('success', 'Driver payout processed successfully');
      }
      closeActionModal();
      await loadData();
    } catch (err) {
      showAlert('error', err?.error || 'Operation failed');
    }
  };

  return (
    <>
      <Toasts alerts={alerts} removeAlert={removeAlert} />
      <div className="container-fluid py-2">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold text-dark mb-1">Billing &amp; Payments</h4>
            <p className="text-muted small">Manage platform revenue and driver payouts</p>
          </div>
          <button className="btn btn-primary shadow-sm" onClick={loadData} disabled={isLoading}>
            {isLoading ? <i className="fa-solid fa-arrows-rotate fa-spin me-2" /> : <i className="fa-solid fa-arrows-rotate me-2" />}
            Refresh Ledgers
          </button>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0 p-3 h-100 text-white bg-dark">
              <small className="text-white-50 uppercase fw-semibold">Customer Collections</small>
              <h3 className="fw-bold mt-1">Rs {stats.totalCollected}</h3>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0 p-3 h-100 text-white bg-success">
              <small className="text-white-50 uppercase fw-semibold">Driver Payouts</small>
              <h3 className="fw-bold mt-1">Rs {stats.totalPaidOut}</h3>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0 p-3 h-100 bg-white border-start border-danger border-4">
              <small className="text-muted uppercase fw-semibold text-danger">Pending Payouts</small>
              <h3 className="fw-bold mt-1 text-dark">Rs {stats.pendingPayouts?.amount || 0}</h3>
              <small className="text-muted">{stats.pendingPayouts?.count || 0} trips pending payout</small>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0 p-3 h-100 bg-white border-start border-primary border-4">
              <small className="text-muted uppercase fw-semibold text-primary">Platform Net Revenue</small>
              <h3 className="fw-bold mt-1 text-dark">Rs {stats.estimatedRevenue}</h3>
              <small className="text-muted">Estimated profit</small>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4 bg-white">
          <div className="card-header bg-white border-0 pt-3 px-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex gap-2">
                <button className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-light border'}`} onClick={() => setActiveTab('history')}>
                  Transaction History
                </button>
                <button className={`btn btn-sm position-relative ${activeTab === 'collect' ? 'btn-primary' : 'btn-light border'}`} onClick={() => setActiveTab('collect')}>
                  Collect Payments
                  {pendingCollections.length > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{pendingCollections.length}</span>}
                </button>
                <button className={`btn btn-sm position-relative ${activeTab === 'payout' ? 'btn-primary' : 'btn-light border'}`} onClick={() => setActiveTab('payout')}>
                  Driver Payouts
                  {pendingPayoutsList.length > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{pendingPayoutsList.length}</span>}
                </button>
              </div>

              {activeTab === 'history' && (
                <div>
                  <input type="text" className="form-control form-control-sm search-input" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              )}
            </div>
          </div>

          <div className="card-body px-4 pb-4">
            {activeTab === 'history' && (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Transaction Date</th>
                      <th>Reference Trip</th>
                      <th>Type</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Driver</th>
                      <th>Status</th>
                      <th>Reference ID</th>
                      <th>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-4 text-muted">No transactions found</td>
                      </tr>
                    ) : (
                      filteredPayments.map(p => (
                        <tr key={p._id}>
                          <td>{fmtDate(p.createdAt)}</td>
                          <td>
                            {p.tripId ? (
                              <div>
                                <span className="fw-semibold">{p.tripId.pickupLocation}</span>
                                <i className="fa-solid fa-arrow-right mx-2 text-muted" />
                                <span className="fw-semibold">{p.tripId.dropLocation}</span>
                              </div>
                            ) : (
                              <span className="text-muted">Deleted Trip</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${p.paymentType === 'CUSTOMER_PAYMENT' ? 'bg-info text-dark' : 'bg-success'}`}>
                              {p.paymentType === 'CUSTOMER_PAYMENT' ? 'Collection' : 'Payout'}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">{p.paymentMethod}</span>
                          </td>
                          <td className="fw-bold text-dark">Rs {p.amount}</td>
                          <td>{p.driverId?.name || '-'}</td>
                          <td>
                            <span className={`status-badge-inline ${p.status === 'COMPLETED' ? 'verified' : 'not-verified'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td>
                            <code className="text-muted">{p.transactionId || '-'}</code>
                          </td>
                          <td>
                            {p.tripId && (
                              <button className="btn btn-sm btn-link text-primary p-0" onClick={() => setInvoiceTrip(p.tripId)}>
                                <i className="fa-solid fa-file-invoice me-1" /> View
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'collect' && (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Route</th>
                      <th>Customer Details</th>
                      <th>Driver</th>
                      <th>Distance</th>
                      <th>Fare</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCollections.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">No completed trips pending collection</td>
                      </tr>
                    ) : (
                      pendingCollections.map(trip => (
                        <tr key={trip._id}>
                          <td>{fmtDate(trip.createdAt, { dateStyle: 'short' })}</td>
                          <td>
                            <span className="fw-semibold">{trip.pickupLocation}</span>
                            <i className="fa-solid fa-arrow-right mx-2 text-muted" />
                            <span className="fw-semibold">{trip.dropLocation}</span>
                          </td>
                          <td>
                            <div className="small">
                              <strong>{trip.customerName}</strong>
                              <div className="text-muted">{trip.customerPhone}</div>
                            </div>
                          </td>
                          <td>{trip.driverId?.name || 'Unassigned'}</td>
                          <td>{trip.distance} KM</td>
                          <td className="fw-bold text-dark">Rs {trip.fare}</td>
                          <td>
                            <button className="btn btn-sm btn-info text-white shadow-sm" onClick={() => openActionModal(trip, 'collect')}>
                              <i className="fa-solid fa-hand-holding-dollar me-1" /> Collect Payment
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'payout' && (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Route</th>
                      <th>Driver Details</th>
                      <th>Fare</th>
                      <th>Net Earning</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayoutsList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">No completed trips pending driver payout</td>
                      </tr>
                    ) : (
                      pendingPayoutsList.map(trip => (
                        <tr key={trip._id}>
                          <td>{fmtDate(trip.createdAt, { dateStyle: 'short' })}</td>
                          <td>
                            <span className="fw-semibold">{trip.pickupLocation}</span>
                            <i className="fa-solid fa-arrow-right mx-2 text-muted" />
                            <span className="fw-semibold">{trip.dropLocation}</span>
                          </td>
                          <td>
                            {trip.driverId ? (
                              <div className="small">
                                <strong>{trip.driverId.name}</strong>
                                <div className="text-muted">{trip.driverId.vehicleNumber}</div>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>Rs {trip.fare}</td>
                          <td className="fw-bold text-success">Rs {trip.driverEarning}</td>
                          <td>
                            <button className="btn btn-sm btn-success shadow-sm" onClick={() => openActionModal(trip, 'payout')}>
                              <i className="fa-solid fa-money-bill-transfer me-1" /> Pay Driver
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {actionTrip && (
        <div className="confirm-overlay text-dark">
          <div className="confirm-box text-start p-4">
            <h5 className="fw-bold border-bottom pb-2 mb-3">
              {actionType === 'collect' ? 'Collect Customer Payment' : 'Process Driver Payout'}
            </h5>
            <div className="mb-3 card bg-light p-3 border-0 rounded-3 text-dark">
              <div className="row g-2 small">
                <div className="col-6"><strong>Pickup:</strong> {actionTrip.pickupLocation}</div>
                <div className="col-6"><strong>Drop:</strong> {actionTrip.dropLocation}</div>
                <div className="col-6"><strong>Customer:</strong> {actionTrip.customerName}</div>
                <div className="col-6"><strong>Driver:</strong> {actionTrip.driverId?.name || 'N/A'}</div>
                <div className="col-12 mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                  <span>Total Fare:</span>
                  <span className="h6 mb-0 fw-bold">Rs {actionTrip.fare}</span>
                </div>
                {actionType === 'payout' && (
                  <div className="col-12 d-flex justify-content-between align-items-center text-success">
                    <span>Driver Net Earning:</span>
                    <span className="h6 mb-0 fw-bold">Rs {actionTrip.driverEarning}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Payment Method</label>
              <select className="form-select form-select-sm" value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm(v => ({ ...v, paymentMethod: e.target.value }))}>
                {actionType === 'collect' ? (
                  <>
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD</option>
                    <option value="UPI">UPI</option>
                  </>
                ) : (
                  <>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">CASH</option>
                  </>
                )}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold">Transaction Reference ID (Optional)</label>
              <input type="text" className="form-control form-control-sm" placeholder="Enter transaction/UPI ID" value={paymentForm.transactionId} onChange={(e) => setPaymentForm(v => ({ ...v, transactionId: e.target.value }))} />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary btn-sm" onClick={closeActionModal}>Cancel</button>
              <button className={`btn btn-sm ${actionType === 'collect' ? 'btn-info text-white' : 'btn-success'}`} onClick={handlePaymentAction}>
                Confirm {actionType === 'collect' ? 'Collection' : 'Payout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {invoiceTrip && (
        <div className="confirm-overlay no-print-overlay text-dark">
          <div className="confirm-box wide p-4 invoice-print-box shadow-lg rounded-4">
            <div className="invoice-header d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
              <div>
                <h4 className="fw-bold mb-1">RAM TRANSPORT</h4>
                <p className="text-muted small m-0">Trips Receipt &amp; Billing Statement</p>
              </div>
              <div className="text-end">
                <span className="badge bg-success text-white p-2">PAID</span>
                <p className="text-muted small mt-1 mb-0">Trip ID: {invoiceTrip._id}</p>
              </div>
            </div>

            <div className="row g-4 mb-4">
              <div className="col-sm-6">
                <h6 className="fw-bold text-muted small uppercase">Customer Info</h6>
                <p className="m-0 fw-semibold">{invoiceTrip.customerName}</p>
                <p className="text-muted small m-0">{invoiceTrip.customerPhone}</p>
              </div>
              <div className="col-sm-6 text-sm-end">
                <h6 className="fw-bold text-muted small uppercase">Driver &amp; Vehicle</h6>
                <p className="m-0 fw-semibold">{invoiceTrip.driverId?.name || 'N/A'}</p>
                <p className="text-muted small m-0">Vehicle: {invoiceTrip.driverId?.vehicleNumber || 'N/A'}</p>
              </div>
            </div>

            <div className="card border-0 bg-light p-3 mb-4 rounded-3">
              <h6 className="fw-bold small mb-3 text-muted uppercase">Trip Route Details</h6>
              <div className="row g-3">
                <div className="col-sm-5">
                  <small className="text-muted">Pickup Location</small>
                  <p className="fw-semibold m-0">{invoiceTrip.pickupLocation}</p>
                </div>
                <div className="col-sm-2 text-center d-none d-sm-block align-self-center">
                  <i className="fa-solid fa-arrow-right text-primary fs-4" />
                </div>
                <div className="col-sm-5 text-sm-end">
                  <small className="text-muted">Drop Location</small>
                  <p className="fw-semibold m-0">{invoiceTrip.dropLocation}</p>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-sm table-borderless">
                <thead>
                  <tr className="border-bottom border-secondary-subtle">
                    <th>Description</th>
                    <th className="text-end">Details</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Trip Distance Charge</td>
                    <td className="text-end">{invoiceTrip.distance} KM</td>
                    <td className="text-end">Rs {invoiceTrip.fare}</td>
                  </tr>
                  <tr className="border-top border-secondary-subtle fw-bold h5">
                    <td colSpan="2">Total Paid</td>
                    <td className="text-end text-primary">Rs {invoiceTrip.fare}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top no-print">
              <button className="btn btn-secondary btn-sm" onClick={() => setInvoiceTrip(null)}>Close</button>
              <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                <i className="fa-solid fa-print me-1" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AdminReports() {
  const { alerts, showAlert, removeAlert } = useAlerts();
  const [dates, setDates] = useState({ startDate: '', endDate: '' });
  const [reportData, setReportData] = useState({
    totalTrips: 0,
    completedTripsCount: 0,
    cancelledTripsCount: 0,
    activeTripsCount: 0,
    financials: { totalRevenue: 0, totalDriverEarnings: 0, totalSystemCommission: 0 },
    statusBreakdown: { CREATED: 0, ASSIGNED: 0, ACCEPTED: 0, EN_ROUTE: 0, COMPLETED: 0, CANCELLED: 0 }
  });
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = async (startDate = '', endDate = '') => {
    setIsLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const reportRes = await adminApi.getReports(params);
      const tripsRes = await adminApi.getTrips();

      if (reportRes?.success) {
        setReportData(reportRes.data);
      }
      if (tripsRes?.success) {
        let filtered = tripsRes.data || [];
        if (startDate || endDate) {
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;
          if (end) end.setHours(23, 59, 59, 999);

          filtered = filtered.filter(t => {
            const date = new Date(t.createdAt);
            if (start && date < start) return false;
            if (end && date > end) return false;
            return true;
          });
        }
        setTrips(filtered);
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 30);
    const startStr = start.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];
    setDates({ startDate: startStr, endDate: endStr });
    fetchReport(startStr, endStr);
  }, []);

  const handleApplyFilter = () => {
    fetchReport(dates.startDate, dates.endDate);
  };

  const applyPreset = (days) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);
    const startStr = start.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];
    setDates({ startDate: startStr, endDate: endStr });
    fetchReport(startStr, endStr);
  };

  const financials = reportData.financials;
  const maxFinVal = Math.max(financials.totalRevenue, financials.totalDriverEarnings, financials.totalSystemCommission, 1);
  const revHeight = (financials.totalRevenue / maxFinVal) * 120;
  const earnHeight = (financials.totalDriverEarnings / maxFinVal) * 120;
  const commHeight = (financials.totalSystemCommission / maxFinVal) * 120;

  const totalBreakdown = Object.values(reportData.statusBreakdown).reduce((a, b) => a + b, 0) || 1;
  const statuses = [
    { name: 'COMPLETED', count: reportData.statusBreakdown.COMPLETED || 0, color: '#0ABD67' },
    { name: 'CANCELLED', count: reportData.statusBreakdown.CANCELLED || 0, color: '#ff4d4f' },
    { name: 'ACTIVE', count: (reportData.statusBreakdown.ASSIGNED || 0) + (reportData.statusBreakdown.ACCEPTED || 0) + (reportData.statusBreakdown.EN_ROUTE || 0) + (reportData.statusBreakdown.CREATED || 0), color: '#021D49' }
  ];

  let cumulativePercent = 0;
  const donutSlices = statuses.map((status) => {
    const percent = status.count / totalBreakdown;
    const strokeDash = percent * 2 * Math.PI * 40;
    const strokeOffset = (1 - cumulativePercent) * 2 * Math.PI * 40;
    cumulativePercent += percent;
    return {
      ...status,
      percentStr: (percent * 100).toFixed(0) + '%',
      strokeDash,
      strokeOffset
    };
  });

  return (
    <>
      <Toasts alerts={alerts} removeAlert={removeAlert} />
      <div className="container-fluid py-2 text-dark">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">Reports &amp; Analytics</h4>
            <p className="text-muted small">Monitor system operations and financial growth</p>
          </div>
          <button className="btn btn-primary shadow-sm" onClick={() => window.print()}>
            <i className="fa-solid fa-print me-2" />
            Print Report
          </button>
        </div>

        <div className="card shadow-sm border-0 p-3 mb-4 rounded-4 bg-white">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-light border text-dark" onClick={() => applyPreset(0)}>Today</button>
                <button className="btn btn-sm btn-light border text-dark" onClick={() => applyPreset(7)}>7 Days</button>
                <button className="btn btn-sm btn-light border text-dark" onClick={() => applyPreset(30)}>30 Days</button>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <label className="form-label small fw-semibold text-muted mb-1">Start Date</label>
              <input type="date" className="form-control form-control-sm text-dark bg-white" value={dates.startDate} onChange={(e) => setDates(v => ({ ...v, startDate: e.target.value }))} />
            </div>
            <div className="col-md-3 col-6">
              <label className="form-label small fw-semibold text-muted mb-1">End Date</label>
              <input type="date" className="form-control form-control-sm text-dark bg-white" value={dates.endDate} onChange={(e) => setDates(v => ({ ...v, endDate: e.target.value }))} />
            </div>
            <div className="col-md-1">
              <button className="btn btn-primary btn-sm w-100 shadow-sm" onClick={handleApplyFilter} disabled={isLoading}>
                Go
              </button>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <div className="card shadow-sm border-0 p-3 h-100 bg-white">
              <small className="text-muted uppercase fw-semibold">Total Booked Trips</small>
              <h3 className="fw-bold mt-2 mb-0">{reportData.totalTrips}</h3>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card shadow-sm border-0 p-3 h-100 bg-white border-start border-success border-4">
              <small className="text-muted uppercase fw-semibold text-success">Completed Rides</small>
              <h3 className="fw-bold mt-2 mb-0 text-success">{reportData.completedTripsCount}</h3>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card shadow-sm border-0 p-3 h-100 bg-white border-start border-danger border-4">
              <small className="text-muted uppercase fw-semibold text-danger">Cancelled Trips</small>
              <h3 className="fw-bold mt-2 mb-0 text-danger">{reportData.cancelledTripsCount}</h3>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card shadow-sm border-0 p-3 h-100 bg-white border-start border-primary border-4">
              <small className="text-muted uppercase fw-semibold text-primary">Active Rides</small>
              <h3 className="fw-bold mt-2 mb-0 text-primary">{reportData.activeTripsCount}</h3>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 p-4 h-100 rounded-4 bg-white">
              <h6 className="fw-bold mb-4">Financial Summary</h6>
              <div className="row align-items-center h-100">
                <div className="col-md-7 text-center">
                  <svg width="100%" height="180" viewBox="0 0 280 180" className="mt-2">
                    <line x1="30" y1="20" x2="250" y2="20" stroke="#f0f0f0" strokeWidth="1" />
                    <line x1="30" y1="80" x2="250" y2="80" stroke="#f0f0f0" strokeWidth="1" />
                    <line x1="30" y1="140" x2="250" y2="140" stroke="#cccccc" strokeWidth="1.5" />
                    
                    <rect x="50" y={140 - revHeight} width="35" height={revHeight} rx="4" fill="#021D49" />
                    <rect x="120" y={140 - earnHeight} width="35" height={earnHeight} rx="4" fill="#0ABD67" />
                    <rect x="190" y={140 - commHeight} width="35" height={commHeight} rx="4" fill="#e07d0d" />
                    
                    <text x="67" y={140 - revHeight - 6} textAnchor="middle" fill="#021D49" className="fw-semibold" style={{ fontSize: '10px' }}>
                      Rs{financials.totalRevenue}
                    </text>
                    <text x="137" y={140 - earnHeight - 6} textAnchor="middle" fill="#0ABD67" className="fw-semibold" style={{ fontSize: '10px' }}>
                      Rs{financials.totalDriverEarnings}
                    </text>
                    <text x="207" y={140 - commHeight - 6} textAnchor="middle" fill="#e07d0d" className="fw-semibold" style={{ fontSize: '10px' }}>
                      Rs{financials.totalSystemCommission}
                    </text>

                    <text x="67" y="156" textAnchor="middle" fill="#777777" style={{ fontSize: '10px' }}>Revenue</text>
                    <text x="137" y="156" textAnchor="middle" fill="#777777" style={{ fontSize: '10px' }}>Payouts</text>
                    <text x="207" y="156" textAnchor="middle" fill="#777777" style={{ fontSize: '10px' }}>Commission</text>
                  </svg>
                </div>
                <div className="col-md-5">
                  <div className="card border-0 bg-light p-3 rounded-3">
                    <div className="mb-2">
                      <span className="small text-muted d-block">Gross Earnings</span>
                      <h5 className="fw-bold m-0 text-dark">Rs {financials.totalRevenue}</h5>
                    </div>
                    <div className="mb-2 border-top pt-2">
                      <span className="small text-muted d-block">Driver Share</span>
                      <h6 className="fw-bold text-success m-0">Rs {financials.totalDriverEarnings}</h6>
                    </div>
                    <div className="border-top pt-2">
                      <span className="small text-muted d-block">Platform Margin</span>
                      <h6 className="fw-bold text-warning m-0">Rs {financials.totalSystemCommission}</h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm border-0 p-4 h-100 rounded-4 bg-white">
              <h6 className="fw-bold mb-4">Trip Performance Breakdown</h6>
              <div className="row align-items-center h-100">
                <div className="col-6 text-center">
                  <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f0f0f0" strokeWidth="10" />
                    {donutSlices.map((slice, i) => (
                      slice.count > 0 && (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="10"
                          strokeDasharray={`${slice.strokeDash} 251.2`}
                          strokeDashoffset={slice.strokeOffset}
                        />
                      )
                    ))}
                  </svg>
                </div>
                <div className="col-6">
                  <div className="d-flex flex-column gap-2 small">
                    {donutSlices.map((status, i) => (
                      <div key={i} className="d-flex align-items-center justify-content-between">
                        <span className="d-flex align-items-center gap-2">
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: status.color }} />
                          <span className="text-muted fw-semibold">{status.name}</span>
                        </span>
                        <span className="fw-bold text-dark">{status.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4 bg-white">
          <div className="card-header bg-white border-0 pt-3 px-4">
            <h5 className="fw-bold m-0 text-dark">Detailed Trip Logs</h5>
          </div>
          <div className="card-body px-4 pb-4 text-dark">
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Route</th>
                    <th>Customer</th>
                    <th>Driver</th>
                    <th>Distance</th>
                    <th>Fare</th>
                    <th>Earning</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">No trips recorded for this date range</td>
                    </tr>
                  ) : (
                    trips.map(trip => (
                      <tr key={trip._id}>
                        <td>{fmtDate(trip.createdAt)}</td>
                        <td>
                          <span className="fw-semibold">{trip.pickupLocation}</span>
                          <i className="fa-solid fa-arrow-right mx-2 text-muted" />
                          <span className="fw-semibold">{trip.dropLocation}</span>
                        </td>
                        <td>
                          <div className="small text-dark">
                            <strong>{trip.customerName}</strong>
                            <div className="text-muted">{trip.customerPhone}</div>
                          </div>
                        </td>
                        <td>{trip.driverId?.name || 'Unassigned'}</td>
                        <td>{trip.distance} KM</td>
                        <td className="fw-bold text-dark">Rs {trip.fare}</td>
                        <td className="text-success">Rs {trip.driverEarning || 0}</td>
                        <td>
                          <span className={`status-badge-inline ${trip.status === 'COMPLETED' ? 'verified' : trip.status === 'CANCELLED' ? 'not-verified' : ''}`}>
                            {trip.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DriverEarnings() {
  const { alerts, showAlert, removeAlert } = useAlerts();
  const [data, setData] = useState({ todaysEarnings: 0, totalEarnings: 0, totalTripsCompleted: 0, breakdown: [] });
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadEarnings = async () => {
    setIsLoading(true);
    try {
      const res = await driverApi.getMyEarnings();
      if (res?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Failed to load earnings data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, []);

  return (
    <>
      <Toasts alerts={alerts} removeAlert={removeAlert} />
      <div className="container-fluid py-2 text-dark">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">My Earnings</h4>
            <p className="text-muted small">Track your income and completed rides</p>
          </div>
          <button className="btn btn-primary shadow-sm" onClick={loadEarnings} disabled={isLoading}>
            {isLoading ? <i className="fa-solid fa-arrows-rotate fa-spin me-2" /> : <i className="fa-solid fa-arrows-rotate me-2" />}
            Refresh
          </button>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-sm-4">
            <div className="card shadow-sm border-0 p-3 h-100 bg-dark text-white text-center">
              <small className="text-white-50 uppercase fw-semibold">Today's Earnings</small>
              <h2 className="fw-bold mt-2">Rs {data.todaysEarnings}</h2>
              <small className="text-white-50">Collected from completed trips</small>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="card shadow-sm border-0 p-3 h-100 bg-success text-white text-center">
              <small className="text-white-50 uppercase fw-semibold">Lifetime Earnings</small>
              <h2 className="fw-bold mt-2">Rs {data.totalEarnings}</h2>
              <small className="text-white-50">Net driver payout amount</small>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="card shadow-sm border-0 p-3 h-100 bg-white text-center text-dark">
              <small className="text-muted uppercase fw-semibold">Completed Rides</small>
              <h2 className="fw-bold mt-2 text-dark">{data.totalTripsCompleted}</h2>
              <small className="text-muted">Successful completions</small>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4 bg-white">
          <div className="card-header bg-white border-0 pt-3 px-4">
            <h5 className="fw-bold m-0">Earnings Log</h5>
          </div>
          <div className="card-body px-4 pb-4">
            <div className="d-none d-md-block table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Completion Date</th>
                    <th>Route</th>
                    <th>Distance</th>
                    <th>Total Customer Fare</th>
                    <th>My Net Earning</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.breakdown.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">No earnings records found</td>
                    </tr>
                  ) : (
                    data.breakdown.map((item, index) => (
                      <tr key={item.tripId || index}>
                        <td>{fmtDate(item.completedAt)}</td>
                        <td>
                          <span className="fw-semibold">{item.pickupLocation}</span>
                          <i className="fa-solid fa-arrow-right mx-2 text-muted" />
                          <span className="fw-semibold">{item.dropLocation}</span>
                        </td>
                        <td>{item.distance} KM</td>
                        <td>Rs {item.fare}</td>
                        <td className="fw-bold text-success">Rs {item.driverEarning}</td>
                        <td>
                          <button className="btn btn-sm btn-link text-primary p-0" onClick={() => setSelectedReceipt(item)}>
                            <i className="fa-solid fa-receipt me-1" /> View Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-md-none row g-3 text-dark">
              {data.breakdown.length === 0 ? (
                <div className="col-12 text-center text-muted py-4">No earnings records found</div>
              ) : (
                data.breakdown.map((item, index) => (
                  <div className="col-12" key={item.tripId || index}>
                    <div className="card border-0 bg-light p-3 rounded-3 shadow-sm text-dark">
                      <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                        <small className="text-muted">{fmtDate(item.completedAt, { dateStyle: 'short' })}</small>
                        <span className="badge bg-success text-white">Rs {item.driverEarning} Net</span>
                      </div>
                      <div className="mb-2">
                        <div className="small fw-semibold">{item.pickupLocation}</div>
                        <i className="fa-solid fa-arrow-down my-1 text-muted text-center d-block small" />
                        <div className="small fw-semibold">{item.dropLocation}</div>
                      </div>
                      <div className="d-flex justify-content-between text-muted small mt-2">
                        <span>Distance: {item.distance} KM</span>
                        <span>Fare: Rs {item.fare}</span>
                      </div>
                      <button className="btn btn-sm btn-outline-primary mt-3 w-100" onClick={() => setSelectedReceipt(item)}>
                        <i className="fa-solid fa-receipt me-1" /> View Receipt
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedReceipt && (
        <div className="confirm-overlay no-print-overlay text-dark">
          <div className="confirm-box p-4 invoice-print-box shadow-lg rounded-4 text-start">
            <div className="invoice-header d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
              <div>
                <h4 className="fw-bold mb-1">RAM TRANSPORT</h4>
                <p className="text-muted small m-0">Driver Earnings Receipt</p>
              </div>
              <div className="text-end">
                <span className="badge bg-success text-white p-2">COMPLETED</span>
                <p className="text-muted small mt-1 mb-0">ID: {selectedReceipt.tripId}</p>
              </div>
            </div>

            <div className="card border-0 bg-light p-3 mb-4 rounded-3 text-dark">
              <h6 className="fw-bold small mb-3 text-muted uppercase">Trip Route Details</h6>
              <div className="row g-2 small">
                <div className="col-12"><strong>Pickup:</strong> {selectedReceipt.pickupLocation}</div>
                <div className="col-12"><strong>Drop:</strong> {selectedReceipt.dropLocation}</div>
                <div className="col-12"><strong>Distance:</strong> {selectedReceipt.distance} KM</div>
                <div className="col-12"><strong>Completed:</strong> {fmtDate(selectedReceipt.completedAt)}</div>
              </div>
            </div>

            <div className="table-responsive text-dark">
              <table className="table table-sm table-borderless">
                <thead>
                  <tr className="border-bottom border-secondary-subtle">
                    <th>Description</th>
                    <th className="text-end">Fare Breakup</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Gross Customer Fare</td>
                    <td className="text-end">Rs {selectedReceipt.fare}</td>
                  </tr>
                  <tr>
                    <td>Platform Commission Deducted</td>
                    <td className="text-end text-danger">- Rs {Math.round((selectedReceipt.fare - selectedReceipt.driverEarning) * 100) / 100}</td>
                  </tr>
                  <tr className="border-top border-secondary-subtle fw-bold h5">
                    <td>My Net Earnings</td>
                    <td className="text-end text-success">Rs {selectedReceipt.driverEarning}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top no-print">
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedReceipt(null)}>Close</button>
              <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                <i className="fa-solid fa-print me-1" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AdminNotifications() {
  const { alerts, showAlert, removeAlert } = useAlerts();
  const [notifications, setNotifications] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState('ALL');
  const [recipientDriverId, setRecipientDriverId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [notifsRes, driversRes] = await Promise.all([
        adminApi.getNotifications(),
        adminApi.getAllDrivers()
      ]);
      if (notifsRes?.success) setNotifications(notifsRes.data || []);
      if (driversRes?.success) setDrivers(driversRes.data || []);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      showAlert('error', 'Please fill in title and description');
      return;
    }
    if (targetType === 'SELECTED' && !recipientDriverId) {
      showAlert('error', 'Please select a recipient driver');
      return;
    }
    setIsLoading(true);
    try {
      await adminApi.sendNotification({
        title,
        description,
        targetType,
        recipientDriverId: targetType === 'SELECTED' ? recipientDriverId : undefined
      });
      showAlert('success', 'Notification sent successfully');
      setTitle('');
      setDescription('');
      setRecipientDriverId('');
      await loadData();
    } catch (err) {
      showAlert('error', err?.error || 'Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toasts alerts={alerts} removeAlert={removeAlert} />
      <div className="container-fluid py-2 text-dark">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">Notifications Hub</h4>
            <p className="text-muted small">Broadcast announcements or alert specific drivers</p>
          </div>
          <button className="btn btn-primary shadow-sm" onClick={loadData} disabled={isLoading}>
            {isLoading ? <i className="fa-solid fa-arrows-rotate fa-spin me-2" /> : <i className="fa-solid fa-arrows-rotate me-2" />}
            Refresh List
          </button>
        </div>

        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card shadow-sm border-0 p-4 rounded-4 bg-white">
              <h5 className="fw-bold mb-3">Compose Announcement</h5>
              <form onSubmit={handleSend}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Title</label>
                  <input type="text" className="form-control" placeholder="Notification Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Description / Message</label>
                  <textarea className="form-control" rows="4" placeholder="Type your announcement details here..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Recipient Scope</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="scope" id="allDrivers" checked={targetType === 'ALL'} onChange={() => setTargetType('ALL')} />
                      <label className="form-check-label small" htmlFor="allDrivers">All Drivers</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="scope" id="selectedDriver" checked={targetType === 'SELECTED'} onChange={() => setTargetType('SELECTED')} />
                      <label className="form-check-label small" htmlFor="selectedDriver">Specific Driver</label>
                    </div>
                  </div>
                </div>

                {targetType === 'SELECTED' && (
                  <div className="mb-4">
                    <label className="form-label small fw-bold">Select Driver</label>
                    <select className="form-select" value={recipientDriverId} onChange={(e) => setRecipientDriverId(e.target.value)}>
                      <option value="" hidden>Select Recipient</option>
                      {drivers.map(d => (
                        <option key={d._id} value={d._id}>{d.name} ({d.vehicleNumber})</option>
                      ))}
                    </select>
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-100 shadow-sm mt-2" disabled={isLoading}>
                  <i className="fa-solid fa-paper-plane me-2" />
                  Broadcast Notification
                </button>
              </form>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card shadow-sm border-0 p-4 rounded-4 bg-white h-100 d-flex flex-column">
              <h5 className="fw-bold mb-3">Broadcast History</h5>
              <div className="flex-grow-1 overflow-auto pe-1" style={{ maxHeight: '420px' }}>
                {notifications.length === 0 ? (
                  <div className="text-center py-5 text-muted small">No announcements sent yet</div>
                ) : (
                  notifications.map(n => (
                    <div key={n._id} className="card border-0 bg-light p-3 mb-3 rounded-3 shadow-sm text-dark">
                      <div className="d-flex justify-content-between align-items-start mb-2 border-bottom pb-2">
                        <div>
                          <span className="badge bg-dark text-white me-2">
                            {n.targetType === 'ALL' ? 'To All' : `To: ${n.recipientDriverId?.name || 'Driver'}`}
                          </span>
                          <small className="text-muted">By {n.createdBy?.name || 'Admin'}</small>
                        </div>
                        <small className="text-muted">{fmtDate(n.createdAt)}</small>
                      </div>
                      <h6 className="fw-bold m-0 text-dark">{n.title}</h6>
                      <p className="small text-muted mt-2 mb-0" style={{ whiteSpace: 'pre-line' }}>{n.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DriverNotifications() {
  const { alerts, showAlert, removeAlert } = useAlerts();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await driverApi.getNotifications();
      if (res?.success) {
        setNotifications(res.data || []);
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <>
      <Toasts alerts={alerts} removeAlert={removeAlert} />
      <div className="container-fluid py-2 text-dark">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">Notifications</h4>
            <p className="text-muted small">Stay updated on system news and admin notices</p>
          </div>
          <button className="btn btn-primary shadow-sm" onClick={loadNotifications} disabled={isLoading}>
            {isLoading ? <i className="fa-solid fa-arrows-rotate fa-spin me-2" /> : <i className="fa-solid fa-arrows-rotate me-2" />}
            Refresh Inbox
          </button>
        </div>

        <div className="card shadow-sm border-0 p-4 rounded-4 bg-white">
          <div className="overflow-auto" style={{ maxHeight: '550px' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-5 text-muted small">
                <i className="fa-regular fa-bell-slash fs-1 d-block mb-3 opacity-30" />
                Your notification inbox is clean!
              </div>
            ) : (
              notifications.map(n => (
                <div key={n._id} className="card border-0 bg-light p-3 mb-3 rounded-3 shadow-sm text-dark border-start border-primary border-4">
                  <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                    <span className="badge bg-primary text-white">Notice</span>
                    <small className="text-muted">{fmtDate(n.createdAt)}</small>
                  </div>
                  <h6 className="fw-bold text-dark m-0">{n.title}</h6>
                  <p className="small text-muted mt-2 mb-0" style={{ whiteSpace: 'pre-line' }}>{n.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function AdminProfile() {
  const { alerts, showAlert, removeAlert } = useAlerts();
  const [profile, setProfile] = useState(null);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await auth.getMe();
      if (res?.success) setProfile(res.data);
    } catch (err) {
      showAlert('error', 'Failed to fetch profile details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passForm.currentPassword || !passForm.newPassword || !passForm.confirmPassword) {
      showAlert('error', 'Please fill in all password fields');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      showAlert('error', 'New passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await auth.updatePassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
        confirmPassword: passForm.confirmPassword
      });
      showAlert('success', 'Password updated successfully');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showAlert('error', err?.error || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return <div className="text-center py-5 text-muted small"><i className="fa-solid fa-spinner fa-spin fs-4 me-2" /> Loading profile...</div>;
  }

  return (
    <>
      <Toasts alerts={alerts} removeAlert={removeAlert} />
      <div className="container-fluid py-2 text-dark">
        <h4 className="fw-bold mb-1">My Profile</h4>
        <p className="text-muted small mb-4">View your details and update security configurations</p>

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 p-4 rounded-4 bg-white h-100 text-dark">
              <div className="text-center mb-4 border-bottom pb-4">
                <div className="avatar mx-auto mb-3" style={{ width: '80px', height: '80px', fontSize: '32px' }}>{profile.name?.charAt(0)}</div>
                <h5 className="fw-bold m-0">{profile.name}</h5>
                <span className="badge bg-dark text-white mt-2 uppercase">{profile.role}</span>
              </div>
              <div className="d-flex flex-column gap-3 small">
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted fw-semibold">Email Address</span>
                  <span className="fw-bold">{profile.email}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted fw-semibold">Phone Contact</span>
                  <span className="fw-bold">{profile.phone || '-'}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted fw-semibold">Office Address</span>
                  <span className="fw-bold">{profile.address || '-'}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted fw-semibold">Joined Date</span>
                  <span className="fw-bold">{fmtDate(profile.createdAt, { dateStyle: 'medium' })}</span>
                </div>
              </div>
              <div className="alert alert-info mt-4 mb-0 small border-0 text-dark bg-info-subtle">
                <i className="fa-solid fa-circle-info me-2" /> Profile information is managed by system settings.
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card shadow-sm border-0 p-4 rounded-4 bg-white h-100">
              <h5 className="fw-bold mb-4">Update Security Password</h5>
              <form onSubmit={handleUpdatePassword}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Current Password</label>
                  <input type="password" placeholder="••••••••" className="form-control" value={passForm.currentPassword} onChange={(e) => setPassForm(v => ({ ...v, currentPassword: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">New Password</label>
                  <input type="password" placeholder="••••••••" className="form-control" value={passForm.newPassword} onChange={(e) => setPassForm(v => ({ ...v, newPassword: e.target.value }))} />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold">Confirm New Password</label>
                  <input type="password" placeholder="••••••••" className="form-control" value={passForm.confirmPassword} onChange={(e) => setPassForm(v => ({ ...v, confirmPassword: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary w-100 shadow-sm" disabled={isLoading}>
                  Change Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DriverProfile() {
  const { alerts, showAlert, removeAlert } = useAlerts();
  const [profile, setProfile] = useState(null);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await auth.getMe();
      if (res?.success) setProfile(res.data);
    } catch (err) {
      showAlert('error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passForm.currentPassword || !passForm.newPassword || !passForm.confirmPassword) {
      showAlert('error', 'Please fill in all password fields');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      showAlert('error', 'Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await auth.updatePassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
        confirmPassword: passForm.confirmPassword
      });
      showAlert('success', 'Password updated successfully');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showAlert('error', err?.error || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedFields = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        experience: profile.experience,
        vehicleNumber: profile.vehicleNumber,
        emergencyContact: profile.emergencyContact,
        address: profile.address
      };
      await adminApi.updateDriver(profile._id, updatedFields);
      showAlert('success', 'Profile details updated successfully');
      setIsEditing(false);
      await loadProfile();
    } catch (err) {
      showAlert('error', err?.error || 'Failed to update profile details');
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return <div className="text-center py-5 text-muted small"><i className="fa-solid fa-spinner fa-spin fs-4 me-2" /> Loading profile...</div>;
  }

  return (
    <>
      <Toasts alerts={alerts} removeAlert={removeAlert} />
      <div className="container-fluid py-2 text-dark">
        <h4 className="fw-bold mb-1">My Driver Profile</h4>
        <p className="text-muted small mb-4">View your personal driver details and credentials</p>

        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 p-4 rounded-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h5 className="fw-bold m-0">Personal Profile Details</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? 'Cancel Edit' : 'Edit Details'}
                </button>
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Name</label>
                    <input type="text" className="form-control" disabled={!isEditing} value={profile.name || ''} onChange={(e) => setProfile(v => ({ ...v, name: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Email</label>
                    <input type="email" className="form-control" disabled={!isEditing} value={profile.email || ''} onChange={(e) => setProfile(v => ({ ...v, email: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Phone</label>
                    <input type="text" className="form-control" disabled={!isEditing} value={profile.phone || ''} onChange={(e) => setProfile(v => ({ ...v, phone: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Vehicle Number</label>
                    <input type="text" className="form-control" disabled={!isEditing} value={profile.vehicleNumber || ''} onChange={(e) => setProfile(v => ({ ...v, vehicleNumber: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Experience (Years)</label>
                    <input type="number" className="form-control" disabled={!isEditing} value={profile.experience || 0} onChange={(e) => setProfile(v => ({ ...v, experience: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Emergency Contact</label>
                    <input type="text" className="form-control" disabled={!isEditing} value={profile.emergencyContact || ''} onChange={(e) => setProfile(v => ({ ...v, emergencyContact: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">Home Address</label>
                    <textarea className="form-control" rows="3" disabled={!isEditing} value={profile.address || ''} onChange={(e) => setProfile(v => ({ ...v, address: e.target.value }))} />
                  </div>
                </div>

                {isEditing && (
                  <button type="submit" className="btn btn-primary shadow-sm w-100 mt-4" disabled={isLoading}>
                    Save Changes
                  </button>
                )}
              </form>

              {profile.license && (
                <div className="mt-4 pt-3 border-top">
                  <span className="small text-muted fw-bold d-block mb-2">Driver Credentials</span>
                  <a href={`https://transport-management-system-1-jbat.onrender.com/${profile.license}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-light border text-navy">
                    <i className="fa-solid fa-id-card me-2" /> View Uploaded License file
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm border-0 p-4 rounded-4 bg-white h-100">
              <h5 className="fw-bold mb-4">Security Credentials</h5>
              <form onSubmit={handleUpdatePassword}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Current Password</label>
                  <input type="password" placeholder="••••••••" className="form-control" value={passForm.currentPassword} onChange={(e) => setPassForm(v => ({ ...v, currentPassword: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">New Password</label>
                  <input type="password" placeholder="••••••••" className="form-control" value={passForm.newPassword} onChange={(e) => setPassForm(v => ({ ...v, newPassword: e.target.value }))} />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold">Confirm New Password</label>
                  <input type="password" placeholder="••••••••" className="form-control" value={passForm.confirmPassword} onChange={(e) => setPassForm(v => ({ ...v, confirmPassword: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary w-100 shadow-sm" disabled={isLoading}>
                  Change Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MyTrips() {
  const [trips, setTrips] = useState([]);
  const load = () => driverApi.getMyTrips().then((res) => setTrips(res.data || [])).catch(console.error);
  useEffect(() => { load(); }, []);
  const action = async (type, id) => { const map = { accept: driverApi.acceptTrip, cancel: driverApi.cancelTrip, start: driverApi.startTrip, complete: driverApi.completeTrip }; await map[type](id); await load(); };
  return <div className="container-fluid py-4"><div className="row g-4">{trips.map((trip) => <div className="col-md-6 col-lg-4" key={trip._id}><div className="trip-card driver-trip"><div className="trip-header"><div><h5>{trip.customerName}</h5><span>{trip.status}</span></div><div className={`trip-status ${trip.status === 'COMPLETED' ? 'completed' : 'pending'}`}>{trip.status}</div></div><div className="trip-route"><div><small>Pickup</small><p>{trip.pickupLocation}</p></div><div className="route-icon">-&gt;</div><div><small>Drop</small><p>{trip.dropLocation}</p></div></div><div className="trip-details"><div className="detail-box"><label>Distance</label><h6>{trip.distance} KM</h6></div><div className="detail-box"><label>Fare</label><h6>Rs {trip.fare}</h6></div><div className="detail-box earning"><label>Earning</label><h6>Rs {trip.driverEarning}</h6></div></div><div className="trip-footer"><div className="trip-time"><small>Started</small><p>{fmtDate(trip.startTime)}</p></div><div className="trip-time"><small>Ended</small><p>{fmtDate(trip.endTime)}</p></div></div><div className="trip-actions">{trip.status === 'ASSIGNED' && <button className="accept-btn" onClick={() => action('accept', trip._id)}>Accept Trip</button>}{trip.status === 'ACCEPTED' && <button className="start-btn" onClick={() => action('start', trip._id)}>Start Trip</button>}{trip.status === 'STARTED' && <button className="complete-btn" onClick={() => action('complete', trip._id)}>Complete Trip</button>}{trip.status !== 'COMPLETED' && trip.status !== 'EN_ROUTE' && <button className="cancel-btn" onClick={() => action('cancel', trip._id)}>Cancel</button>}{trip.status === 'COMPLETED' && <button className="done-btn">Trip Completed</button>}</div></div></div>)}</div></div>;
}

export default function App() {
  useEffect(() => { listenForMessages(); }, []);
  return <Routes><Route path="/" element={<Login />} /><Route path="/admin/*" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>} /><Route path="/driver/*" element={<ProtectedRoute><DriverLayout /></ProtectedRoute>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}

