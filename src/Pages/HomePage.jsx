import React, { useState, useEffect } from 'react';
import API from '../API/axiosInstance';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Calendar, Plane, Loader2,
  AlertCircle, Clock, Users, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const BOOKING_CLASSES = ['Economy', 'Business', 'First Class'];

const HomePage = () => {
  const [search, setSearch] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1,
    bookingClass: 'Economy',
  });

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [showClassMenu, setShowClassMenu] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = () => setShowClassMenu(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

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
          to: search.to.toUpperCase(),
          date: search.date || undefined,
          passengers: search.passengers,
          bookingClass: search.bookingClass,
        },
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
    if (!token) {
      toast.error("Please login to book a flight");
      navigate('/login');
      return;
    }
    localStorage.setItem('selectedFlight', JSON.stringify(flight));
    localStorage.setItem('searchMeta', JSON.stringify({
      passengers: search.passengers,
      bookingClass: search.bookingClass,
    }));
    navigate(`/booking/${flight._id}`);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
    });
  };

  const getISTDateString = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
  };

  const getStatusColor = (status) => {
    const map = {
      scheduled: 'bg-green-100 text-green-700',
      active: 'bg-blue-100 text-blue-700',
      landed: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-700',
      delayed: 'bg-yellow-100 text-yellow-700',
    };
    return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  const displayedFlights = search.date
    ? flights.filter(f => {
        if (!f.departureTime) return true;
        return getISTDateString(f.departureTime) === search.date;
      })
    : flights;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Hero & Search Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 py-10 sm:py-14 mb-6 sm:mb-8">
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Happy Journey</h1>
            <p className="text-blue-200 font-medium text-sm sm:text-base">Search flights across India</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-3 sm:p-4 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {/* From */}
              <div className="flex items-center px-3 sm:px-4 py-3 bg-slate-50 rounded-xl border">
                <MapPin className="text-blue-400 mr-2 shrink-0" size={18} />
                <div className="w-full min-w-0">
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

              {/* To */}
              <div className="flex items-center px-3 sm:px-4 py-3 bg-slate-50 rounded-xl border">
                <MapPin className="text-red-400 mr-2 shrink-0" size={18} />
                <div className="w-full min-w-0">
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

              {/* Date */}
              <div className="flex items-center px-3 sm:px-4 py-3 bg-slate-50 rounded-xl border">
                <Calendar className="text-slate-400 mr-2 shrink-0" size={18} />
                <div className="w-full min-w-0">
                  <p className="text-xs text-slate-400 font-semibold">Date</p>
                  <input
                    type="date"
                    className="bg-transparent w-full outline-none text-sm font-bold"
                    value={search.date}
                    onChange={e => setSearch({ ...search, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Passengers */}
              <div className="flex items-center px-3 sm:px-4 py-3 bg-slate-50 rounded-xl border">
                <Users className="text-slate-400 mr-2 shrink-0" size={18} />
                <div className="w-full min-w-0">
                  <p className="text-xs text-slate-400 font-semibold">Passengers</p>
                  <input
                    type="number"
                    min={1}
                    max={9}
                    className="bg-transparent w-full outline-none text-sm font-black"
                    value={search.passengers}
                    onChange={e => {
                      const val = Math.max(1, Math.min(9, parseInt(e.target.value) || 1));
                      setSearch({ ...search, passengers: val });
                    }}
                  />
                </div>
              </div>

              {/* Class Selection */}
              <div className="relative">
                <button
                  onClick={e => { e.stopPropagation(); setShowClassMenu(v => !v); }}
                  className="w-full h-full flex items-center px-3 sm:px-4 py-3 bg-slate-50 rounded-xl border text-left"
                >
                  <Plane className="text-slate-400 mr-2 shrink-0" size={18} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 font-semibold">Class</p>
                    <p className="text-sm font-black text-slate-800 truncate">{search.bookingClass}</p>
                  </div>
                  <ChevronDown className="text-slate-400 shrink-0 ml-1" size={14} />
                </button>
                {showClassMenu && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {BOOKING_CLASSES.map(cls => (
                      <button
                        key={cls}
                        onClick={e => {
                          e.stopPropagation();
                          setSearch({ ...search, bookingClass: cls });
                          setShowClassMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-blue-50 transition ${
                          search.bookingClass === cls ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl flex items-center justify-center gap-2 py-3 transition shadow-lg shadow-blue-200 sm:col-span-2 md:col-span-1"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                {loading ? 'SEARCHING...' : 'SEARCH'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="w-full max-w-6xl mx-auto px-4 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <p className="text-red-700 font-semibold text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="w-full max-w-6xl mx-auto px-4">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        )}

        {!loading && hasSearched && displayedFlights.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {displayedFlights.map((f) => (
              <div
                key={f._id}
                className="bg-white rounded-2xl border border-slate-200 transition-all duration-200 overflow-hidden hover:border-blue-200 hover:shadow-lg"
              >
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                      <Plane size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-black text-sm text-blue-600">{f.airline}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 font-mono text-xs bg-slate-50 px-2 py-0.5 rounded">{f.flightNumber}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${getStatusColor(f.status)}`}>
                          {f.status}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {f.departureLocation} → {f.arrivalLocation}
                      </h3>
                      <div className="flex items-center gap-3 sm:gap-4 mt-1 flex-wrap">
                        <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(f.departureTime)} • {formatDate(f.departureTime)}
                        </span>
                        <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                          <Users size={12} /> {f.seatsAvailable} seats left
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 w-full sm:w-auto shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-400 font-semibold">Price</p>
                      <p className="text-xl sm:text-2xl font-black text-slate-900">
                        ₹{f.price?.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleBookNow(f)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 rounded-xl text-sm font-black transition shadow-md whitespace-nowrap"
                    >
                      Book Now →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty States */}
        {!loading && hasSearched && displayedFlights.length === 0 && (
          <div className="bg-white border rounded-3xl p-12 sm:p-20 text-center">
            <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800">No Flights Found</h3>
            <p className="text-slate-500 text-sm mt-1">Try different locations or dates.</p>
          </div>
        )}

        {!loading && !hasSearched && (
          <div className="bg-white border rounded-3xl p-12 sm:p-20 text-center">
            <Plane className="mx-auto text-slate-200 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800">Search for Flights</h3>
            <p className="text-slate-500 text-sm mt-1">Enter departure and arrival codes above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;