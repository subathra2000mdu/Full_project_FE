import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../API/axiosInstance';
import { AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const BookingPage = () => {
  const { flightId } = useParams();
  const navigate = useNavigate();

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState(''); 
  const [bookingSuccess, setBookingSuccess] = useState('');

  const [formData, setFormData] = useState({
    passengerName: '',
    passengerEmail: '',
    seatPreference: 'Window'
  });

  useEffect(() => {
    const selectedFlight = localStorage.getItem('selectedFlight');
    if (selectedFlight) {
      try {
        setFlight(JSON.parse(selectedFlight));
      } catch (error) {
        setBookingError(error.response?.data?.message || 'Invalid flight data. Please try again.');
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
      toast.error('Passenger name is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.passengerEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  

const handleReserveBooking = async () => {
  if (!validateForm()) return;

  const token = localStorage.getItem('userToken'); 
  if (!token) {
    toast.error("Please login first");
    return navigate('/login');
  }

  setSubmitting(true);
  setBookingError(''); 

  try {
    const payload = {
      flightId: flight._id,
      passengerDetails: {
        name: formData.passengerName.trim(),
        email: formData.passengerEmail.trim().toLowerCase()
      },
      seatPreference: formData.seatPreference
    };

    const response = await API.post('/bookings/reserve', payload);

    if (response.data?.itinerary) {
      setBookingSuccess("Success!");
      toast.success("Booking Reserved!");
      localStorage.setItem('currentBooking', JSON.stringify(response.data.itinerary));
      setTimeout(() => navigate(`/payment/${response.data.itinerary._id}`), 1000);
    }
  } catch (error) {
    const msg = error.response?.data?.message || "Booking failed";
    setBookingError(msg); 
    toast.error(msg);
  } finally {
    setSubmitting(false);
  }
};

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  if (!flight) return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center">
      <AlertCircle className="text-red-500 mb-4" size={48} />
      <h2 className="text-xl font-bold mb-4">No Flight Selected</h2>
      <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Return Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-10 px-4">
      <div className="w-full max-w-2xl mx-auto">
        <div class="mb-5 sm:mb-6"><button onClick={() => navigate('/')} class="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition font-bold text-sm bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg> Back to Search</button></div>

       
        {bookingError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700 font-medium">{bookingError}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg p-8 mb-5">
          <h3 className="text-xl font-black mb-4">Flight Details</h3>
          <div className="space-y-3 bg-blue-50 rounded-xl p-6">
            <div className="grid grid-cols-2">
              <div><p className="text-xs font-bold text-gray-500">AIRLINE</p><p className="font-black">{flight.airline}</p></div>
              <div><p className="text-xs font-bold text-gray-500">FLIGHT #</p><p className="font-black">{flight.flightNumber}</p></div>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="grid grid-cols-2">
              <div><p className="text-xs font-bold text-gray-500">FROM</p><p className="font-black">{flight.departureLocation}</p></div>
              <div><p className="text-xs font-bold text-gray-500">TO</p><p className="font-black">{flight.arrivalLocation}</p></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border p-8">
          <h2 className="text-2xl font-black mb-6">Complete Your Booking</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-black mb-2">Passenger Name *</label>
              <input 
                name="passengerName"
                value={formData.passengerName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 rounded-lg outline-none focus:border-blue-500" 
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-black mb-2">Email Address *</label>
              <input 
                name="passengerEmail"
                value={formData.passengerEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 rounded-lg outline-none focus:border-blue-500" 
                placeholder="Enter email"
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
              <span className="font-bold">Total Amount</span>
              <span className="text-2xl font-black text-blue-600">₹{flight.price?.toLocaleString('en-IN')}</span>
            </div>

            <button 
              onClick={handleReserveBooking}
              disabled={submitting || !!bookingSuccess}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-lg flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
              {submitting ? "Reserving..." : bookingSuccess ? "Redirecting..." : "Reserve Booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;