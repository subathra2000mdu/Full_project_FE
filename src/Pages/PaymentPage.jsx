import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../API/axiosInstance';
import { 
  ArrowLeft, Loader2, CheckCircle, AlertCircle, Lock, 
  CreditCard, Wallet, Building2, Eye, EyeOff 
} from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCVV, setShowCVV] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [formData, setFormData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  // Fetch booking details from localStorage
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const currentBooking = localStorage.getItem('currentBooking');
        if (currentBooking) {
          const parsedBooking = JSON.parse(currentBooking);
          setBooking(parsedBooking);
          if (parsedBooking.passengerDetails?.name) {
            setFormData(prev => ({
              ...prev,
              cardholderName: parsedBooking.passengerDetails.name
            }));
          }
        } else {
          setError('Booking information not found. Please start from search.');
        }
      } catch (err) {
        console.error('Error loading booking:', err);
        setError('Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'cardNumber') {
      const digits = value.replace(/\D/g, '').substring(0, 16);
      const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'expiryDate') {
      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/, '$1/').substring(0, 5);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'cvv') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').substring(0, 4) }));
    } else if (name === 'ifscCode') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase().substring(0, 11) }));
    } else if (name === 'accountNumber') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '') }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateCardPayment = () => {
    if (!formData.cardholderName.trim()) {
      setError('Please enter cardholder name');
      return false;
    }
    const rawCard = formData.cardNumber.replace(/\s/g, '');
    if (rawCard.length !== 16) {
      setError('Please enter a valid 16-digit card number');
      return false;
    }
    if (!formData.expiryDate || formData.expiryDate.length !== 5) {
      setError('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    if (!formData.cvv || formData.cvv.length < 3) {
      setError('Please enter a valid CVV (3–4 digits)');
      return false;
    }
    return true;
  };

  const validateUPIPayment = () => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
    if (!formData.upiId.trim() || !upiRegex.test(formData.upiId)) {
      setError('Please enter a valid UPI ID (e.g., username@bankname)');
      return false;
    }
    return true;
  };

  const validateBankTransfer = () => {
    if (!formData.bankName.trim()) {
      setError('Please select a bank');
      return false;
    }
    if (!formData.accountNumber.trim()) {
      setError('Please enter your account number');
      return false;
    }
    if (formData.ifscCode.length !== 11) {
      setError('Please enter a valid 11-character IFSC code');
      return false;
    }
    if (!formData.accountHolderName.trim()) {
      setError('Please enter account holder name');
      return false;
    }
    return true;
  };

  const processPayment = async () => {
    setError('');
    setSuccess('');

    // Validate
    let isValid = false;
    if (paymentMethod === 'card') isValid = validateCardPayment();
    else if (paymentMethod === 'upi') isValid = validateUPIPayment();
    else if (paymentMethod === 'bank') isValid = validateBankTransfer();

    if (!isValid) return;

    if (!booking?._id) {
      setError('Booking ID is missing. Please go back and try again.');
      return;
    }

    setProcessing(true);

    try {
      // ── STEP 1: Create Payment Intent ──────────────────────────────────────
      const intentPayload = {
        bookingId: booking._id,
        amount: booking.flight?.price || 0,
        currency: 'INR',
        paymentMethod: paymentMethod,
        description: `Payment for booking ${booking.bookingReference || booking._id}`,
        paymentDetails: {
          method: paymentMethod,
          ...(paymentMethod === 'card' && {
            cardholderName: formData.cardholderName,
            last4: formData.cardNumber.replace(/\s/g, '').slice(-4),
            expiryDate: formData.expiryDate
          }),
          ...(paymentMethod === 'upi' && {
            upiId: formData.upiId
          }),
          ...(paymentMethod === 'bank' && {
            bankName: formData.bankName,
            last4: formData.accountNumber.slice(-4),
            ifscCode: formData.ifscCode,
            accountHolderName: formData.accountHolderName
          })
        }
      };

      console.log('Step 1 – Creating payment intent:', intentPayload);
      const intentResponse = await API.post('/payments/create-intent', intentPayload);
      console.log('Intent response:', intentResponse.data);

      if (!intentResponse.data?.clientSecret) {
        throw new Error('Payment intent creation failed. No client secret returned.');
      }

      // ── STEP 2: Confirm Payment (updates DB + sends email) ─────────────────
      const confirmPayload = {
        bookingId: booking._id
      };

      console.log('Step 2 – Confirming payment:', confirmPayload);
      const confirmResponse = await API.post('/payments/confirm', confirmPayload);
      console.log('Confirm response:', confirmResponse.data);

      if (confirmResponse.data?.message) {
        setSuccess(confirmResponse.data.message);
        toast.success('Payment confirmed! Booking email sent.');

        // Store payment info locally
        localStorage.setItem('paymentInfo', JSON.stringify({
          bookingId: booking._id,
          amount: booking.flight?.price || 0,
          method: paymentMethod,
          timestamp: new Date().toISOString(),
          reference: intentResponse.data.clientSecret
        }));

        // Clear current booking from storage
        localStorage.removeItem('currentBooking');

        // Redirect after short delay
        setTimeout(() => {
          navigate('/manage');
        }, 2500);
      } else {
        throw new Error('Payment confirmation did not return a success message.');
      }
    } catch (err) {
      console.error('Payment error:', err);

      let errorMessage = 'Payment failed. ';
      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please check your payment details and try again.';
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  // ── No booking found ───────────────────────────────────────────────────────
  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="max-w-4xl mx-auto">
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

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => navigate('/booking/' + booking.flight?._id)}
          className="flex items-center gap-2 text-blue-600 font-semibold mb-6 hover:text-blue-700 transition"
        >
          <ArrowLeft size={18} /> Back to Booking
        </button>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <div className="flex gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-green-800 font-semibold text-sm sm:text-base">{success}</p>
                <p className="text-green-700 text-xs mt-1">
                  A confirmation email has been sent. Redirecting to your bookings…
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT: PAYMENT FORM ── */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Lock className="text-blue-600" size={24} />
              Choose Payment Method
            </h2>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-800 font-semibold text-sm sm:text-base">{error}</p>
                </div>
              </div>
            )}

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
              {[
                { key: 'card', label: 'Card', Icon: CreditCard },
                { key: 'upi',  label: 'UPI',  Icon: Wallet },
                { key: 'bank', label: 'Bank', Icon: Building2 }
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => { setPaymentMethod(key); setError(''); }}
                  className={`py-3 px-2 sm:px-4 rounded-lg font-bold text-xs sm:text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    paymentMethod === key
                      ? 'bg-blue-600 text-white border-2 border-blue-600'
                      : 'bg-gray-100 text-gray-900 border-2 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            {/* ── CARD FORM ── */}
            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Cardholder Name</label>
                  <input
                    type="text"
                    name="cardholderName"
                    value={formData.cardholderName}
                    onChange={handleInputChange}
                    placeholder="Enter name on card"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition font-semibold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition font-mono text-gray-900"
                  />
                  <p className="text-xs text-gray-500 font-semibold mt-1">16-digit card number</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-2">Expiry Date</label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                      maxLength="5"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition font-mono text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-2">CVV</label>
                    <div className="relative">
                      <input
                        type={showCVV ? 'text' : 'password'}
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        maxLength="4"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition font-mono text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCVV(!showCVV)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                      >
                        {showCVV ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800 font-semibold">
                    💳 Test Card: 4242 4242 4242 4242 | Any future date | Any CVV
                  </p>
                </div>
              </div>
            )}

            {/* ── UPI FORM ── */}
            {paymentMethod === 'upi' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">UPI ID</label>
                  <input
                    type="text"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                    placeholder="username@bankname"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition font-semibold text-gray-900"
                  />
                  <p className="text-xs text-gray-500 font-semibold mt-1">
                    Format: username@bankname (e.g., user@airtel)
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800 font-semibold">
                    📱 Supported: Google Pay, PhonePe, Paytm, WhatsApp Pay, BHIM
                  </p>
                </div>
              </div>
            )}

            {/* ── BANK TRANSFER FORM ── */}
            {paymentMethod === 'bank' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Select Bank</label>
                  <select
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition font-semibold text-gray-900"
                  >
                    <option value="">-- Choose a bank --</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Bank">Kotak Mahindra Bank</option>
                    <option value="IDBI Bank">IDBI Bank</option>
                    <option value="YES Bank">YES Bank</option>
                    <option value="BOB">Bank of Baroda (BOB)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Enter account number"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition font-semibold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">IFSC Code</label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    placeholder="e.g., HDFC0001234"
                    maxLength="11"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition font-mono text-gray-900 uppercase"
                  />
                  <p className="text-xs text-gray-500 font-semibold mt-1">11-character code</p>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Account Holder Name</label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    placeholder="Enter account holder name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition font-semibold text-gray-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: ORDER SUMMARY ── */}
          <div className="space-y-6">

            {/* Booking Summary */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={24} />
                Booking Summary
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-600">Booking Reference</span>
                  <span className="text-base font-black text-gray-900 text-right">
                    {booking.bookingReference || booking._id?.slice(-8).toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-600">Passenger Name</span>
                  <span className="text-base font-black text-gray-900 text-right">
                    {booking.passengerDetails?.name || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-600">Email</span>
                  <span className="text-base font-black text-gray-900 text-right break-all">
                    {booking.passengerDetails?.email || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-600">Seat Preference</span>
                  <span className="text-base font-black text-gray-900 text-right">
                    {booking.seatPreference || 'N/A'}
                  </span>
                </div>

                {booking.flight && (
                  <>
                    <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-600">Flight</span>
                      <span className="text-base font-black text-gray-900 text-right">
                        {booking.flight.airline} ({booking.flight.flightNumber})
                      </span>
                    </div>

                    <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-600">Route</span>
                      <span className="text-base font-black text-gray-900 text-right">
                        {booking.flight.departureLocation} → {booking.flight.arrivalLocation}
                      </span>
                    </div>
                  </>
                )}

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black text-gray-900">Total Amount</span>
                    <span className="text-3xl font-black text-blue-600">
                      ₹{flightPrice?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-semibold mt-2">
                    Price per person for flight booking
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Confirmation Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl shadow-lg border-2 border-green-200 p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="text-green-600" size={24} />
                Payment Confirmation
              </h3>

              <div className="space-y-3 mb-6">
                {[
                  'Secure SSL encrypted connection',
                  'PCI DSS compliant payment processing',
                  'Money-back guarantee if booking cancels',
                  '24/7 customer support available'
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-700 font-semibold">{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={processPayment}
                disabled={processing || !!success}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-base sm:text-lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Processing Payment…</span>
                  </>
                ) : success ? (
                  <>
                    <CheckCircle size={20} />
                    <span>Payment Successful!</span>
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    <span>Confirm & Pay ₹{flightPrice?.toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-600 font-semibold mt-4">
                By confirming, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;