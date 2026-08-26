import { useState } from 'react';
import AdminDashboard from './components/AdminDashboard';
import AdminOrders from './components/AdminOrders';
import AdminProducts from './components/AdminProducts';
import AdminCategories from './components/AdminCategories';
import AdminCustomers from './components/AdminCustomers';
import AdminDeliveryBoys from './components/AdminDeliveryBoys';
import AdminBranches from './components/AdminBranches';
import AdminCharges from './components/AdminCharges';
import AdminBanners from './components/AdminBanners';
import AdminInvoiceSettings from './components/AdminInvoiceSettings';
import AdminProfile from './components/AdminProfile';
import AdminPolicies from './components/AdminPolicies';
import AdminContent from './components/AdminContent';

const Admin = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'products', label: 'Products', icon: '📁' },
    { id: 'categories', label: 'Categories', icon: '🗂️' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'delivery', label: 'Delivery Boys', icon: '🛵' },
    { id: 'branches', label: 'Branches', icon: '🏬' },
    { id: 'charges', label: 'Delivery Charges', icon: '💰' },
    { id: 'banners', label: 'Banners', icon: '🖼️' },
    { id: 'invoice_settings', label: 'Invoice Settings', icon: '🧾' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'policies', label: 'Policies', icon: '📜' },
    { id: 'content', label: 'App Content', icon: '📝' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa', color: '#111111', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .sidebar { width: 250px; background: #ffffff; border-right: 1px solid #f3f4f6; padding: 20px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 12px; cursor: pointer; border-radius: 8px; margin-bottom: 5px; color: #6b7280; }
        .nav-item:hover { background: #f3f4f6; color: #111111; }
        .nav-item.active { background: #111111; color: #ffffff; }
        .content { flex: 1; padding: 20px; }
      `}</style>

      <div className="sidebar">
        <h2 style={{ marginBottom: '30px', color: '#111111' }}>FYNTAS Admin</h2>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span> {tab.label}
          </div>
        ))}
        <div className="nav-item" style={{ marginTop: '30px' }} onClick={onLogout}>🚪 Logout</div>
      </div>

      <div className="content">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'orders' && <AdminOrders />}
        {activeTab === 'products' && <AdminProducts />}
        {activeTab === 'categories' && <AdminCategories />}
        {activeTab === 'customers' && <AdminCustomers />}
        {activeTab === 'delivery' && <AdminDeliveryBoys />}
        {activeTab === 'branches' && <AdminBranches />}
        {activeTab === 'charges' && <AdminCharges />}
        {activeTab === 'banners' && <AdminBanners />}
        {activeTab === 'invoice_settings' && <AdminInvoiceSettings />}
        {activeTab === 'profile' && <AdminProfile />}
        {activeTab === 'policies' && <AdminPolicies />}
        {activeTab === 'content' && <AdminContent />}
      </div>
    </div>
  );
};

export default Admin;
