import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../API/axiosInstance';
import { User, Mail, Phone, Plane, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; // Import toast

const BookingPage = () => {
    const { flightId } = useParams(); // From route: /booking/:flightId
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        passengerName: '',
        email: '',
        phone: ''
    });

    // src/Pages/BookingPage.jsx
// src/Pages/BookingPage.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    // Ensure the path matches your backend auth/booking route
    const response = await API.post('/auth/bookings/create', {
      flightId,
      ...formData
    });

    if (response.data.bookingId) {
      // Seamlessly transition to the payment route
      navigate(`/payment/${response.data.bookingId}`);
    }
  } catch (error) {
    console.error("Connection Error:", error);
    // Detailed error helps debug if it's a 404 or a 500
    toast.error(error.response?.data?.message || "Check server connection.");
  } finally {
    setLoading(false);
  }
};

    return (
        <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
                <div className="bg-blue-600 p-8 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <Plane className="rotate-90" />
                        <span className="uppercase tracking-widest text-xs font-bold opacity-80">Flight Booking</span>
                    </div>
                    <h2 className="text-3xl font-black">Passenger Details</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                <input 
                                    required
                                    type="text" 
                                    placeholder="Enter passenger name"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    onChange={(e) => setFormData({...formData, passengerName: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                    <input 
                                        required
                                        type="email" 
                                        placeholder="email@example.com"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                    <input 
                                        required
                                        type="tel" 
                                        placeholder="+91 00000 00000"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                Proceed to Payment 
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BookingPage;