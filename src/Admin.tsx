// Admin.tsx (Updated)
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// Import components
import AdminDashboard from './components/AdminDashboard';
import AdminOrders from './components/AdminOrders';
// ... (baaki components import karo)

const Admin = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  // Shared states yahi rahenge
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  // ... baaki states

  // Fetch functions (same as before)
  // ...

  // Tab switching functions
  const handleStatusChange = async (orderId: string, status: string) => { ... };
  const assignDeliveryBoy = async (orderId: string, boyId: string) => { ... };
  const deleteOrder = async (orderId: string) => { ... };
  const printReceipt = (orderId: string, format: string) => { ... };

  const tabs = [ ... ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa', color: '#111111', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <h2>FYNTAS Admin</h2>
        {tabs.map(tab => (
          <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span>{tab.icon}</span> {tab.label}
          </div>
        ))}
        <div onClick={onLogout}>Logout</div>
      </div>

      <div className="content">
        {activeTab === 'dashboard' && <AdminDashboard orders={orders} customers={customers} products={products} deliveryBoys={deliveryBoys} />}
        {activeTab === 'orders' && <AdminOrders orders={orders} deliveryBoys={deliveryBoys} assignDeliveryBoy={assignDeliveryBoy} handleStatusChange={handleStatusChange} deleteOrder={deleteOrder} printReceipt={printReceipt} />}
        {activeTab === 'products' && <AdminProducts ... />}
        {activeTab === 'categories' && <AdminCategories ... />}
        {activeTab === 'customers' && <AdminCustomers ... />}
        {activeTab === 'delivery' && <AdminDeliveryBoys ... />}
        {activeTab === 'branches' && <AdminBranches ... />}
        {activeTab === 'charges' && <AdminCharges ... />}
        {activeTab === 'banners' && <AdminBanners ... />}
        {activeTab === 'invoice_settings' && <AdminInvoiceSettings ... />}
        {activeTab === 'profile' && <AdminProfile ... />}
        {activeTab === 'policies' && <AdminPolicies ... />}
        {activeTab === 'content' && <AdminContent ... />}
      </div>

      {/* Modals jo global hain (jaise Branch, Delivery Boy, Product) */}
    </div>
  );
};

export default Admin;
