import React, { useEffect, useState } from 'react';
import axios from '../API/axiosInstance';
import {
  Calendar, CheckCircle, XCircle, Download,
  ArrowLeft, Loader2, BarChart3, Clock, User
} from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminHistory = () => {
  const { isAuthenticated } = useOutletContext();
  const [bookings, setBookings] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view history');
      navigate('/login');
      return;
    }

    const fetchAllHistory = async () => {
      try {
        // Fetch both endpoints in parallel
        const [adminRes, userRes] = await Promise.allSettled([
          axios.get('/auth/admin/history'),
          axios.get('/auth/bookings/my-history')
        ]);

        // Admin history (all bookings)
        if (adminRes.status === 'fulfilled') {
          const data = adminRes.value.data;
          setBookings(Array.isArray(data) ? data : []);
        } else {
          console.warn('Admin history fetch failed:', adminRes.reason);
        }

        // User activity logs (my-history)
        if (userRes.status === 'fulfilled') {
          const data = userRes.value.data;
          setActivityLogs(Array.isArray(data) ? data : []);
        } else {
          console.warn('User history fetch failed:', userRes.reason);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Could not load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllHistory();
  }, [isAuthenticated, navigate]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });

  const totalBookings   = bookings.length;
  const confirmedCount  = bookings.filter(b => b.paymentStatus === 'Completed').length;
  const activityCount   = activityLogs.length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-bold text-slate-600">Loading History...</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">

      {/* Back Button */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all font-bold text-sm bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm"
        >
          <ArrowLeft size={16} /> Back to Search
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-3">
            <BarChart3 size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Total Bookings</span>
          </div>
          <p className="text-4xl font-black text-slate-900">{totalBookings}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-green-600 mb-3">
            <CheckCircle size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Confirmed</span>
          </div>
          <p className="text-4xl font-black text-slate-900">{confirmedCount}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-purple-600 mb-3">
            <Clock size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Activity Logs</span>
          </div>
          <p className="text-4xl font-black text-slate-900">{activityCount}</p>
        </div>
      </div>

      {/* Single Combined Card */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 md:p-10">

        {/* Header + Tabs */}
        <header className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Booking History</h2>
          <p className="text-slate-500 font-medium mb-6">Review and manage all transaction and activity logs.</p>

          {/* Tab Switcher */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === 'bookings'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All Bookings
              <span className="ml-2 bg-blue-100 text-blue-600 text-xs font-black px-2 py-0.5 rounded-full">
                {totalBookings}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === 'activity'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Activity Logs
              <span className="ml-2 bg-purple-100 text-purple-600 text-xs font-black px-2 py-0.5 rounded-full">
                {activityCount}
              </span>
            </button>
          </div>
        </header>

        {/* ── TAB: ALL BOOKINGS ── */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <EmptyState message="No bookings found." sub="Completed bookings will appear here." />
            ) : (
              bookings.map((log) => (
                <div
                  key={log._id}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-6 border border-slate-100 rounded-3xl bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 gap-4"
                >
                  {/* Left: icon + info */}
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
                        {formatDate(log.createdAt || log.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Right: status + amount + receipt */}
                  <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6">
                    {log.flight?.price && (
                      <span className="text-base font-black text-slate-800">
                        ₹{log.flight.price.toLocaleString('en-IN')}
                      </span>
                    )}

                    <StatusBadge status={log.paymentStatus} />

                    <button
                      onClick={() => toast.success('Preparing PDF receipt...')}
                      className="flex items-center space-x-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                      <Download size={13} />
                      <span className="hidden sm:inline">Receipt</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TAB: ACTIVITY LOGS ── */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            {activityLogs.length === 0 ? (
              <EmptyState message="No activity logs found." sub="New activity will appear here automatically." />
            ) : (
              activityLogs.map((log) => (
                <div
                  key={log._id}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-6 border border-slate-100 rounded-3xl bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 gap-4"
                >
                  {/* Left */}
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
                          {Object.entries(log.details)
                            .slice(0, 2)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </p>
                      )}
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        {formatDate(log.timestamp)} · {formatTime(log.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Right: action badge */}
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

// ── Sub-components ─────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  if (status === 'Completed') {
    return (
      <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-2xl border border-green-100">
        <CheckCircle size={13} className="fill-green-600 text-white" />
        <span className="text-xs font-black uppercase tracking-tight">Paid</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2 rounded-2xl border border-red-100">
      <XCircle size={13} className="fill-red-500 text-white" />
      <span className="text-xs font-black uppercase tracking-tight">{status || 'Pending'}</span>
    </div>
  );
};

const ActionBadge = ({ action }) => {
  const config = {
    Cancelled: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
    Booked:    { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
    Updated:   { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
  };
  const style = config[action] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' };

  return (
    <span className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-tight ${style.bg} ${style.text} ${style.border}`}>
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