import React, { useState } from 'react';
import API from '../API/axiosInstance';  // ✅ FIXED: Go up 2 levels (src/Pages -> src -> root)
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Plane, Loader2, AlertCircle, Clock, Users } from 'lucide-react';

const HomePage = () => {
  const [search, setSearch] = useState({ from: '', to: '', date: '' });
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!search.from || !search.to) {
      setError("Please enter both departure and arrival IATA codes (e.g., MAA, BOM)");
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
          date: search.date || undefined
        }
      });
      setFlights(res.data);
      setHasSearched(true);
    } catch (err) {
      console.error("Flight search error:", err);
      setError("Failed to fetch flights. Please try again.");
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (flight) => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      navigate('/login');
      return;
    }
    // Save selected flight to localStorage, then navigate to booking
    localStorage.setItem("selectedFlight", JSON.stringify(flight));
    navigate(`/booking/${flight._id}`);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-green-100 text-green-700',
      active: 'bg-blue-100 text-blue-700',
      landed: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-700',
      delayed: 'bg-yellow-100 text-yellow-700',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">

      {/* ── Hero Search Bar ── */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-14 mb-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-black text-white mb-2">Where to next?</h1>
          <p className="text-blue-200 mb-8 font-medium">Search flights across India</p>

          <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* From */}
            <div className="flex items-center px-4 py-3 bg-slate-50 rounded-xl border focus-within:border-blue-400">
              <MapPin className="text-blue-400 mr-2 shrink-0" size={18} />
              <div className="w-full">
                <p className="text-xs text-slate-400 font-semibold">From</p>
                <input
                  type="text"
                  placeholder="MAA"
                  maxLength={3}
                  className="bg-transparent w-full outline-none text-sm font-black uppercase"
                  value={search.from}
                  onChange={(e) => setSearch({ ...search, from: e.target.value })}
                />
              </div>
            </div>

            {/* To */}
            <div className="flex items-center px-4 py-3 bg-slate-50 rounded-xl border focus-within:border-blue-400">
              <MapPin className="text-red-400 mr-2 shrink-0" size={18} />
              <div className="w-full">
                <p className="text-xs text-slate-400 font-semibold">To</p>
                <input
                  type="text"
                  placeholder="BOM"
                  maxLength={3}
                  className="bg-transparent w-full outline-none text-sm font-black uppercase"
                  value={search.to}
                  onChange={(e) => setSearch({ ...search, to: e.target.value })}
                />
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center px-4 py-3 bg-slate-50 rounded-xl border focus-within:border-blue-400">
              <Calendar className="text-slate-400 mr-2 shrink-0" size={18} />
              <div className="w-full">
                <p className="text-xs text-slate-400 font-semibold">Date</p>
                <input
                  type="date"
                  className="bg-transparent w-full outline-none text-sm font-bold"
                  value={search.date}
                  onChange={(e) => setSearch({ ...search, date: e.target.value })}
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl flex items-center justify-center gap-2 py-3 transition disabled:opacity-50 shadow-lg shadow-blue-200"
            >
              {loading
                ? <><Loader2 className="animate-spin" size={18} /> Searching...</>
                : <><Search size={18} /> SEARCH</>
              }
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 max-w-5xl mx-auto text-sm font-semibold flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="max-w-6xl mx-auto px-4">

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="h-14 w-14 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                    <div className="h-5 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                  <div className="h-8 w-24 bg-slate-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results header */}
        {!loading && hasSearched && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800">
              {flights.length > 0
                ? `${flights.length} Flight${flights.length > 1 ? 's' : ''} Found`
                : 'No Flights Found'}
            </h2>
            {flights.length > 0 && (
              <p className="text-sm text-slate-400 font-semibold">
                {search.from.toUpperCase()} → {search.to.toUpperCase()}
                {search.date && ` • ${formatDate(search.date)}`}
              </p>
            )}
          </div>
        )}

        {/* Flight cards */}
        {!loading && hasSearched && flights.length > 0 && (
          <div className="space-y-4">
            {flights.map((f) => (
              <div
                key={f._id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

                  {/* Left: Airline info */}
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                      <Plane size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-blue-600 text-sm">{f.airline}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 font-mono text-xs bg-slate-50 px-2 py-0.5 rounded">
                          {f.flightNumber}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${getStatusColor(f.status)}`}>
                          {f.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900">
                        {f.departureLocation} → {f.arrivalLocation}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(f.departureTime)} • {formatDate(f.departureTime)}
                        </span>
                        <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                          <Users size={12} />
                          {f.seatsAvailable} seats left
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price + Book */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 ml-auto">
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-semibold">Price per person</p>
                      <p className="text-2xl font-black text-slate-900">₹{f.price?.toLocaleString('en-IN')}</p>
                    </div>
                    <button
                      onClick={() => handleBookNow(f)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-black transition shadow-md shadow-blue-100 whitespace-nowrap"
                    >
                      Book Now →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && hasSearched && flights.length === 0 && (
          <div className="bg-white border rounded-3xl p-20 text-center">
            <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800">No Flights Found</h3>
            <p className="text-slate-400 text-sm mt-1">Try different IATA codes or remove the date filter</p>
          </div>
        )}

        {/* Initial state */}
        {!loading && !hasSearched && (
          <div className="py-20 text-center">
            <Plane className="mx-auto text-slate-200 mb-4" size={64} />
            <p className="font-bold text-slate-400">Enter departure and arrival codes above to search flights</p>
            <p className="text-slate-300 text-sm mt-1">Example: MAA → BOM, DEL → BLR</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;