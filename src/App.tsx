import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Admin from './Admin.tsx';
import CustomerLayout from './CustomerLayout.tsx';
// ✅ Delivery Boy Dashboard import kiya
import DeliveryBoyDashboard from './pages/DeliveryBoyDashboard';

function App() {
  // Logout function - Admin ke logout button ke liye
  const handleLogout = () => {
    localStorage.removeItem('admin_remember');
    sessionStorage.removeItem('admin_remember');
    // Redirect to home page
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Customer App */}
        <Route path="/*" element={<CustomerLayout />} />
        
        {/* Admin Panel (Logout prop pass kiya) */}
        <Route path="/admin" element={<Admin onLogout={handleLogout} />} />

        {/* ✅ Delivery Boy Dashboard (Naya Route) */}
        <Route path="/delivery-boy" element={<DeliveryBoyDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
