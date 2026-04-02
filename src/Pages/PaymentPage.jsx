import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../API/axiosInstance';
import { CreditCard, Wallet, Landmark, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle'); 
    const [selectedMethod, setSelectedMethod] = useState('card');

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Create Payment Intent (Securing the transaction)
            const intentRes = await API.post('/auth/payments/create-intent', {
                bookingId: bookingId,
                amount: 5000 
            });

            if (intentRes.data.clientSecret) {
                // 2. Immediate Confirmation Call 
                // This updates the booking status to "Completed" in your DB
                const confirmRes = await API.post('/auth/payments/confirm', {
                    bookingId: bookingId,
                    paymentMethod: selectedMethod // Passing selected method to backend
                });

                if (confirmRes.status === 200) {
                    setPaymentStatus('success');
                    toast.success("Payment Successful! Booking is now Completed."); 
                }
            }
        } catch (err) {
            console.error("Payment Flow Error:", err);
            // Handle specific server connection errors
            const errorMsg = err.response?.data?.message || "Transaction failed. Check server connection.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (paymentStatus === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={48} className="text-green-600" />
                </div>
                <h2 className="text-4xl font-black text-slate-900">Booking Completed!</h2>
                <p className="text-slate-500 mt-4 max-w-sm">
                    Your payment via <span className="font-bold capitalize text-blue-600">{selectedMethod}</span> was successful. 
                    Your flight is now officially confirmed.
                </p>
                <button 
                    onClick={() => navigate('/history')}
                    className="mt-10 bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold transition-transform hover:scale-105 shadow-lg shadow-blue-200"
                >
                    View My History
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <header className="mb-10 text-center lg:text-left">
                <h1 className="text-4xl font-black text-slate-900">Secure Payment</h1>
                <p className="text-slate-500 mt-2">Immediate confirmation for Booking: <span className="font-mono font-bold text-blue-600">{bookingId}</span></p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Payment Methods Section */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Select Payment Method</h2>
                    {[
                        { id: 'card', label: 'Credit / Debit Card', icon: <CreditCard />, desc: 'Visa, Mastercard, RuPay' },
                        { id: 'wallet', label: 'Digital Wallets', icon: <Wallet />, desc: 'Google Pay, PhonePe, UPI' },
                        { id: 'bank', label: 'Net Banking', icon: <Landmark />, desc: 'Direct bank transfer' }
                    ].map((method) => (
                        <label 
                            key={method.id}
                            className={`flex items-center justify-between p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                                selectedMethod === method.id 
                                ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50' 
                                : 'border-slate-100 hover:border-slate-200 bg-white'
                            }`}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`p-3 rounded-xl ${selectedMethod === method.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {method.icon}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{method.label}</p>
                                    <p className="text-sm text-slate-500">{method.desc}</p>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMethod === method.id ? 'border-blue-600' : 'border-slate-300'}`}>
                                {selectedMethod === method.id && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                            </div>
                            <input 
                                type="radio" 
                                name="payment" 
                                className="hidden" 
                                checked={selectedMethod === method.id}
                                onChange={() => setSelectedMethod(method.id)}
                            />
                        </label>
                    ))}
                </div>

                {/* Summary Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 h-fit shadow-2xl shadow-slate-200/50 sticky top-10">
                    <div className="flex items-center gap-2 text-blue-600 mb-6">
                        <ShieldCheck size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">PCI-DSS Compliant</span>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between text-slate-500 font-medium">
                            <span>Flight Ticket</span>
                            <span>₹4,500</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                            <span>Convenience Fee</span>
                            <span>₹500</span>
                        </div>
                        <div className="h-px bg-slate-100 my-4" />
                        <div className="flex justify-between text-3xl font-black text-slate-900">
                            <span>Total</span>
                            <span>₹5,000</span>
                        </div>
                    </div>

                    <button 
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                        {loading ? (
                            <><Loader2 className="animate-spin" /> Finalizing Booking...</>
                        ) : (
                            `Confirm & Pay ₹5,000`
                        )}
                    </button>
                    
                    <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-[11px] font-medium">
                        <AlertCircle size={14} />
                        <span>Immediate confirmation after successful transaction.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;