import React, { useEffect, useState } from 'react';
import axios from '../API/axiosInstance';
import {
  Calendar, CheckCircle, XCircle, Download,
  ArrowLeft, Loader2, Clock, User, X
} from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminHistory = () => {
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
  const [cancellingId, setCancellingId] = useState(null);

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
        const [bookingRes, activityRes] = await Promise.allSettled([
          axios.get('/bookings/my-history'),
          axios.get('/admin/history'),
        ]);

        if (bookingRes.status === 'fulfilled') {
          const d = bookingRes.value.data;
          if (Array.isArray(d))               setBookings(d);
          else if (Array.isArray(d?.bookings)) setBookings(d.bookings);
          else if (Array.isArray(d?.data))     setBookings(d.data);
          else                                 setBookings([]);
        } else {
          console.warn('Booking history error:', bookingRes.reason?.message);
          setBookings([]);
        }

        if (activityRes.status === 'fulfilled') {
          const d = activityRes.value.data;
          if (Array.isArray(d))             setActivityLogs(d);
          else if (Array.isArray(d?.logs))  setActivityLogs(d.logs);
          else if (Array.isArray(d?.data))  setActivityLogs(d.data);
          else                              setActivityLogs([]);
        } else {
          console.warn('Activity log error:', activityRes.reason?.message);
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

  const handleDownloadReceipt = async (bookingId) => {
    try {
      const response = await axios.get(`/bookings/download/${bookingId}`, {
        responseType: 'blob',
      });
      const url  = window.URL.createObjectURL(new Blob([response.data]));
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

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm(
      'Cancel this booking?\n\nThis action cannot be undone. Any applicable refund will be processed per our cancellation policy.'
    );
    if (!confirmed) return;
    setCancellingId(bookingId);
    try {
      await axios.patch(`/bookings/update/${bookingId}`, { paymentStatus: 'Cancelled' });
      toast.success('Booking cancelled successfully.');
      setBookings(prev =>
        prev.map(b => b._id === bookingId ? { ...b, paymentStatus: 'Cancelled' } : b)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const fmt = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const fmtTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-20 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-bold text-slate-600">Loading History...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 mx-auto px-4 py-6 sm:py-8">

      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition font-bold text-sm bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm"
          >
            <ArrowLeft size={16} /> Back to Search
          </button>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-5 sm:p-8 md:p-10">

          <header className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 tracking-tight">Booking History</h2>
            <p className="text-slate-500 font-medium text-sm sm:text-base mb-5 sm:mb-6">
              Review and manage all transaction and activity logs.
            </p>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-full sm:w-fit overflow-x-auto">
              {[
                { key: 'bookings', label: 'All Bookings',   count: bookings.length,     badgeColor: 'bg-blue-100 text-blue-600' },
                { key: 'activity', label: 'Activity Logs', count: activityLogs.length, badgeColor: 'bg-purple-100 text-purple-600' },
              ].map(({ key, label, count, badgeColor }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
                    activeTab === key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                  <span className={`ml-2 text-xs font-black px-2 py-0.5 rounded-full ${badgeColor}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </header>

          {/* ALL BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <EmptyState message="No bookings found." sub="Completed bookings will appear here." />
              ) : (
                bookings.map((log) => {
                  const isCancelled      = log.paymentStatus === 'Cancelled';
                  const isPending        = log.paymentStatus !== 'Completed' && log.paymentStatus !== 'Cancelled';
                  const canCancel        = !isCancelled && log.paymentStatus === 'Completed';
                  const isThisCancelling = cancellingId === log._id;

                  return (
                    <div
                      key={log._id}
                      className="group flex flex-col p-4 sm:p-6 border border-slate-100 rounded-2xl sm:rounded-3xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 gap-4"
                    >
                      {/* Top row: icon + info */}
                      <div className="flex items-start space-x-4">
                        <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shrink-0">
                          <Calendar size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-slate-900 text-base">
                            {log.bookingReference || `#${log._id?.slice(-6).toUpperCase()}`}
                          </h4>
                          {log.passengerDetails?.name && (
                            <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                              <User size={11} /> {log.passengerDetails.name}
                            </p>
                          )}
                          {log.passengerDetails?.email && (
                            <p className="text-xs font-semibold text-slate-400 mt-0.5 break-all">
                              {log.passengerDetails.email}
                            </p>
                          )}
                          {log.flight && (
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">
                              {log.flight.airline}
                              {log.flight.departureLocation && log.flight.arrivalLocation
                                ? ` · ${log.flight.departureLocation} → ${log.flight.arrivalLocation}`
                                : ''}
                            </p>
                          )}
                          <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            {fmt(log.createdAt || log.timestamp)}
                          </p>
                        </div>
                      </div>

                      {/* Bottom row: price + status + actions */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pl-0 sm:pl-16">
                        {log.flight?.price && (
                          <span className="text-base font-black text-slate-800">
                            ₹{log.flight.price.toLocaleString('en-IN')}
                          </span>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={log.paymentStatus} />

                          {canCancel && (
                            <button
                              onClick={() => handleCancelBooking(log._id)}
                              disabled={isThisCancelling}
                              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl sm:rounded-2xl text-xs font-black hover:bg-red-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                            >
                              {isThisCancelling
                                ? <Loader2 size={12} className="animate-spin" />
                                : <X size={12} />
                              }
                              {isThisCancelling ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}

                          {isPending && (
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl sm:rounded-2xl">
                              Payment Pending
                            </span>
                          )}

                          <button
                            onClick={() => handleDownloadReceipt(log._id)}
                            className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-3 bg-slate-900 text-white rounded-xl sm:rounded-2xl text-xs font-black hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
                          >
                            <Download size={13} />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ACTIVITY LOGS TAB */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {activityLogs.length === 0 ? (
                <EmptyState message="No activity logs found." sub="New activity will appear here automatically." />
              ) : (
                activityLogs.map((log, idx) => (
                  <div
                    key={log._id || idx}
                    className="group flex flex-col p-4 sm:p-6 border border-slate-100 rounded-2xl sm:rounded-3xl hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 gap-3"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shrink-0">
                        <Clock size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-900 text-base capitalize">
                          {log.action || 'Action'}
                        </h4>
                        {log.userId?.name && (
                          <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                            <User size={11} /> {log.userId.name}
                            {log.userId.email ? ` · ${log.userId.email}` : ''}
                          </p>
                        )}
                        {log.details && (
                          <p className="text-xs font-semibold text-slate-400 mt-0.5">
                            {[
                              log.details.passengerName && `Passenger: ${log.details.passengerName}`,
                              log.details.flightNumber  && `Flight: ${log.details.flightNumber}`,
                              log.details.status        && `Status: ${log.details.status}`,
                            ].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        <p className="text-xs font-bold text-slate-400 mt-0.5">
                          Booking: #{log.bookingId?.toString().slice(-6).toUpperCase() || 'N/A'}
                        </p>
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          {fmt(log.timestamp)}
                          {fmtTime(log.timestamp) ? ` · ${fmtTime(log.timestamp)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pl-0 sm:pl-16">
                      <ActionBadge action={log.action} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Sub-components ── */

const StatusBadge = ({ status }) => {
  if (status === 'Completed') {
    return (
      <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-green-100">
        <CheckCircle size={13} className="fill-green-600 text-white" />
        <span className="text-xs font-black uppercase tracking-tight">Paid</span>
      </div>
    );
  }
  if (status === 'Cancelled') {
    return (
      <div className="flex items-center gap-1.5 bg-red-50 text-red-500 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-red-100">
        <XCircle size={13} className="fill-red-500 text-white" />
        <span className="text-xs font-black uppercase tracking-tight">Cancelled</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-amber-100">
      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
      <span className="text-xs font-black uppercase tracking-tight">{status || 'Pending'}</span>
    </div>
  );
};

const ACTION_STYLES = {
  Cancelled: 'bg-red-50 text-red-600 border-red-100',
  Created:   'bg-green-50 text-green-600 border-green-100',
  Booked:    'bg-green-50 text-green-600 border-green-100',
  Updated:   'bg-yellow-50 text-yellow-600 border-yellow-100',
};

const ActionBadge = ({ action }) => {
  const style = ACTION_STYLES[action] || 'bg-slate-50 text-slate-600 border-slate-100';
  return (
    <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border text-xs font-black uppercase tracking-tight ${style}`}>
      {action || 'Action'}
    </span>
  );
};

const EmptyState = ({ message, sub }) => (
  <div className="p-10 sm:p-20 text-center border-2 border-dashed border-slate-100 rounded-2xl sm:rounded-[2rem] text-slate-400 bg-slate-50/50">
    <Calendar className="mx-auto mb-4 opacity-20" size={48} />
    <p className="font-bold text-lg">{message}</p>
    <p className="text-sm">{sub}</p>
  </div>
);

export default AdminHistory;