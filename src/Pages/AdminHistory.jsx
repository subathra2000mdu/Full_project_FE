import React, { useEffect, useState } from 'react';
import axios from '../API/axiosInstance';
import { 
  Calendar, Download, ArrowLeft, Loader2, User, X, CheckCircle, XCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminHistory = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  

  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      toast.error('Please login to view history');
      navigate('/login');
      return;
    }

    const fetchUserHistory = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/bookings/my-history');
        const data = response.data;
        let allData = Array.isArray(data) ? data : (data.bookings || []);
        
        setBookings(allData);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserHistory();
  }, [navigate, userEmail]);

  const handleDownloadReceipt = (booking) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("FLIGHT RECEIPT", 105, 20, { align: "center" });

      autoTable(doc, {
        startY: 30,
        head: [['Detail', 'Value']],
        body: [
          ['Booking ID', booking._id.slice(-6).toUpperCase()],
          ['Passenger', booking.passengerDetails?.name || 'N/A'],
          ['Airline', booking.flight?.airline || 'N/A'],
          ['Route', `${booking.flight?.departureLocation} to ${booking.flight?.arrivalLocation}`],
          ['Status', booking.paymentStatus],
          ['Price', `INR ${booking.flight?.price || '0'}`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }
      });

      doc.save(`Receipt_${booking._id.slice(-6)}.pdf`);
      toast.success('Receipt downloaded!');
    } catch (error) {
      toast.error(error.response?.data?.message || "PDF Generation failed.");
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div class="mb-5 sm:mb-6">
        <button onClick={() => navigate('/')} class="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition font-bold text-sm bg-white 
        px-4 py-2 rounded-full border border-slate-100 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="16"
         height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
         
         stroke-linejoin="round" class="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path>
         <path d="M19 12H5"></path></svg> Back to Search</button></div>
      <h2 className="text-2xl font-bold mb-6">Booking History</h2>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking._id} className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <p className="font-bold">{booking.flight?.airline}</p>
              <p className="text-sm text-slate-500">{booking.passengerDetails?.name}</p>
            </div>
            <div className="flex gap-4 items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.paymentStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {booking.paymentStatus}
              </span>
              <button onClick={() => handleDownloadReceipt(booking)} className="bg-slate-900 text-white p-2 rounded-lg">
                <Download size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminHistory;