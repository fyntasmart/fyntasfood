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

const Admin = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // ALL DATA STATES
  const [branches, setBranches] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ id: '', base_fare: 0, max_delivery_km: 15 });
  const [tiers, setTiers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [appPages, setAppPages] = useState<any[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<any>({ id: '', welcome_note: '', terms: '', footer: '' });

  // Fetch All Data
  const fetchData = async () => {
    const [b, s, t, c, p, o, d, cust, bn, pages, inv] = await Promise.all([
      supabase.from('branches').select('*'),
      supabase.from('delivery_settings').select('*').single(),
      supabase.from('delivery_tiers').select('*').order('min_km'),
      supabase.from('categories').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('delivery_boys').select('*'),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('banners').select('*').order('created_at', { ascending: false }),
      supabase.from('app_pages').select('*'),
      supabase.from('invoice_settings').select('*').single()
    ]);
    if (b.data) setBranches(b.data);
    if (s.data) setSettings(s.data);
    if (t.data) setTiers(t.data);
    if (c.data) setCategories(c.data);
    if (p.data) setProducts(p.data);
    if (o.data) setOrders(o.data);
    if (d.data) setDeliveryBoys(d.data);
    if (cust.data) setCustomers(cust.data);
    if (bn.data) setBanners(bn.data);
    if (pages.data) setAppPages(pages.data);
    if (inv.data) setInvoiceSettings(inv.data);
  };

  // Auto Refresh every 10 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Helper Functions (passing to children)
  const refreshData = () => fetchData();

  const uploadImage = async (file: File) => {
    const path = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) return '';
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    fetchData();
  };

  const assignDeliveryBoy = async (orderId: string, boyId: string) => {
    if (!boyId) return;
    await supabase.from('orders').update({ delivery_boy_id: boyId }).eq('id', orderId);
    fetchData();
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Kya aap yeh order delete karna chahte hain?')) return;
    await supabase.from('order_items').delete().eq('order_id', orderId);
    await supabase.from('orders').delete().eq('id', orderId);
    fetchData();
  };

  const printReceipt = (orderId: string, format: string) => {
    window.open(`/invoice/${orderId}?format=${format}`, '_blank');
  };

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
          <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span>{tab.icon}</span> {tab.label}
          </div>
        ))}
        <div className="nav-item" style={{ marginTop: '30px' }} onClick={onLogout}>🚪 Logout</div>
      </div>

      <div className="content">
        {activeTab === 'dashboard' && <AdminDashboard orders={orders} customers={customers} products={products} deliveryBoys={deliveryBoys} />}
        {activeTab === 'orders' && <AdminOrders orders={orders} deliveryBoys={deliveryBoys} assignDeliveryBoy={assignDeliveryBoy} handleStatusChange={handleStatusChange} deleteOrder={deleteOrder} printReceipt={printReceipt} />}
        {activeTab === 'products' && <AdminProducts products={products} categories={categories} uploadImage={uploadImage} refreshData={refreshData} />}
        {activeTab === 'categories' && <AdminCategories categories={categories} uploadImage={uploadImage} refreshData={refreshData} />}
        {activeTab === 'customers' && <AdminCustomers customers={customers} exportCustomers={exportCustomers} />}
        {activeTab === 'delivery' && <AdminDeliveryBoys deliveryBoys={deliveryBoys} refreshData={refreshData} />}
        {activeTab === 'branches' && <AdminBranches branches={branches} refreshData={refreshData} />}
        {activeTab === 'charges' && <AdminCharges settings={settings} tiers={tiers} refreshData={refreshData} />}
        {activeTab === 'banners' && <AdminBanners banners={banners} uploadImage={uploadImage} refreshData={refreshData} />}
        {activeTab === 'invoice_settings' && <AdminInvoiceSettings settings={invoiceSettings} refreshData={refreshData} uploadImage={uploadImage} />}
        {activeTab === 'profile' && <AdminProfile onLogout={onLogout} />}
        {activeTab === 'policies' && <AdminPolicies onGoToContent={() => setActiveTab('content')} />}
        {activeTab === 'content' && <AdminContent appPages={appPages} refreshData={refreshData} />}
      </div>
    </div>
  );
};

export default Admin;
