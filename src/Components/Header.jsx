import React from 'react';
import { Link, useNavigate } from "react-router-dom";

const Header = ({ isAuthenticated, setIsAuthenticated, userName, setUserName }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    setIsAuthenticated(false);
    if (typeof setUserName === 'function') {
      setUserName(""); 
    }
    navigate("/");
  };

  return (
    <header className="w-full py-6 px-10 bg-white shadow-sm flex justify-between items-center border-b sticky top-0 z-50">
      <div className="text-2xl font-black text-blue-600 tracking-tighter">
        <Link to="/">APP.LOGO</Link>
      </div>
      <nav className="flex items-center space-x-8 font-bold text-gray-500 text-sm">
        <Link to="/" className="hover:text-blue-600 transition">Home</Link>
        
        {/* ADDED ADMIN LINKS */}
        <Link to="/admin/history" className="hover:text-blue-600 transition">History</Link>
        <Link to="/admin/manage" className="hover:text-blue-600 transition">Manage</Link>

        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <span className="text-xs font-black text-gray-400 bg-gray-50 px-4 py-2 rounded-full uppercase tracking-widest">
              Hi, {userName || "User"}
            </span>
            <button onClick={handleLogout} className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-100">
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100">Login</Link>
        )}
      </nav>
    </header>
  );
};

export default Header;