import React, { useEffect, useState } from 'react';
import axios from '../API/axiosInstance'; 

const AdminHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('/admin/history'); 
        setHistory(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="text-center p-10">Loading History...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <h2 className="text-2xl font-black mb-6 text-gray-800 border-b pb-2">Admin History Log</h2>
      {history.length === 0 ? (
        <div className="bg-white p-10 text-center rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">No cancelled or completed records found for the past 7 days.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-semibold text-gray-700">{log.userId?.name || 'Guest'}</td>
                  <td className="p-4 text-gray-600">{log.details?.bookingReference || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      log.details?.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {log.details?.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminHistory;