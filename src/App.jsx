import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Components/Header';
import Footer from './Components/Footer';
import LoginPage from './Pages/LoginPage'; 
import HomePage from './Pages/HomePage'; 
import AdminHistory from './Pages/AdminHistory';
import ManageBookings from './Pages/ManageBookings'; // Ensure this file exists
import PaymentPage from './Pages/PaymentPage';     // Ensure this is .jsx
import BookingPage from './Pages/BookingPage';     // Ensure this is .jsx

const Layout = ({ isAuthenticated, setIsAuthenticated, userName, setUserName }) => (
  <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-blue-100">
    <Header 
      isAuthenticated={isAuthenticated} 
      setIsAuthenticated={setIsAuthenticated} 
      userName={userName} 
      setUserName={setUserName} 
    />
    <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Outlet context={{ setIsAuthenticated, setUserName, isAuthenticated, userName }} />
    </main>
    <Footer />
  </div>
);

function App() {
  // Initialization pattern below prevents the "cascading render" warning
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("userToken"));
  const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "");

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem("userToken"));
      setUserName(localStorage.getItem("userName") || "");
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <Layout 
          isAuthenticated={isAuthenticated} 
          setIsAuthenticated={setIsAuthenticated} 
          userName={userName} 
          setUserName={setUserName} 
        />
      ),
      children: [
        { path: "/", element: <HomePage /> },
        { 
          path: "/login", 
          element: <LoginPage setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} /> 
        },
        { path: "/history", element: <AdminHistory /> },
        { path: "/manage", element: <ManageBookings /> }, // Re-added to prevent 404
        { path: "/booking/:flightId", element: <BookingPage /> },
        { path: "/payment/:bookingId", element: <PaymentPage /> }
      ]
    }
  ]);

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: '#fff', color: '#334155', fontWeight: '600' },
        }}
      />
      <RouterProvider router={router} />
    </>
  );
}

export default App;