import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../API/axiosInstance';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf'; 
import { Loader2, CheckCircle, Lock } from 'lucide-react';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await API.get('/bookings/history');
        const list = Array.isArray(data) ? data : data.bookings || [];
        const info = list.find(b => b._id === bookingId);
        if (!info) throw new Error("Booking not found");

        const price = Number(info.totalAmount || info.flight?.price || 0);
        info.totalAmount = price;
        setBooking(info);

        const orderRes = await API.post('/payments/create-intent', { bookingId, amount: price });
        setOrderData(orderRes.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to initialize payment");
      } finally { setLoading(false); }
    };
    init();
  }, [bookingId]);

  const generatePDF = (data) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("FLIGHT E-TICKET", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Booking ID: ${data._id}`, 20, 40);
    doc.text(`Passenger: ${data.passengerDetails?.name}`, 20, 50);
    doc.text(`Flight: ${data.flight?.flightNumber}`, 20, 60);
    doc.text(`Status: CONFIRMED & PAID`, 20, 70);
    doc.save(`Ticket_${bookingId}.pdf`);
  };

  const handlePay = async () => {
    if (!window.Razorpay) {
      toast.error("Razorpay SDK not loaded. Please refresh.");
      return;
    }

    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      order_id: orderData.order_id,
      name: "Flight Booking System",
      handler: async (response) => {
        try {
          const verifyRes = await API.post('/payments/confirm', {
            bookingId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          
          setPaymentDone(true); 
          toast.success('Payment Successful!');
          
          
          generatePDF(verifyRes.data.booking || booking);
          
          
          setTimeout(() => {
            navigate('/'); 
          }, 3000);

        } catch (err) {
          toast.error(err.response?.data?.message || "Payment verification failed");
        }
      },
      prefill: { 
        name: booking?.passengerDetails?.name,
        email: booking?.passengerDetails?.email 
      },
      theme: { color: "#2563eb" }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl">
        {paymentDone ? (
          <div className="text-center">
            <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
            <h2 className="text-2xl font-bold">Payment Complete</h2>
            <p className="text-gray-500">Redirecting to history...</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-black mb-6">Complete Payment</h2>
            <div className="bg-blue-50 p-6 rounded-2xl mb-6 text-center">
              <p className="text-4xl font-black text-blue-700">₹{booking?.totalAmount}</p>
            </div>
            <button onClick={handlePay} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
              <Lock size={20}/> Pay Now
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;