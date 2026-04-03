import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Components/Header';
import Footer from './Components/Footer';
import LoginPage from './Pages/LoginPage'; 
import HomePage from './Pages/HomePage'; 
import AdminHistory from './Pages/AdminHistory';
import ManageBookings from './Pages/ManageBookings';
import BookingPage from './Pages/BookingPage';
import PaymentPage from './Pages/PaymentPage';
import AnalyticsDashboard from './Pages/Analyticsdashboard';

const Layout = ({ isAuthenticated, setIsAuthenticated, userName, setUserName }) => (
  <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-blue-100">
    <Header 
      isAuthenticated={isAuthenticated} 
      setIsAuthenticated={setIsAuthenticated} 
      userName={userName} 
      setUserName={setUserName} 
    />
    <main className="flex-grow w-full">
      <Outlet context={{ setIsAuthenticated, setUserName, isAuthenticated, userName }} />
    </main>
    <Footer />
  </div>
);

function App() {
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
        { path: "/analytics", element: <AnalyticsDashboard /> },
        { 
          path: "/login", 
          element: <LoginPage setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} /> 
        },
        { path: "/booking/:flightId", element: <BookingPage /> },
        { path: "/payment/:bookingId", element: <PaymentPage /> },
        { path: "/admin/history", element: <AdminHistory /> },
        { path: "/manage", element: <ManageBookings /> }
      ]
    }
  ]);

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { 
            background: '#fff', 
            color: '#334155', 
            fontWeight: '600',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          },
        }}
      />
      <RouterProvider router={router} />
    </>
  );
}

export default App;