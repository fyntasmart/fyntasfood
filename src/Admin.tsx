import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// Interfaces
interface Branch { id: string; name: string; is_active: boolean; delivery_range_km: number; }
interface Settings { id: string; base_fare: number; max_delivery_km: number; }
interface Tier { id: string; min_km: number; max_km: number; price: number; }
interface Category { id: string; name: string; short_name: string; }
interface Product { id: string; name: string; price: number; stock: number; image_url: string; }
interface Order { id: string; customer_name: string; total_amount: number; status: string; created_at: string; }
interface DeliveryBoy { id: string; name: string; mobile: string; is_active: boolean; }

const Admin = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);

  // Delivery Boy Inputs
  const [dbName, setDbName] = useState('');
  const [dbMobile, setDbMobile] = useState('');
  const [dbAadhar, setDbAadhar] = useState('');
  const [dbAddress, setDbAddress] = useState('');

  // Catalogue Inputs
  const [catName, setCatName] = useState('');
  const [catShort, setCatShort] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodImg, setProdImg] = useState('');

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      const [b, s, t, c, p, o, d] = await Promise.all([
        supabase.from('branches').select('*'),
        supabase.from('delivery_settings').select('*').single(),
        supabase.from('delivery_tiers').select('*').order('min_km'),
        supabase.from('categories').select('*'),
        supabase.from('products').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('delivery_boys').select('*')
      ]);
      if (b.data) setBranches(b.data);
      if (s.data) setSettings(s.data);
      if (t.data) setTiers(t.data);
      if (c.data) setCategories(c.data);
      if (p.data) setProducts(p.data);
      if (o.data) setOrders(o.data);
      if (d.data) setDeliveryBoys(d.data);
    };
    fetchData();
  }, []);

  // Navigation Tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'catalogue', label: 'Catalogue', icon: '🗂️' },
    { id: 'deliveryboys', label: 'Delivery Boys', icon: '🛵' },
    { id: 'charges', label: 'Delivery Charges', icon: '💰' },
  ];

  // ---- Core Functions ----
  const addCategory = async () => {
    if (!catName || !catShort) return alert('Category ka naam aur short name do!');
    const { error } = await supabase.from('categories').insert({ name: catName, short_name: catShort });
    if (!error) { setCatName(''); setCatShort(''); await refreshData(); alert('Category added!'); }
    else alert(error.message);
  };

  const addProduct = async () => {
    if (!prodName || !prodCat || !prodPrice) return alert('Product ka naam, category aur price do!');
    const { error } = await supabase.from('products').insert({ 
      name: prodName, category_id: prodCat, price: parseFloat(prodPrice), stock: parseInt(prodStock || '0'), image_url: prodImg 
    });
    if (!error) { setProdName(''); setProdPrice(''); setProdStock(''); setProdImg(''); await refreshData(); alert('Product added!'); }
    else alert(error.message);
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    await refreshData();
  };

  const addDeliveryBoy = async () => {
    if (!dbName || !dbMobile) return alert('Name aur Mobile zaroori hain!');
    const { error } = await supabase.from('delivery_boys').insert({ name: dbName, mobile: dbMobile });
    if (!error) { setDbName(''); setDbMobile(''); await refreshData(); alert('Delivery Boy added!'); }
  };

  const addTier = async () => {
    const last = tiers[tiers.length - 1];
    const min = last ? last.max_km : 0;
    const max = min + 2;
    const price = last ? last.price + 10 : 10;
    await supabase.from('delivery_tiers').insert({ min_km: min, max_km: max, price });
    await refreshData();
  };

  const deleteTier = async (id: string) => {
    if (tiers.length <= 1) return alert('Ek tier toh hona chahiye!');
    await supabase.from('delivery_tiers').delete().eq('id', id);
    await refreshData();
  };

  const refreshData = async () => {
    const [c, p, o, t] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('products').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('delivery_tiers').select('*').order('min_km')
    ]);
    if (c.data) setCategories(c.data);
    if (p.data) setProducts(p.data);
    if (o.data) setOrders(o.data);
    if (t.data) setTiers(t.data);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .sidebar { width: 240px; background: #0c1122; border-right: 1px solid rgba(255,255,255,0.08); padding: 20px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 12px; cursor: pointer; border-radius: 10px; margin-bottom: 5px; color: #9aa4bd; }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .nav-item.active { background: linear-gradient(90deg, #7c3aed, #2563eb); color: #fff; }
        .content { flex: 1; padding: 20px; }
        .panel { background: #121729; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 20px; margin-bottom: 20px; }
        input, select { background: #161d33; border: 1px solid rgba(255,255,255,0.08); color: #fff; padding: 10px; border-radius: 8px; width: 100%; margin-bottom: 10px; }
        .btn { padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; color: #fff; }
        .btn-purple { background: linear-gradient(120deg, #7c3aed, #ea580c); }
        .btn-green { background: linear-gradient(120deg, #6ee7b7, #059669); }
        .btn-red { background: linear-gradient(120deg, #fca5a5, #dc2626); }
        .btn-blue { background: linear-gradient(120deg, #60a5fa, #2563eb); }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); color: #9aa4bd; }
        td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      `}</style>

      {/* Sidebar */}
      <div className="sidebar">
        <h2 style={{ color: '#fff', marginBottom: '30px' }}>FYNTAS Admin</h2>
        {tabs.map(tab => (
          <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span>{tab.icon}</span> {tab.label}
          </div>
        ))}
        <div className="nav-item" style={{ marginTop: '30px' }} onClick={onLogout}>
          🚪 Logout
        </div>
      </div>

      {/* Main Content */}
      <div className="content">
        {activeTab === 'dashboard' && (
          <div className="panel">
            <h3>Dashboard Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div style={{ background: '#1a2450', padding: '20px', borderRadius: '10px' }}><h2>{orders.length}</h2><p style={{ color: '#9aa4bd' }}>Total Orders</p></div>
              <div style={{ background: '#1a2450', padding: '20px', borderRadius: '10px' }}><h2>{branches.length}</h2><p style={{ color: '#9aa4bd' }}>Active Branches</p></div>
              <div style={{ background: '#1a2450', padding: '20px', borderRadius: '10px' }}><h2>{products.length}</h2><p style={{ color: '#9aa4bd' }}>Total Products</p></div>
              <div style={{ background: '#1a2450', padding: '20px', borderRadius: '10px' }}><h2>{deliveryBoys.length}</h2><p style={{ color: '#9aa4bd' }}>Delivery Boys</p></div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="panel">
            <h3>Customer Orders</h3>
            {orders.length === 0 ? <p>Abhi koi order nahi aaya!</p> : (
              <table>
                <thead><tr><th>Customer</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>{order.customer_name}</td>
                      <td>₹{order.total_amount}</td>
                      <td>{order.status}</td>
                      <td>
                        <button className="btn btn-blue" onClick={() => updateOrderStatus(order.id, 'Delivered')}>Mark Delivered</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'catalogue' && (
          <div>
            <div className="panel">
              <h3>Add Category</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input placeholder="Category Name" value={catName} onChange={(e) => setCatName(e.target.value)} />
                <input placeholder="Short Code" value={catShort} onChange={(e) => setCatShort(e.target.value)} />
                <button className="btn btn-purple" onClick={addCategory}>Add</button>
              </div>
              <div style={{ marginTop: '10px' }}>
                {categories.map(c => <span key={c.id} style={{ background: '#161d33', padding: '5px 10px', borderRadius: '5px', marginRight: '5px' }}>{c.name}</span>)}
              </div>
            </div>

            <div className="panel">
              <h3>Add Product</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input placeholder="Product Name" value={prodName} onChange={(e) => setProdName(e.target.value)} />
                <select value={prodCat} onChange={(e) => setProdCat(e.target.value)}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input placeholder="Price" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
                <input placeholder="Image URL" value={prodImg} onChange={(e) => setProdImg(e.target.value)} />
                <input placeholder="Stock" value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
              </div>
              <button className="btn btn-green" style={{ marginTop: '10px' }} onClick={addProduct}>Add Product</button>
              <div style={{ marginTop: '10px' }}>
                {products.map(p => <div key={p.id} style={{ borderBottom: '1px solid #333', padding: '10px' }}>{p.name} - ₹{p.price} (Stock: {p.stock})</div>)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deliveryboys' && (
          <div className="panel">
            <h3>Add Delivery Boy</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input placeholder="Name" value={dbName} onChange={(e) => setDbName(e.target.value)} />
              <input placeholder="Mobile" value={dbMobile} onChange={(e) => setDbMobile(e.target.value)} />
              <input placeholder="Aadhar" value={dbAadhar} onChange={(e) => setDbAadhar(e.target.value)} />
              <input placeholder="Address" value={dbAddress} onChange={(e) => setDbAddress(e.target.value)} />
            </div>
            <button className="btn btn-green" style={{ marginTop: '10px' }} onClick={addDeliveryBoy}>Add Boy</button>
            <h3 style={{ marginTop: '20px' }}>All Boys</h3>
            {deliveryBoys.map(boy => (
              <div key={boy.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #333' }}>
                <span>{boy.name} - {boy.mobile}</span>
                <button className="btn btn-red" onClick={async () => { await supabase.from('delivery_boys').delete().eq('id', boy.id); refreshData(); }}>Delete</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'charges' && (
          <div className="panel">
            <h3>Delivery Charge Settings</h3>
            <label>Base Fare (₹)</label>
            <input type="number" value={settings?.base_fare ?? 0} onChange={(e) => setSettings({ ...settings!, base_fare: parseFloat(e.target.value) })} />
            
            <label>Distance Tiers</label>
            {tiers.map(tier => (
              <div key={tier.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <input type="number" value={tier.min_km} style={{ width: '70px' }} onChange={(e) => { const v = parseFloat(e.target.value); setTiers(tiers.map(t => t.id === tier.id ? { ...t, min_km: v } : t)); }} />
                <span>KM to</span>
                <input type="number" value={tier.max_km} style={{ width: '70px' }} onChange={(e) => { const v = parseFloat(e.target.value); setTiers(tiers.map(t => t.id === tier.id ? { ...t, max_km: v } : t)); }} />
                <span>KM = ₹</span>
                <input type="number" value={tier.price} style={{ width: '70px' }} onChange={(e) => { const v = parseFloat(e.target.value); setTiers(tiers.map(t => t.id === tier.id ? { ...t, price: v } : t)); }} />
                <button className="btn btn-red" onClick={() => deleteTier(tier.id)}>Del</button>
              </div>
            ))}
            <button className="btn btn-blue" onClick={addTier}>+ Add Tier</button>
            <div style={{ marginTop: '20px' }}>
              <label>Max Delivery (KM)</label>
              <input type="number" value={settings?.max_delivery_km ?? 0} onChange={(e) => setSettings({ ...settings!, max_delivery_km: parseFloat(e.target.value) })} />
            </div>
            <button className="btn btn-purple" style={{ marginTop: '10px' }} onClick={async () => {
              if (settings) { await supabase.from('delivery_settings').update(settings).eq('id', settings.id); alert('Saved!'); }
            }}>Save Settings</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
