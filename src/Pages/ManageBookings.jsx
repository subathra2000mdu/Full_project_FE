import React, { useState } from 'react';
import axios from '../API/axiosInstance';
import { toast } from 'react-hot-toast';
import { CreditCard, ShieldCheck, Check } from 'lucide-react';

const ManageBookings = () => {
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (status) => {
    if (!bookingId) return toast.error("Please enter a Booking ID");
    setLoading(true);
    try {
      await axios.patch(`/bookings/update/${bookingId}`, { paymentStatus: status });
      toast.success(`Booking ${status} Successfully! Email sent.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl shadow-2xl border p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Process</h2>
        
        {/* Step Indicator from design */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs"><Check size={14}/></div></div>
          <div className="h-[2px] bg-blue-600 flex-grow mx-2"></div>
          <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs"><CreditCard size={14}/></div></div>
          <div className="h-[2px] bg-gray-200 flex-grow mx-2"></div>
          <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs">3</div></div>
        </div>

        <div className="space-y-6">
          <input 
            type="text" 
            placeholder="Enter Booking ID"
            className="w-full p-4 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
          />

          <div className="bg-blue-50 p-4 rounded-xl flex items-center space-x-3">
            <ShieldCheck className="text-blue-600" size={20} />
            <p className="text-xs text-blue-700 font-bold">Secure Payment Methods: All data is encrypted.</p>
          </div>

          <button 
            disabled={loading}
            onClick={() => handleUpdate('Completed')}
            className="w-full py-4 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 transition disabled:opacity-50"
          >
            Payment Complete
          </button>
          
          <button 
            disabled={loading}
            onClick={() => handleUpdate('Cancelled')}
            className="w-full py-4 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition disabled:opacity-50"
          >
            Cancel Flight
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageBookings;