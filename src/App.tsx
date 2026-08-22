import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react'
import { supabase } from './supabaseClient'
import Checkout from './Checkout.tsx';
import Admin from './Admin.tsx';
import Login from './Login.tsx';

function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    // Check if user is remembered in localStorage or sessionStorage
    return localStorage.getItem('admin_remember') === 'true' || sessionStorage.getItem('admin_remember') === 'true';
  })

  // Logout Function
  const handleLogout = () => {
    localStorage.removeItem('admin_remember')
    sessionStorage.removeItem('admin_remember')
    supabase.auth.signOut()
    setIsAdminLoggedIn(false)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Checkout />} />
        <Route 
          path="/admin" 
          element={
            isAdminLoggedIn ? (
              <Admin onLogout={handleLogout} />
            ) : (
              <Login onLogin={() => setIsAdminLoggedIn(true)} />
            )
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
