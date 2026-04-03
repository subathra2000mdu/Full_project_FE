import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../API/axiosInstance';
import { AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const BookingPage = () => {
  const { flightId } = useParams();
  const navigate = useNavigate();

  const [flight, setFlight]             = useState(null);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  const [formData, setFormData] = useState({
    passengerName:  '',
    passengerEmail: '',
    seatPreference: 'Window'
  });

  useEffect(() => {
    const selectedFlight = localStorage.getItem('selectedFlight');
    if (selectedFlight) {
      try {
        setFlight(JSON.parse(selectedFlight));
      } catch (error) {
        console.error('Error parsing flight data:', error);
        setBookingError('Invalid flight data. Please try again.');
      }
    }
    setLoading(false);
  }, [flightId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.passengerName.trim()) {
      setBookingError('Please enter passenger name');
      return false;
    }
    if (!formData.passengerEmail.trim()) {
      setBookingError('Please enter email address');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.passengerEmail)) {
      setBookingError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleReserveBooking = async () => {
    setBookingError('');
    setBookingSuccess('');
    if (!validateForm()) return;
    if (!flight?._id) {
      setBookingError('Flight information is missing. Please go back and select a flight.');
      return;
    }

    setSubmitting(true);
    try {
      const bookingPayload = {
        flightId:       flight._id,
        passengerName:  formData.passengerName.trim(),
        passengerEmail: formData.passengerEmail.trim(),
        seatPreference: formData.seatPreference
      };

      const response = await API.post('/bookings/reserve', bookingPayload);

      if (response.data?.itinerary?._id) {
        const bookingId = response.data.itinerary._id;
        const ref = response.data.itinerary.bookingReference || bookingId.slice(-8).toUpperCase();
        setBookingSuccess(`Booking Reserved Successfully! Reference: ${ref}`);
        localStorage.setItem('currentBooking', JSON.stringify({
          ...response.data.itinerary,
          flight,
        }));
        toast.success('Booking reserved! Proceeding to payment...');
        setTimeout(() => navigate(`/payment/${bookingId}`), 1500);
      } else {
        setBookingError('Booking failed. Invalid response from server.');
        toast.error('Booking failed. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      let errorMessage = '';
      if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please login again.';
        setTimeout(() => navigate('/login'), 1500);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Failed to reserve booking. Please try again.';
      }
      setBookingError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 font-semibold mb-6 hover:text-blue-700"
          >
            <ArrowLeft size={18} /> Back to Search
          </button>
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-black text-gray-900 mb-2">No Flight Selected</h2>
            <p className="text-gray-600 mb-6">Please select a flight from the search results.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-lg transition"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-6 sm:py-10 px-4">
      <div className="w-full max-w-2xl mx-auto">

        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition font-bold text-sm bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm"
          >
            <ArrowLeft size={16} /> Back to Search
          </button>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-blue-200 shadow-lg p-5 sm:p-8 mb-5">
          <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-4">Flight Details</h3>
          <div className="space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Airline</p>
                <p className="text-sm sm:text-base font-black text-gray-900 mt-0.5">{flight.airline}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Flight #</p>
                <p className="text-sm sm:text-base font-black text-gray-900 mt-0.5 break-all">{flight.flightNumber}</p>
              </div>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">From</p>
                <p className="text-sm sm:text-base font-black text-gray-900 mt-0.5">{flight.departureLocation}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">To</p>
                <p className="text-sm sm:text-base font-black text-gray-900 mt-0.5">{flight.arrivalLocation}</p>
              </div>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Price</p>
                <p className="text-xl sm:text-2xl font-black text-blue-600 mt-0.5">
                  ₹{flight.price?.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Seats Available</p>
                <p className="text-xl sm:text-2xl font-black text-green-600 mt-0.5">{flight.seatsAvailable}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6">Complete Your Booking</h2>

          {bookingSuccess && (
            <div className="mb-5 bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
              <div className="flex gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-green-800 font-semibold text-sm">{bookingSuccess}</p>
                  <p className="text-green-700 text-xs mt-1">Redirecting to payment...</p>
                </div>
              </div>
            </div>
          )}

          {bookingError && (
            <div className="mb-5 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-800 font-semibold text-sm">{bookingError}</p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            
            <div>
              <label className="block text-sm font-black text-gray-900 mb-2">
                Passenger Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="passengerName"
                value={formData.passengerName}
                onChange={handleInputChange}
                placeholder="Enter full name"
                disabled={submitting}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition font-semibold text-gray-900 disabled:opacity-50"
              />
            </div>

            
            <div>
              <label className="block text-sm font-black text-gray-900 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="passengerEmail"
                value={formData.passengerEmail}
                onChange={handleInputChange}
                placeholder="Enter email address"
                disabled={submitting}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition font-semibold text-gray-900 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 font-semibold mt-1">
                Your booking confirmation will be sent here
              </p>
            </div>

          
            <div>
              <label className="block text-sm font-black text-gray-900 mb-2">Seat Preference</label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {['Window', 'Aisle', 'Middle'].map(preference => (
                  <button
                    key={preference}
                    onClick={() => setFormData(prev => ({ ...prev, seatPreference: preference }))}
                    disabled={submitting}
                    className={`py-3 px-2 sm:px-4 rounded-lg font-bold text-sm transition-all disabled:opacity-50 ${
                      formData.seatPreference === preference
                        ? 'bg-blue-600 text-white border-2 border-blue-600'
                        : 'bg-gray-100 text-gray-900 border-2 border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    {preference}
                  </button>
                ))}
              </div>
            </div>

            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700">Total Amount</span>
                <span className="text-2xl font-black text-blue-600">
                  ₹{flight.price?.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-gray-600 font-semibold mt-2">
                You will be redirected to payment after booking confirmation
              </p>
            </div>

            
            <button
              onClick={handleReserveBooking}
              disabled={submitting || !!bookingSuccess}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-base sm:text-lg"
            >
              {submitting ? (
                <><Loader2 className="animate-spin" size={20} /><span>Reserving Booking...</span></>
              ) : bookingSuccess ? (
                <><CheckCircle size={20} /><span>Booking Reserved!</span></>
              ) : (
                <><CheckCircle size={20} /><span>Reserve Booking</span></>
              )}
            </button>

            <p className="text-xs text-center text-gray-500 font-semibold">
              By clicking "Reserve Booking", you agree to our terms and conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;