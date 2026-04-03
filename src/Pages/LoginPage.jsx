import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../API/axiosInstance'; 
import toast from 'react-hot-toast'; 

const LoginPage = ({ setIsAuthenticated, setUserName }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    if (!formData.email.toLowerCase().endsWith('@gmail.com')) {
      toast.error("Only @gmail.com addresses are allowed.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isRegistering ? "/register" : "/login";
      const payload = isRegistering 
        ? formData 
        : { email: formData.email, password: formData.password };

      const response = await API.post(endpoint, payload);
      const data = response.data;

      if (isRegistering) {
        toast.success("Account created! Please sign in.");
        setIsRegistering(false);
      } else {
        
        const finalName = data.user?.name || formData.email.split('@')[0];
        
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userName', finalName);
        
        setUserName(finalName);
        setIsAuthenticated(true);
        toast.success(`Welcome back, ${finalName}!`);
        navigate('/'); 
      }
    } catch (err) {
      
      const errMsg = err.response?.data?.message || "Incorrect email or password";
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          {isRegistering ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          {isRegistering ? "Join our secure platform" : "Enter your credentials to sign in"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <input 
              type="text" 
              name="name" 
              placeholder="Full Name" 
              required 
              onChange={handleChange} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" 
            />
          )}
          <input 
            type="email" 
            name="email" 
            placeholder="name@gmail.com" 
            required 
            onChange={handleChange} 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" 
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            required 
            onChange={handleChange} 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" 
          />
          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:bg-blue-300"
          >
            {isLoading ? "Checking..." : isRegistering ? "Register" : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          {isRegistering ? "Already have an account?" : "Don't have an account?"} 
          <span 
            onClick={() => setIsRegistering(!isRegistering)} 
            className="text-blue-600 cursor-pointer font-bold ml-1 hover:underline"
          >
            {isRegistering ? "Login" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;