import React, { useState } from 'react';
import axios from '../API/axiosInstance';
import { toast } from 'react-hot-toast'; //

const ManageBookings = () => {
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status) => {
    if (!bookingId) return toast.error("Please enter a valid Booking ID");
    
    setLoading(true);
    try {
      // paymentStatus triggers the specific email logic (Booked/Paid/Cancelled)
      await axios.patch(`/bookings/update/${bookingId}`, { paymentStatus: status });
      toast.success(`Success! Status changed to ${status}. Email sent to customer.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Server Error. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 w-full">
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md">
        <h2 className="text-2xl font-black text-center text-gray-900 mb-2">Booking Control</h2>
        <p className="text-gray-400 text-sm text-center mb-8">Update status to trigger automated emails</p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Booking ID</label>
            <input 
              type="text" 
              placeholder="e.g. 65f1a2b3..." 
              className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              disabled={loading}
              onClick={() => updateStatus('Completed')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition disabled:opacity-50"
            >
              Mark Paid
            </button>
            <button 
              disabled={loading}
              onClick={() => updateStatus('Cancelled')}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg transition disabled:opacity-50"
            >
              Cancel Flight
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageBookings;