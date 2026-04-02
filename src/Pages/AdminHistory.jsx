import React, { useEffect, useState } from 'react';
import axios from '../API/axiosInstance'; 
import { Calendar, CheckCircle, XCircle, Download } from 'lucide-react';

const AdminHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('/admin/history'); 
        // res.data should be the array seen in image_28af4a.png
        setHistory(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="text-center p-20 font-bold">Loading...</div>;

  return (
    <div className="w-full max-w-5xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <h2 className="text-2xl font-black mb-1">Manage Your Bookings Dashboard</h2>
        <p className="text-gray-500 mb-8">Find your next flight with ease.</p>

        <div className="space-y-6">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Booking History</h3>
          
          {history.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed rounded-xl text-gray-400">
              No recent "Completed" or "Cancelled" activity found.
            </div>
          ) : (
            history.map((log) => (
              <div key={log._id} className="flex items-center justify-between p-5 border rounded-xl bg-white hover:shadow-md transition">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-400">
                    <Calendar size={20} />
                  </div>
                  <div>
                    {/* Accessing keys based on your DB screenshot */}
                    <h4 className="font-bold text-gray-900">Reference: {log.bookingId?.slice(-6).toUpperCase() || 'N/A'}</h4>
                    <p className="text-xs text-gray-500">Date: {new Date(log.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    {/* Using 'action' field from your DB */}
                    {log.action === 'Completed' ? (
                      <CheckCircle className="text-green-500" size={16} />
                    ) : (
                      <XCircle className="text-red-500" size={16} />
                    )}
                    <span className={`text-sm font-bold ${log.action === 'Cancelled' ? 'text-red-600' : 'text-green-600'}`}>
                      {log.action}
                    </span>
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">
                    <Download size={14} />
                    <span>Download Receipt</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHistory;