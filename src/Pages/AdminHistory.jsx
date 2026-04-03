import React, { useEffect, useState } from 'react';
import axios from '../API/axiosInstance';
import {
  Calendar, CheckCircle, XCircle, Download,
  ArrowLeft, Loader2, BarChart3, Clock, User
} from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminHistory = () => {
  // useOutletContext may not always be available; fall back gracefully
  let isAuthenticated = true;
  try {
    const ctx = useOutletContext();
    if (ctx && typeof ctx.isAuthenticated !== 'undefined') {
      isAuthenticated = ctx.isAuthenticated;
    }
  } catch {
    // not inside an Outlet — treat as authenticated
  }

  const navigate = useNavigate();

  const [bookings, setBookings]         = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('bookings');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!isAuthenticated && !token) {
      toast.error('Please login to view history');
      navigate('/login');
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        // Run both in parallel; if one fails the other still loads
        const [adminRes, userRes] = await Promise.allSettled([
          // All bookings endpoint
          axios.get('/auth/admin/history'),
          // User activity logs endpoint
          axios.get('/auth/bookings/my-history')
        ]);

        if (adminRes.status === 'fulfilled') {
          const data = adminRes.value.data;
          // Handle both array responses and nested { bookings: [] } responses
          if (Array.isArray(data)) {
            setBookings(data);
          } else if (Array.isArray(data?.bookings)) {
            setBookings(data.bookings);
          } else if (Array.isArray(data?.data)) {
            setBookings(data.data);
          } else {
            setBookings([]);
          }
        } else {
          console.warn('Admin history error:', adminRes.reason?.response?.data || adminRes.reason?.message);
          // Fallback: try fetching user's own bookings
          try {
            const fallback = await axios.get('/bookings/my-bookings');
            const d = fallback.data;
            setBookings(Array.isArray(d) ? d : Array.isArray(d?.bookings) ? d.bookings : []);
          } catch {
            setBookings([]);
          }
        }

        if (userRes.status === 'fulfilled') {
          const data = userRes.value.data;
          if (Array.isArray(data)) {
            setActivityLogs(data);
          } else if (Array.isArray(data?.logs)) {
            setActivityLogs(data.logs);
          } else if (Array.isArray(data?.data)) {
            setActivityLogs(data.data);
          } else {
            setActivityLogs([]);
          }
        } else {
          console.warn('User history error:', userRes.reason?.response?.data || userRes.reason?.message);
          setActivityLogs([]);
        }
      } catch (err) {
        console.error('Unexpected fetch error:', err);
        toast.error('Could not load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isAuthenticated, navigate]);

  // ── Download PDF receipt ──
  const handleDownloadReceipt = async (bookingId) => {
    try {
      const token = localStorage.getItem('userToken');
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/bookings/download/${bookingId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `receipt-${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded!');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Could not download receipt.');
    }
  };

  /* ── helpers ── */
  const fmt = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const fmtTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const totalBookings  = bookings.length;
  const confirmedCount = bookings.filter(b => b.paymentStatus === 'Completed').length;
  const activityCount  = activityLogs.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-bold text-slate-600">Loading History…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">

      {/* Back button */}
      <div className="mb-8">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition font-bold text-sm bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
          <ArrowLeft size={16} /> Back to Search
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={<BarChart3 size={20} />} color="text-blue-600"   label="Total Bookings"  value={totalBookings} />
        <StatCard icon={<CheckCircle size={20} />} color="text-green-600" label="Confirmed"       value={confirmedCount} />
        <StatCard icon={<Clock size={20} />}       color="text-purple-600" label="Activity Logs"  value={activityCount} />
      </div>

      {/* Main card */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 md:p-10">

        <header className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Booking History</h2>
          <p className="text-slate-500 font-medium mb-6">Review and manage all transaction and activity logs.</p>

          {/* Tabs */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
            {[
              { key: 'bookings', label: 'All Bookings',  count: totalBookings, badgeColor: 'bg-blue-100 text-blue-600' },
              { key: 'activity', label: 'Activity Logs', count: activityCount, badgeColor: 'bg-purple-100 text-purple-600' }
            ].map(({ key, label, count, badgeColor }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {label}
                <span className={`ml-2 text-xs font-black px-2 py-0.5 rounded-full ${badgeColor}`}>{count}</span>
              </button>
            ))}
          </div>
        </header>

        {/* ── ALL BOOKINGS TAB ── */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <EmptyState message="No bookings found." sub="Completed bookings will appear here." />
            ) : (
              bookings.map(log => (
                <div key={log._id}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-6 border border-slate-100 rounded-3xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 gap-4">

                  <div className="flex items-center space-x-5">
                    <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <Calendar size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">
                        {log.bookingReference || `#${log._id?.slice(-6).toUpperCase()}`}
                      </h4>
                      {log.passengerDetails?.name && (
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                          <User size={11} /> {log.passengerDetails.name}
                        </p>
                      )}
                      {log.flight && (
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                          {log.flight.airline} · {log.flight.departureLocation} → {log.flight.arrivalLocation}
                        </p>
                      )}
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        {fmt(log.createdAt || log.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6">
                    {log.flight?.price && (
                      <span className="text-base font-black text-slate-800">
                        ₹{log.flight.price.toLocaleString('en-IN')}
                      </span>
                    )}
                    <StatusBadge status={log.paymentStatus} />
                    <button
                      onClick={() => handleDownloadReceipt(log._id)}
                      className="flex items-center space-x-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-200">
                      <Download size={13} />
                      <span className="hidden sm:inline">Receipt</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ACTIVITY LOGS TAB ── */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            {activityLogs.length === 0 ? (
              <EmptyState message="No activity logs found." sub="New activity will appear here automatically." />
            ) : (
              activityLogs.map((log, idx) => (
                <div key={log._id || idx}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-6 border border-slate-100 rounded-3xl hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 gap-4">

                  <div className="flex items-center space-x-5">
                    <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                      <Clock size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base capitalize">
                        {log.action || 'Action'}
                      </h4>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">
                        Booking: #{log.bookingId?.toString().slice(-6).toUpperCase() || 'N/A'}
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                          {Object.entries(log.details).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      )}
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        {fmt(log.timestamp)} {fmtTime(log.timestamp) ? `· ${fmtTime(log.timestamp)}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <ActionBadge action={log.action} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Sub-components ─────────────────────────────────────────────────────────── */

const StatCard = ({ icon, color, label, value }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
    <div className={`flex items-center gap-3 ${color} mb-3`}>
      {icon}
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-4xl font-black text-slate-900">{value}</p>
  </div>
);

const StatusBadge = ({ status }) =>
  status === 'Completed' ? (
    <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-2xl border border-green-100">
      <CheckCircle size={13} className="fill-green-600 text-white" />
      <span className="text-xs font-black uppercase tracking-tight">Paid</span>
    </div>
  ) : (
    <div className="flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2 rounded-2xl border border-red-100">
      <XCircle size={13} className="fill-red-500 text-white" />
      <span className="text-xs font-black uppercase tracking-tight">{status || 'Pending'}</span>
    </div>
  );

const ACTION_STYLES = {
  Cancelled: 'bg-red-50 text-red-600 border-red-100',
  Created:   'bg-green-50 text-green-600 border-green-100',
  Booked:    'bg-green-50 text-green-600 border-green-100',
  Updated:   'bg-yellow-50 text-yellow-600 border-yellow-100',
};

const ActionBadge = ({ action }) => {
  const style = ACTION_STYLES[action] || 'bg-slate-50 text-slate-600 border-slate-100';
  return (
    <span className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-tight ${style}`}>
      {action || 'Action'}
    </span>
  );
};

const EmptyState = ({ message, sub }) => (
  <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-400 bg-slate-50/50">
    <Calendar className="mx-auto mb-4 opacity-20" size={48} />
    <p className="font-bold text-lg">{message}</p>
    <p className="text-sm">{sub}</p>
  </div>
);

export default AdminHistory;