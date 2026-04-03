import React, { useEffect, useState } from 'react';
import axios from '../API/axiosInstance';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, BarChart3, TrendingUp,
  CheckCircle, XCircle, Clock, Plane, Users, IndianRupee
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────────────────────
   AnalyticsDashboard
   Route suggestion: /analytics  (add to your App.jsx / router)
   Shows: total bookings, revenue, cancellation rate, popular routes,
          booking status breakdown, bookings-per-day bar chart.
   All data derived from /bookings/my-history + /admin/history endpoints
   which you already have — no new backend routes needed.
───────────────────────────────────────────────────────────────────────────── */

const AnalyticsDashboard = () => {
  const navigate = useNavigate();

  const [bookings, setBookings]         = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); return; }

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [bookingRes, activityRes] = await Promise.allSettled([
          axios.get('/bookings/my-history'),
          axios.get('/admin/history'),
        ]);

        if (bookingRes.status === 'fulfilled') {
          const d = bookingRes.value.data;
          setBookings(Array.isArray(d) ? d : Array.isArray(d?.bookings) ? d.bookings : []);
        } else {
          setBookings([]);
        }

        if (activityRes.status === 'fulfilled') {
          const d = activityRes.value.data;
          setActivityLogs(Array.isArray(d) ? d : Array.isArray(d?.logs) ? d.logs : []);
        } else {
          setActivityLogs([]);
        }
      } catch {
        toast.error('Could not load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [navigate]);

  /* ── Derived metrics ── */
  const total      = bookings.length;
  const paid       = bookings.filter(b => b.paymentStatus === 'Completed').length;
  const cancelled  = bookings.filter(b => b.paymentStatus === 'Cancelled').length;
  const pending    = bookings.filter(b => b.paymentStatus !== 'Completed' && b.paymentStatus !== 'Cancelled').length;

  const totalRevenue = bookings
    .filter(b => b.paymentStatus === 'Completed')
    .reduce((sum, b) => sum + (b.flight?.price || 0), 0);

  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  /* ── Popular routes ── */
  const routeMap = {};
  bookings.forEach(b => {
    if (b.flight?.departureLocation && b.flight?.arrivalLocation) {
      const key = `${b.flight.departureLocation} → ${b.flight.arrivalLocation}`;
      routeMap[key] = (routeMap[key] || 0) + 1;
    }
  });
  const popularRoutes = Object.entries(routeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  /* ── Bookings per day (last 7 days) ── */
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
  });

  const bookingsPerDay = last7.map(dateStr => {
    const count = bookings.filter(b => {
      if (!b.createdAt && !b.timestamp) return false;
      const d = new Date(b.createdAt || b.timestamp)
        .toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
      return d === dateStr;
    }).length;
    return { date: dateStr, count };
  });

  const maxDay = Math.max(...bookingsPerDay.map(d => d.count), 1);

  /* ── Activity action breakdown ── */
  const actionMap = {};
  activityLogs.forEach(l => {
    const key = l.action || 'Unknown';
    actionMap[key] = (actionMap[key] || 0) + 1;
  });
  const actionBreakdown = Object.entries(actionMap).sort((a, b) => b[1] - a[1]);

  /* ── Airline breakdown ── */
  const airlineMap = {};
  bookings.forEach(b => {
    const key = b.flight?.airline || 'Unknown';
    airlineMap[key] = (airlineMap[key] || 0) + 1;
  });
  const airlineBreakdown = Object.entries(airlineMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const fmt = (n) => n.toLocaleString('en-IN');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-bold text-slate-600">Loading Analytics...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">

      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition font-bold text-sm bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm"
        >
          <ArrowLeft size={16} /> Back to Search
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics & Reports</h1>
        <p className="text-slate-500 font-medium mt-1">Booking trends, revenue, and activity insights.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          icon={<BarChart3 size={18} />}
          color="text-blue-600 bg-blue-50"
          label="Total Bookings"
          value={total}
        />
        <StatCard
          icon={<IndianRupee size={18} />}
          color="text-green-600 bg-green-50"
          label="Revenue"
          value={`₹${totalRevenue >= 100000 ? (totalRevenue / 100000).toFixed(1) + 'L' : fmt(totalRevenue)}`}
        />
        <StatCard
          icon={<CheckCircle size={18} />}
          color="text-emerald-600 bg-emerald-50"
          label="Confirmed"
          value={paid}
        />
        <StatCard
          icon={<XCircle size={18} />}
          color="text-red-600 bg-red-50"
          label="Cancelled"
          value={cancelled}
        />
        <StatCard
          icon={<Clock size={18} />}
          color="text-amber-600 bg-amber-50"
          label="Pending"
          value={pending}
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          color="text-purple-600 bg-purple-50"
          label="Cancel Rate"
          value={`${cancellationRate}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Bookings per Day — Bar Chart */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-900 mb-1">Bookings — Last 7 Days</h2>
          <p className="text-xs text-slate-400 font-semibold mb-6">Daily booking volume</p>

          {bookingsPerDay.every(d => d.count === 0) ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-300">
              <BarChart3 size={40} className="mb-2 opacity-40" />
              <p className="text-sm font-semibold">No bookings in the last 7 days</p>
            </div>
          ) : (
            <div className="flex items-end gap-2 h-44">
              {bookingsPerDay.map(({ date, count }) => {
                const heightPct = Math.round((count / maxDay) * 100);
                const label = new Date(date + 'T00:00:00')
                  .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                return (
                  <div key={date} className="flex flex-col items-center gap-1 flex-1">
                    {count > 0 && (
                      <span className="text-xs font-black text-blue-600">{count}</span>
                    )}
                    <div className="w-full rounded-t-lg bg-blue-100 flex items-end" style={{ height: '140px' }}>
                      <div
                        className="w-full rounded-t-lg bg-blue-600 transition-all duration-500"
                        style={{ height: `${heightPct}%`, minHeight: count > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-400 text-center leading-tight">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking Status Donut */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-900 mb-1">Booking Status</h2>
          <p className="text-xs text-slate-400 font-semibold mb-6">Distribution of all booking statuses</p>

          {total === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-300">
              <Users size={40} className="mb-2 opacity-40" />
              <p className="text-sm font-semibold">No booking data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Confirmed (Paid)', count: paid,      color: 'bg-green-500',  textColor: 'text-green-700' },
                { label: 'Cancelled',        count: cancelled, color: 'bg-red-500',    textColor: 'text-red-700' },
                { label: 'Pending Payment',  count: pending,   color: 'bg-amber-400',  textColor: 'text-amber-700' },
              ].map(({ label, count, color, textColor }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-slate-600">{label}</span>
                      <span className={`text-sm font-black ${textColor}`}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${color} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                {[
                  { label: 'Paid',      count: paid,      color: 'text-green-600' },
                  { label: 'Cancelled', count: cancelled, color: 'text-red-600' },
                  { label: 'Pending',   count: pending,   color: 'text-amber-600' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="text-center">
                    <p className={`text-2xl font-black ${color}`}>{count}</p>
                    <p className="text-xs font-semibold text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Popular Routes */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-900 mb-1">Popular Routes</h2>
          <p className="text-xs text-slate-400 font-semibold mb-6">Most booked flight routes</p>

          {popularRoutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-300">
              <Plane size={36} className="mb-2 opacity-40" />
              <p className="text-sm font-semibold">No route data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {popularRoutes.map(([route, count], idx) => {
                const maxRoute = popularRoutes[0][1];
                const pct = Math.round((count / maxRoute) * 100);
                return (
                  <div key={route} className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400 w-5 text-right">{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                          <Plane size={12} className="text-blue-400" />
                          {route}
                        </span>
                        <span className="text-xs font-black text-blue-600">
                          {count} booking{count > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Airline Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-900 mb-1">Bookings by Airline</h2>
          <p className="text-xs text-slate-400 font-semibold mb-6">Which airlines are most booked</p>

          {airlineBreakdown.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-300">
              <Plane size={36} className="mb-2 opacity-40" />
              <p className="text-sm font-semibold">No airline data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {airlineBreakdown.map(([airline, count]) => {
                const maxAirline = airlineBreakdown[0][1];
                const pct = Math.round((count / maxAirline) * 100);
                return (
                  <div key={airline}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-slate-700">{airline}</span>
                      <span className="text-xs font-black text-purple-600">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-purple-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Activity Log Action Breakdown */}
      {activityLogs.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-900 mb-1">Activity Log Summary</h2>
          <p className="text-xs text-slate-400 font-semibold mb-6">Breakdown of all user actions</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actionBreakdown.map(([action, count]) => {
              const style = ACTION_CARD_STYLES[action] || {
                bg: 'bg-slate-50',
                text: 'text-slate-700',
                badge: 'text-slate-600',
              };
              return (
                <div key={action} className={`${style.bg} rounded-2xl p-4 text-center border border-slate-100`}>
                  <p className={`text-3xl font-black ${style.badge}`}>{count}</p>
                  <p className={`text-xs font-black uppercase tracking-wider mt-1 ${style.text}`}>
                    {action}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Revenue Summary */}
      <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black mb-1">Total Revenue Generated</h2>
            <p className="text-blue-200 text-sm font-semibold">
              From {paid} confirmed booking{paid !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black">₹{fmt(totalRevenue)}</p>
            <p className="text-blue-200 text-xs font-semibold mt-1">
              Avg. ₹{paid > 0 ? fmt(Math.round(totalRevenue / paid)) : 0} per booking
            </p>
          </div>
        </div>

        {/* Mini sparkline bars */}
        {total > 0 && (
          <div className="mt-6 flex items-end gap-1 h-12">
            {bookingsPerDay.map(({ date, count }) => (
              <div
                key={date}
                className="flex-1 bg-white rounded-sm opacity-30 transition-all duration-500"
                style={{
                  height: `${Math.round((count / maxDay) * 100)}%`,
                  minHeight: count > 0 ? '4px' : '2px',
                  opacity: count > 0 ? 0.6 : 0.15,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Sub-components ── */

const StatCard = ({ icon, color, label, value }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
    <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3 ${color}`}>
      {icon}
    </div>
    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-slate-900">{value}</p>
  </div>
);

const ACTION_CARD_STYLES = {
  Cancelled: { bg: 'bg-red-50',    text: 'text-red-500',    badge: 'text-red-600' },
  Created:   { bg: 'bg-green-50',  text: 'text-green-600',  badge: 'text-green-700' },
  Booked:    { bg: 'bg-green-50',  text: 'text-green-600',  badge: 'text-green-700' },
  Updated:   { bg: 'bg-amber-50',  text: 'text-amber-600',  badge: 'text-amber-700' },
  Paid:      { bg: 'bg-blue-50',   text: 'text-blue-600',   badge: 'text-blue-700' },
};

export default AnalyticsDashboard;