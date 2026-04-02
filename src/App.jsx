import React, { useState } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Components/Header';
import Footer from './Components/Footer';
import LoginPage from './Pages/LoginPage'; 
import AdminHistory from './Pages/AdminHistory'; // Import new
import ManageBookings from './Pages/ManageBookings'; // Import new

const Layout = ({ isAuthenticated, setIsAuthenticated, userName, setUserName }) => (
  <div className="min-h-screen flex flex-col">
    <Header 
      isAuthenticated={isAuthenticated} 
      setIsAuthenticated={setIsAuthenticated} 
      userName={userName} 
      setUserName={setUserName} 
    />
    {/* Removed items-center justify-center to allow full-page tables */}
    <main className="flex-grow bg-gray-50 flex justify-center">
      <Outlet context={{ setIsAuthenticated, setUserName }} />
    </main>
    <Footer />
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("userToken"));
  const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "");

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
        { path: "/", element: <div className="mt-20"><h1 className="text-4xl font-black text-gray-900">Welcome to App</h1></div> },
        { 
          path: "/login", 
          element: <LoginPage setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} /> 
        },
        // NEW ROUTES ADDED HERE
        { path: "/admin/history", element: <AdminHistory /> },
        { path: "/admin/manage", element: <ManageBookings /> }
      ]
    }
  ]);

  return (
    <>
      <Toaster position="top-center" />
      <RouterProvider router={router} />
    </>
  );
}

export default App;