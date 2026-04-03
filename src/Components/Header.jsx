import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from 'lucide-react';

const Header = ({ isAuthenticated, setIsAuthenticated, userName, setUserName }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    setIsAuthenticated(false);
    if (typeof setUserName === 'function') setUserName("");
    navigate("/");
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="w-full bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              onClick={closeMenu}
              className="text-xl sm:text-2xl font-black text-blue-600 tracking-tighter leading-tight"
            >
              Flight<br className="hidden xs:block sm:hidden" />
              <span className="sm:inline"> Booking</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6 font-bold text-gray-500 text-sm">
            <Link to="/" className="hover:text-blue-600 transition">Home</Link>
            <Link to="/admin/history" className="hover:text-blue-600 transition">History</Link>
            <Link to="/analytics" className="hover:text-blue-600 transition">Analytics</Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-xs font-black text-gray-400 bg-gray-50 px-3 py-2 rounded-full uppercase tracking-widest whitespace-nowrap">
                  Hi, {userName || "User"}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-100 whitespace-nowrap text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 text-sm"
              >
                Login
              </Link>
            )}
          </nav>

          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <span className="text-xs font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-full uppercase tracking-widest">
                Hi, {(userName || "User").split(' ')[0]}
              </span>
            )}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col space-y-1">
            <Link
              to="/"
              onClick={closeMenu}
              className="px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition text-sm"
            >
              Home
            </Link>
            <Link
              to="/admin/history"
              onClick={closeMenu}
              className="px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition text-sm"
            >
              History
            </Link>
            <Link
              to="/analytics"
              onClick={closeMenu}
              className="px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition text-sm"
            >
              Analytics
            </Link>

            <div className="pt-2 border-t border-gray-100">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-black text-sm"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-black text-sm"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;