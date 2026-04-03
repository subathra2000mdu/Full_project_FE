import React, { useState, useEffect } from 'react';
import API from '../API/axiosInstance';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Calendar, Plane, Loader2,
  AlertCircle, Clock, Users, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const HomePage = () => {
  const [search, setSearch]         = useState({ from: '', to: '', date: '' });
  const [flights, setFlights]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError]           = useState('');

  // Booking / cancellation state
  const [currentBooking, setCurrentBooking]   = useState(null);  // from localStorage
  const [paymentInfo, setPaymentInfo]         = useState(null);   // from localStorage
  const [cancellingId, setCancellingId]       = useState(null);   // bookingId being cancelled
  const [cancelledIds, setCancelledIds]       = useState([]);     // cancelled this session
  const [cancellationRate, setCancellationRate] = useState(50);   // Defaulting to 50%

  const navigate = useNavigate();

  // ── On mount: read localStorage + fetch admin dashboard for cancellation rate ──
  useEffect(() => {
    const rawBooking = localStorage.getItem('currentBooking');
    const rawPayment = localStorage.getItem('paymentInfo');

    if (rawBooking) {
      try { setCurrentBooking(JSON.parse(rawBooking)); } catch { /* ignore */ }
    }
    if (rawPayment) {
      try { setPaymentInfo(JSON.parse(rawPayment)); } catch { /* ignore */ }
    }

    const fetchDashboard = async () => {
      try {
        const res = await API.get('/admin/dashboard');
        // If the backend returns a string like "50.00%", we extract the number
        const rateStr = res.data?.cancellationRate || '50%';
        const rate = parseFloat(rateStr);
        if (!isNaN(rate)) setCancellationRate(rate);
      } catch (err) {
        console.warn('Dashboard fetch failed, staying at 50%:', err.message);
        setCancellationRate(50); // Hard fallback
      }
    };
    fetchDashboard();
  }, []);

  // ── Determine if a flight is currently booked & paid ──
  const isFlightBooked = (flightId) => {
    if (!currentBooking) return false;
    if (currentBooking.paymentStatus !== 'Completed') return false;
    if (cancelledIds.includes(currentBooking._id)) return false;

    const bookedFlightId = currentBooking.flight?._id || currentBooking.flight || '';
    return bookedFlightId.toString() === flightId.toString();
  };

  // ── Search ──
  const handleSearch = async () => {
    if (!search.from || !search.to) {
      setError('Please enter both departure and arrival IATA codes (e.g., MAA, BOM)');
      return;
    }
    setError('');
    setLoading(true);
    setFlights([]);

    try {
      const res = await API.get('/flights/search', {
        params: {
          from: search.from.toUpperCase(),
          to:   search.to.toUpperCase(),
          date: search.date || undefined
        }
      });
      setFlights(res.data);
      setHasSearched(true);
    } catch (err) {
      console.error('Flight search error:', err);
      setError('Failed to fetch flights. Please try again.');
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (flight) => {
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); return; }
    localStorage.setItem('selectedFlight', JSON.stringify(flight));
    navigate(`/booking/${flight._id}`);
  };

  // ── Cancel Ticket Logic ──
  const handleCancelTicket = async (flight) => {
    if (!currentBooking?._id) {
      toast.error('Booking not found.');
      return;
    }

    // Calculation: (Actual Paid Amount) * (50 / 100)
    const paidAmount   = paymentInfo?.amount || flight.price || 0;
    const refundAmount = Math.round(paidAmount * (cancellationRate / 100));

    const confirmed = window.confirm(
      `⚠️ Cancel Ticket Confirmation\n\n` +
      `Flight   : ${flight.airline} (${flight.flightNumber})\n` +
      `Paid     : ₹${paidAmount.toLocaleString('en-IN')}\n` +
      `Refund   : ₹${refundAmount.toLocaleString('en-IN')} (${cancellationRate}%)\n\n` +
      `Are you sure? This cannot be undone.`
    );

    if (!confirmed) return;

    setCancellingId(currentBooking._id);
    try {
      await API.patch(`/bookings/update/${currentBooking._id}`, {
        paymentStatus: 'Cancelled'
      });

      toast.success(
        `Cancelled! ₹${refundAmount.toLocaleString('en-IN')} will be refunded.`
      );

      setCancelledIds(prev => [...prev, currentBooking._id]);
      localStorage.removeItem('currentBooking');
      localStorage.removeItem('paymentInfo');
      setCurrentBooking(null);
      setPaymentInfo(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'
    });
  };

  const getStatusColor = (status) => {
    const map = {
      scheduled: 'bg-green-100 text-green-700',
      active:    'bg-blue-100 text-blue-700',
      landed:    'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-700',
      delayed:   'bg-yellow-100 text-yellow-700',
    };
    return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Search Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-14 mb-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-black text-white mb-2">Where to next?</h1>
          <p className="text-blue-200 mb-8 font-medium">Search flights across India</p>

          <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex items-center px-4 py-3 bg-slate-50 rounded-xl border">
              <MapPin className="text-blue-400 mr-2 shrink-0" size={18} />
              <div className="w-full">
                <p className="text-xs text-slate-400 font-semibold">From</p>
                <input
                  type="text"
                  placeholder="MAA"
                  maxLength={3}
                  className="bg-transparent w-full outline-none text-sm font-black uppercase"
                  value={search.from}
                  onChange={e => setSearch({ ...search, from: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center px-4 py-3 bg-slate-50 rounded-xl border">
              <MapPin className="text-red-400 mr-2 shrink-0" size={18} />
              <div className="w-full">
                <p className="text-xs text-slate-400 font-semibold">To</p>
                <input
                  type="text"
                  placeholder="BOM"
                  maxLength={3}
                  className="bg-transparent w-full outline-none text-sm font-black uppercase"
                  value={search.to}
                  onChange={e => setSearch({ ...search, to: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center px-4 py-3 bg-slate-50 rounded-xl border">
              <Calendar className="text-slate-400 mr-2 shrink-0" size={18} />
              <div className="w-full">
                <p className="text-xs text-slate-400 font-semibold">Date</p>
                <input
                  type="date"
                  className="bg-transparent w-full outline-none text-sm font-bold"
                  value={search.date}
                  onChange={e => setSearch({ ...search, date: e.target.value })}
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl flex items-center justify-center gap-2 py-3 transition shadow-lg shadow-blue-200"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              {loading ? 'SEARCHING...' : 'SEARCH'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-4">
        {!loading && hasSearched && flights.length > 0 && (
          <div className="space-y-4">
            {flights.map((f) => {
              const booked       = isFlightBooked(f._id);
              const isCancelling = cancellingId === currentBooking?._id && booked;
              const paidAmount   = paymentInfo?.amount || f.price || 0;
              const refundAmt    = Math.round(paidAmount * (cancellationRate / 100));

              return (
                <div
                  key={f._id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    booked ? 'border-red-200 shadow-md' : 'border-slate-200 hover:border-blue-200 hover:shadow-lg'
                  }`}
                >
                  <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 ${booked ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                        <Plane size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`font-black text-sm ${booked ? 'text-red-500' : 'text-blue-600'}`}>{f.airline}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 font-mono text-xs bg-slate-50 px-2 py-0.5 rounded">{f.flightNumber}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${getStatusColor(f.status)}`}>{f.status}</span>
                          {booked && <span className="text-xs font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600">Your Booking</span>}
                        </div>
                        <h3 className="text-lg font-black text-slate-900">{f.departureLocation} → {f.arrivalLocation}</h3>
                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                          <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                            <Clock size={12} /> {formatTime(f.departureTime)} • {formatDate(f.departureTime)}
                          </span>
                          <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                            <Users size={12} /> {f.seatsAvailable} seats left
                          </span>
                        </div>
                        {booked && (
                          <p className="text-xs text-red-500 font-bold mt-2 bg-red-50 inline-block px-2 py-1 rounded">
                            Cancellation Refund: ₹{refundAmt.toLocaleString('en-IN')} ({cancellationRate}%)
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end gap-3 ml-auto">
                      <div className="text-right">
                        <p className="text-xs text-slate-400 font-semibold">Price</p>
                        <p className="text-2xl font-black text-slate-900">₹{f.price?.toLocaleString('en-IN')}</p>
                      </div>

                      {booked ? (
                        <button
                          onClick={() => handleCancelTicket(f)}
                          disabled={isCancelling}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-black transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {isCancelling ? <Loader2 className="animate-spin" size={15} /> : <XCircle size={15} />}
                          {isCancelling ? 'Cancelling...' : 'Cancel Ticket'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBookNow(f)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-black transition shadow-md"
                        >
                          Book Now →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Initial/Empty States */}
        {!loading && hasSearched && flights.length === 0 && (
          <div className="bg-white border rounded-3xl p-20 text-center">
            <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800">No Flights Found</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;