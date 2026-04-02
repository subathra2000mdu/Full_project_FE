import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Components/Header';
import Footer from './Components/Footer';
import LoginPage from './Pages/LoginPage'; 
import HomePage from './Pages/HomePage'; 
import AdminHistory from './Pages/AdminHistory';
import ManageBookings from './Pages/ManageBookings';

// Refined Layout with mild background and responsive container
const Layout = ({ isAuthenticated, setIsAuthenticated, userName, setUserName }) => (
  <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-blue-100">
    <Header 
      isAuthenticated={isAuthenticated} 
      setIsAuthenticated={setIsAuthenticated} 
      userName={userName} 
      setUserName={setUserName} 
    />
    {/* Centered container with max-width to prevent "messy" stretching on big screens */}
    <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Outlet context={{ setIsAuthenticated, setUserName, isAuthenticated, userName }} />
    </main>
    <Footer />
  </div>
);

function App() {
  // Initialize state from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("userToken"));
  const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "");

  // Update state if localStorage changes (optional but good for consistency)
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const storedName = localStorage.getItem("userName");
    setIsAuthenticated(!!token);
    setUserName(storedName || "");
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
        { 
          path: "/", 
          element: <HomePage /> 
        },
        { 
          path: "/login", 
          element: (
            <LoginPage 
              setIsAuthenticated={setIsAuthenticated} 
              setUserName={setUserName} 
            />
          ) 
        },
        { 
          path: "/history", 
          element: <AdminHistory /> 
        },
        { 
          path: "/manage", 
          element: <ManageBookings /> 
        }
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
          },
        }}
      />
      <RouterProvider router={router} />
    </>
  );
}

export default App;