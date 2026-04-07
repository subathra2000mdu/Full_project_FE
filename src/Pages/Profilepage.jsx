// Pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import API from '../API/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Settings, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const [form, setForm] = useState({
    name: '', email: '',
    currentPassword: '', newPassword: '', confirmPassword: '',
    seatPreference: 'Window', bookingClass: 'Economy',
  });

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); return; }

    API.get('/auth/profile')
      .then(res => {
        const u = res.data;
        setProfile(u);
        setForm(prev => ({
          ...prev,
          name:           u.name  || '',
          email:          u.email || '',
          seatPreference: u.preferences?.seatPreference || 'Window',
          bookingClass:   u.preferences?.bookingClass   || 'Economy',
        }));
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSave = async () => {
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match'); return;
    }
    setSaving(true);
    try {
      const payload = {
        name:  form.name,
        email: form.email,
        preferences: { seatPreference: form.seatPreference, bookingClass: form.bookingClass },
      };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword     = form.newPassword;
      }
      const res = await API.put('/auth/profile', payload);
      setProfile(res.data.user);
      toast.success('Profile updated successfully!');
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-20">
      <Loader2 className="animate-spin text-blue-600" size={36} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold text-sm mb-6">
          <ArrowLeft size={16} /> Back to Search
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-black">
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{profile?.name}</h1>
            <p className="text-slate-500 text-sm font-semibold">{profile?.email}</p>
            <span className="text-xs font-black px-3 py-1 bg-blue-50 text-blue-600 rounded-full mt-1 inline-block">
              {profile?.role === 'admin' ? 'Admin' : 'Member'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit mb-6">
          {[
            { key: 'info',   label: 'Personal Info', icon: <User size={14}/> },
            { key: 'prefs',  label: 'Preferences',   icon: <Settings size={14}/> },
            { key: 'pass',   label: 'Password',       icon: <Lock size={14}/> },
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-all ${
                activeTab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {icon} {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">

          {/* Personal Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-slate-900 mb-4">Personal Information</h2>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-slate-400" size={16} />
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-400" size={16} />
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold" />
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'prefs' && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-slate-900 mb-4">Travel Preferences</h2>
              <p className="text-slate-500 text-sm">These will auto-fill your booking form.</p>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Default Seat Preference</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Window', 'Aisle', 'Middle'].map(s => (
                    <button key={s} onClick={() => setForm({...form, seatPreference: s})}
                      className={`py-3 rounded-xl text-sm font-black border-2 transition-all ${
                        form.seatPreference === s ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-700 hover:border-blue-400'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Default Booking Class</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Economy', 'Business', 'First Class'].map(c => (
                    <button key={c} onClick={() => setForm({...form, bookingClass: c})}
                      className={`py-3 rounded-xl text-sm font-black border-2 transition-all ${
                        form.bookingClass === c ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-700 hover:border-blue-400'
                      }`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'pass' && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-slate-900 mb-4">Change Password</h2>
              {[
                { label: 'Current Password', key: 'currentPassword', placeholder: 'Enter current password' },
                { label: 'New Password',     key: 'newPassword',     placeholder: 'Enter new password' },
                { label: 'Confirm Password', key: 'confirmPassword', placeholder: 'Confirm new password' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-slate-400" size={16} />
                    <input type="password" value={form[key]} placeholder={placeholder}
                      onChange={e => setForm({...form, [key]: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-semibold" />
                  </div>
                </div>
              ))}
              {form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword && (
                <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
                  <AlertCircle size={14} /> Passwords do not match
                </div>
              )}
            </div>
          )}

          {/* Save button — all tabs */}
          <button onClick={handleSave} disabled={saving}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;