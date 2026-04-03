import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../API/axiosInstance';
import {
  ArrowLeft, Loader2, AlertCircle, Lock,
  Eye, EyeOff, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [processing, setProcessing]       = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [showCVV, setShowCVV]             = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const [formData, setFormData] = useState({
    cardholderName:    '',
    cardNumber:        '',
    expiryDate:        '',
    cvv:               '',
    upiId:             '',
    bankName:          '',
    accountNumber:     '',
    ifscCode:          '',
    accountHolderName: ''
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('currentBooking');
      if (raw) {
        const parsed = JSON.parse(raw);
        setBooking(parsed);
        if (parsed.passengerDetails?.name) {
          setFormData(prev => ({ ...prev, cardholderName: parsed.passengerDetails.name }));
        }
      } else {
        setError('Booking information not found. Please start from search.');
      }
    } catch {
      setError('Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cardNumber') {
      const digits = value.replace(/\D/g, '').substring(0, 16);
      setFormData(prev => ({ ...prev, cardNumber: digits.replace(/(\d{4})(?=\d)/g, '$1 ') }));
    } else if (name === 'expiryDate') {
      const clean = value.replace(/\D/g, '').substring(0, 4);
      setFormData(prev => ({
        ...prev,
        expiryDate: clean.length > 2 ? clean.slice(0, 2) + '/' + clean.slice(2) : clean
      }));
    } else if (name === 'cvv') {
      setFormData(prev => ({ ...prev, cvv: value.replace(/\D/g, '').substring(0, 4) }));
    } else if (name === 'ifscCode') {
      setFormData(prev => ({ ...prev, ifscCode: value.toUpperCase().substring(0, 11) }));
    } else if (name === 'accountNumber') {
      setFormData(prev => ({ ...prev, accountNumber: value.replace(/\D/g, '') }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateCard = () => {
    if (!formData.cardholderName.trim())                       { setError('Please enter cardholder name'); return false; }
    if (formData.cardNumber.replace(/\s/g, '').length !== 16) { setError('Please enter a valid 16-digit card number'); return false; }
    if (formData.expiryDate.length !== 5)                     { setError('Please enter a valid expiry date (MM/YY)'); return false; }
    if (formData.cvv.length < 3)                              { setError('Please enter a valid CVV (3-4 digits)'); return false; }
    return true;
  };

  const validateUPI = () => {
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(formData.upiId.trim())) {
      setError('Please enter a valid UPI ID (e.g., username@bankname)');
      return false;
    }
    return true;
  };

  const validateBank = () => {
    if (!formData.bankName.trim())          { setError('Please select a bank'); return false; }
    if (!formData.accountNumber.trim())     { setError('Please enter your account number'); return false; }
    if (formData.ifscCode.length !== 11)    { setError('Please enter a valid 11-character IFSC code'); return false; }
    if (!formData.accountHolderName.trim()) { setError('Please enter account holder name'); return false; }
    return true;
  };

  const downloadBookingPDF = async (bId) => {
    try {
      const response = await API.get(`/bookings/download/${bId}`, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf, */*' }
      });
      const blob      = new Blob([response.data], { type: 'application/pdf' });
      const objectUrl = window.URL.createObjectURL(blob);
      const link      = document.createElement('a');
      link.href        = objectUrl;
      link.download    = `booking-receipt-${bId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
      toast.success('PDF receipt downloaded!');
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Could not auto-download PDF. Download it from History page.');
    }
  };

  const processPayment = async () => {
    setError('');
    setSuccess('');
    const valid =
      paymentMethod === 'card' ? validateCard() :
      paymentMethod === 'upi'  ? validateUPI()  : validateBank();
    if (!valid) return;
    if (!booking?._id) { setError('Booking ID is missing. Please go back and try again.'); return; }

    setProcessing(true);
    try {
      const intentRes = await API.post('/payments/create-intent', {
        bookingId:      booking._id,
        amount:         booking.flight?.price || 0,
        currency:       'INR',
        paymentMethod,
        description:    `Payment for booking ${booking.bookingReference || booking._id}`,
        paymentDetails: {
          method: paymentMethod,
          ...(paymentMethod === 'card' && {
            cardholderName: formData.cardholderName,
            last4:          formData.cardNumber.replace(/\s/g, '').slice(-4),
            expiryDate:     formData.expiryDate,
          }),
          ...(paymentMethod === 'upi'  && { upiId: formData.upiId }),
          ...(paymentMethod === 'bank' && {
            bankName:          formData.bankName,
            last4:             formData.accountNumber.slice(-4),
            ifscCode:          formData.ifscCode,
            accountHolderName: formData.accountHolderName,
          }),
        },
      });

      if (!intentRes.data?.clientSecret) throw new Error('Payment intent creation failed.');

      const confirmRes = await API.post('/payments/confirm', { bookingId: booking._id });

      if (confirmRes.data?.message) {
        setSuccess(confirmRes.data.message);
        toast.success('Payment confirmed! Booking confirmation email sent.');
        const updatedBooking = { ...booking, paymentStatus: 'Completed' };
        localStorage.setItem('currentBooking', JSON.stringify(updatedBooking));
        localStorage.setItem('paymentInfo', JSON.stringify({
          bookingId: booking._id,
          amount:    booking.flight?.price || 0,
          method:    paymentMethod,
          timestamp: new Date().toISOString(),
          reference: intentRes.data.clientSecret,
        }));
        await downloadBookingPDF(booking._id);
        setTimeout(() => navigate('/'), 2500);
      } else {
        throw new Error('Payment confirmation did not return a success message.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error   ||
        err.message                 ||
        'Please check your payment details and try again.';
      setError('Payment failed. ' + msg);
      toast.error('Payment failed. ' + msg);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 font-semibold mb-6 hover:text-blue-700"
          >
            <ArrowLeft size={18} /> Back to Home
          </button>
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-black text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-600 mb-6">Please complete the booking process first.</p>
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

  const flightPrice = booking.flight?.price || 0;

  // Inline SVG icons avoid the "Icon defined but never used" ESLint error
  const paymentTabs = [
    {
      key: 'card', label: 'Card',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      ),
    },
    {
      key: 'upi', label: 'UPI',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12V22H4V12"/>
          <path d="M22 7H2v5h20V7z"/>
          <path d="M12 22V7"/>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>
      ),
    },
    {
      key: 'bank', label: 'Bank',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="22" x2="21" y2="22"/>
          <line x1="6" y1="18" x2="6" y2="11"/>
          <line x1="10" y1="18" x2="10" y2="11"/>
          <line x1="14" y1="18" x2="14" y2="11"/>
          <line x1="18" y1="18" x2="18" y2="11"/>
          <polygon points="12 2 20 7 4 7"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-6 sm:py-10 px-4">
      <div className="w-full max-w-6xl mx-auto">

        <button
          onClick={() => navigate('/booking/' + booking.flight?._id)}
          className="flex items-center gap-2 text-blue-600 font-semibold mb-6 hover:text-blue-700 transition"
        >
          <ArrowLeft size={18} /> Back to Booking
        </button>

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-green-800 font-semibold text-sm">{success}</p>
              <p className="text-green-700 text-xs mt-1">
                Confirmation email sent &amp; PDF receipt downloaded. Redirecting to home...
              </p>
            </div>
          </div>
        )}

        {/* Two-col on lg+, single col on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">

          {/* LEFT: PAYMENT FORM */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Lock className="text-blue-600" size={24} /> Choose Payment Method
            </h2>

            {error && (
              <div className="mb-5 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-800 font-semibold text-sm">{error}</p>
              </div>
            )}

            {/* Method tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {paymentTabs.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => { setPaymentMethod(key); setError(''); }}
                  className={`py-3 px-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    paymentMethod === key
                      ? 'bg-blue-600 text-white border-2 border-blue-600'
                      : 'bg-gray-100 text-gray-900 border-2 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* CARD FORM */}
            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Cardholder Name</label>
                  <input
                    type="text" name="cardholderName" value={formData.cardholderName}
                    onChange={handleInputChange} placeholder="Enter name on card"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none font-semibold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Card Number</label>
                  <input
                    type="text" name="cardNumber" value={formData.cardNumber}
                    onChange={handleInputChange} placeholder="1234 5678 9012 3456" maxLength="19"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none font-mono text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">16-digit card number</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-2">Expiry Date</label>
                    <input
                      type="text" name="expiryDate" value={formData.expiryDate}
                      onChange={handleInputChange} placeholder="MM/YY" maxLength="5"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none font-mono text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-2">CVV</label>
                    <div className="relative">
                      <input
                        type={showCVV ? 'text' : 'password'} name="cvv" value={formData.cvv}
                        onChange={handleInputChange} placeholder="123" maxLength="4"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none font-mono text-gray-900"
                      />
                      <button
                        type="button" onClick={() => setShowCVV(v => !v)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                      >
                        {showCVV ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800 font-semibold">
                    Test Card: 4242 4242 4242 4242 | Any future date | Any CVV
                  </p>
                </div>
              </div>
            )}

            {/* UPI FORM */}
            {paymentMethod === 'upi' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">UPI ID</label>
                  <input
                    type="text" name="upiId" value={formData.upiId}
                    onChange={handleInputChange} placeholder="username@bankname"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none font-semibold text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: username@bankname (e.g., user@airtel)</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800 font-semibold">
                    Supported: Google Pay, PhonePe, Paytm, WhatsApp Pay, BHIM
                  </p>
                </div>
              </div>
            )}

            {/* BANK FORM */}
            {paymentMethod === 'bank' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Select Bank</label>
                  <select
                    name="bankName" value={formData.bankName} onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none font-semibold text-gray-900"
                  >
                    <option value="">-- Choose a bank --</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option>Axis Bank</option>
                    <option value="Kotak Bank">Kotak Mahindra Bank</option>
                    <option>IDBI Bank</option>
                    <option>YES Bank</option>
                    <option value="BOB">Bank of Baroda (BOB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Account Number</label>
                  <input
                    type="text" name="accountNumber" value={formData.accountNumber}
                    onChange={handleInputChange} placeholder="Enter account number"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none font-semibold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">IFSC Code</label>
                  <input
                    type="text" name="ifscCode" value={formData.ifscCode}
                    onChange={handleInputChange} placeholder="e.g., HDFC0001234" maxLength="11"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none font-mono text-gray-900 uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">11-character code</p>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Account Holder Name</label>
                  <input
                    type="text" name="accountHolderName" value={formData.accountHolderName}
                    onChange={handleInputChange} placeholder="Enter account holder name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none font-semibold text-gray-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="space-y-5 sm:space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-8">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-5 sm:mb-6 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={24} /> Booking Summary
              </h3>
              <div className="space-y-3">
                {[
                  ['Booking Reference', booking.bookingReference || booking._id?.slice(-8).toUpperCase()],
                  ['Passenger Name',    booking.passengerDetails?.name  || 'N/A'],
                  ['Email',             booking.passengerDetails?.email || 'N/A'],
                  ['Seat Preference',   booking.seatPreference          || 'N/A'],
                  ...(booking.passengers  ? [['Passengers', booking.passengers]]    : []),
                  ...(booking.bookingClass ? [['Class', booking.bookingClass]]       : []),
                  ...(booking.flight ? [
                    ['Flight', `${booking.flight.airline} (${booking.flight.flightNumber})`],
                    ['Route',  `${booking.flight.departureLocation} → ${booking.flight.arrivalLocation}`],
                  ] : []),
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-start pb-3 border-b border-gray-100 gap-2">
                    <span className="text-sm font-semibold text-gray-600 shrink-0">{label}</span>
                    <span className="text-sm font-black text-gray-900 text-right break-all">{val}</span>
                  </div>
                ))}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-lg font-black text-gray-900">Total Amount</span>
                    <span className="text-2xl sm:text-3xl font-black text-blue-600">
                      ₹{flightPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-semibold mt-2">Price per person for flight booking</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border-2 border-green-200 p-5 sm:p-8">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="text-green-600" size={24} /> Payment Confirmation
              </h3>
              <div className="space-y-2 sm:space-y-3 mb-5 sm:mb-6">
                {[
                  'Secure SSL encrypted connection',
                  'PCI DSS compliant payment processing',
                  'Money-back guarantee if booking cancels',
                  '24/7 customer support available',
                  'PDF receipt auto-downloaded after payment',
                  'Booking confirmation email sent instantly',
                ].map(t => (
                  <div key={t} className="flex items-start sm:items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0 mt-1 sm:mt-0" />
                    <span className="text-gray-700 font-semibold">{t}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={processPayment}
                disabled={processing || !!success}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-lg transition-all flex items-center justify-center gap-2 text-base sm:text-lg"
              >
                {processing ? (
                  <><Loader2 className="animate-spin" size={20} /><span>Processing Payment...</span></>
                ) : success ? (
                  <><CheckCircle size={20} /><span>Payment Successful!</span></>
                ) : (
                  <><Lock size={20} /><span>Confirm &amp; Pay ₹{flightPrice.toLocaleString('en-IN')}</span></>
                )}
              </button>
              <p className="text-xs text-center text-gray-600 font-semibold mt-4">
                By confirming, you agree to our Terms &amp; Conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;