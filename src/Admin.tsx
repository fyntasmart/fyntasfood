import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// Import all components
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

// Interfaces (optional, aap apne purane se le sakte ho)
// ...

const Admin = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  // Saare states yahi rahenge
  const [branches, setBranches] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [appPages, setAppPages] = useState<any[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<any>({ id: '', welcome_note: '', terms: '', footer: '' });
  const [notification, setNotification] = useState('');

  const fetchData = async () => {
    // ... (same as old, fetch all data)
  };

  useEffect(() => {
    fetchData();
    // Realtime subscription
    const channel = supabase.channel('orders-realtime').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
      setNotification(`Order ${payload.new.id.slice(0, 6)} status updated to ${payload.new.status}`);
      fetchData();
      setTimeout(() => setNotification(''), 3000);
    }).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // Upload Image function
  const uploadImage = async (file: File) => {
    const path = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) return '';
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  // Order Management functions (status change, delete, print, assign) – same as before
  // ...

  // Export Customers function
  const exportCustomers = () => {
    const header = ["Name", "Mobile Number"];
    const rows = customers.map(c => [c.name || 'Unknown', c.mobile]);
    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customers_list.csv");
    document.body.appendChild(link);
    link.click();
  };

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
      {/* Notification Toast */}
      {notification && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#111', color: '#fff', padding: '15px 20px', borderRadius: '8px', zIndex: 1000, fontWeight: 'bold' }}>
          🔔 {notification}
        </div>
      )}
      {/* CSS (same as old) */}
      <style>{`
        .sidebar { ... }
        .content { ... }
        .panel { ... }
        .menu-wrapper { position: relative; display: inline-block; }
        .dots-menu.show { display: block; }
        /* ... baaki CSS ... */
      `}</style>

      {/* Sidebar */}
      <div className="sidebar">
        <h2>FYNTAS Admin</h2>
        {tabs.map(tab => (
          <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span>{tab.icon}</span> {tab.label}
          </div>
        ))}
        <div className="nav-item" onClick={onLogout}>Logout</div>
      </div>

      {/* Content */}
      <div className="content">
        {activeTab === 'dashboard' && <AdminDashboard orders={orders} customers={customers} products={products} deliveryBoys={deliveryBoys} />}
        {activeTab === 'orders' && <AdminOrders orders={orders} deliveryBoys={deliveryBoys} assignDeliveryBoy={assignDeliveryBoy} handleStatusChange={handleStatusChange} deleteOrder={deleteOrder} printReceipt={printReceipt} />}
        {activeTab === 'products' && <AdminProducts products={products} categories={categories} uploadImage={uploadImage} refreshData={fetchData} />}
        {activeTab === 'categories' && <AdminCategories categories={categories} uploadImage={uploadImage} refreshData={fetchData} />}
        {activeTab === 'customers' && <AdminCustomers customers={customers} exportCustomers={exportCustomers} />}
        {activeTab === 'delivery' && <AdminDeliveryBoys deliveryBoys={deliveryBoys} refreshData={fetchData} />}
        {activeTab === 'branches' && <AdminBranches branches={branches} refreshData={fetchData} />}
        {activeTab === 'charges' && <AdminCharges settings={settings} tiers={tiers} refreshData={fetchData} />}
        {activeTab === 'banners' && <AdminBanners banners={banners} uploadImage={uploadImage} refreshData={fetchData} />}
        {activeTab === 'invoice_settings' && <AdminInvoiceSettings settings={invoiceSettings} refreshData={fetchData} />}
        {activeTab === 'profile' && <AdminProfile onLogout={onLogout} />}
        {activeTab === 'policies' && <AdminPolicies onGoToContent={() => setActiveTab('content')} />}
        {activeTab === 'content' && <AdminContent appPages={appPages} refreshData={fetchData} />}
      </div>
    </div>
  );
};

export default Admin;
