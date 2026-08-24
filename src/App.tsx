import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Admin from './Admin.tsx';
import CustomerLayout from './CustomerLayout.tsx';
import DeliveryBoyDashboard from './pages/DeliveryBoyDashboard';
// ✅ Naya Invoice Print Page Import karo
import InvoicePrint from './pages/InvoicePrint';

function App() {
  const handleLogout = () => {
    localStorage.removeItem('admin_remember');
    sessionStorage.removeItem('admin_remember');
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<CustomerLayout />} />
        <Route path="/admin" element={<Admin onLogout={handleLogout} />} />
        <Route path="/delivery-boy" element={<DeliveryBoyDashboard />} />
        
        {/* ✅ Invoice Print Route Add kiya */}
        <Route path="/invoice/:id" element={<InvoicePrint />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
