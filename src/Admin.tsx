import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Branch { id: string; name: string; address?: string; lat: number; lng: number; is_active: boolean; delivery_range_km: number; max_delivery_km: number; }
interface Settings { id: string; base_fare: number; }
interface Tier { id: string; min_km: number; max_km: number; price: number; }
interface Category { id: string; name: string; short_name: string; }
interface Product { id: string; name: string; sku: string; price: number; stock: number; discount_type: string; discount_value: number; }
interface Order { id: string; customer_name: string; total_amount: number; status: string; created_at: string; }
interface DeliveryBoy { id: string; name: string; mobile: string; aadhar?: string; address?: string; is_active: boolean; }

const Admin = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);

  // Catalogue Form States
  const [catName, setCatName] = useState('');
  const [catShort, setCatShort] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodImg1, setProdImg1] = useState('');
  const [prodImg2, setProdImg2] = useState('');
  const [prodImg3, setProdImg3] = useState('');
  const [prodImg4, setProdImg4] = useState('');
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState('');

  // Branch Form States
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchLat, setNewBranchLat] = useState('');
  const [newBranchLng, setNewBranchLng] = useState('');
  const [newBranchRange, setNewBranchRange] = useState('10');
  const [newBranchMaxKm, setNewBranchMaxKm] = useState('15'); // Naya field

  // Delivery Boy Form States
  const [dbName, setDbName] = useState('');
  const [dbMobile, setDbMobile] = useState('');
  const [dbAadhar, setDbAadhar] = useState('');
  const [dbAddress, setDbAddress] = useState('');

  // Modal States
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isBranchModal, setIsBranchModal] = useState(false);
  const [branchMenu, setBranchMenu] = useState(false);
  const [editingBranch, setEditingBranch] = useState(false);

  const [selectedBoy, setSelectedBoy] = useState<DeliveryBoy | null>(null);
  const [isBoyModal, setIsBoyModal] = useState(false);
  const [boyMenu, setBoyMenu] = useState(false);
  const [editingBoy, setEditingBoy] = useState(false);

  // Fetch Data
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

  useEffect(() => { fetchData(); }, []);

  // Add Category
  const addCategory = async () => {
    if (!catName || !catShort) return alert('Category name aur short code do!');
    await supabase.from('categories').insert({ name: catName, short_name: catShort });
    setCatName(''); setCatShort(''); fetchData();
  };

  // Add Product
  const addProduct = async () => {
    if (!prodName || !prodCat) return alert('Product name aur category do!');
    const { error } = await supabase.from('products').insert({
      name: prodName, sku: prodSku, category_id: prodCat, 
      price: parseFloat(prodPrice) || 0, stock: parseInt(prodStock) || 0,
      image_url: prodImg1, image_2: prodImg2, image_3: prodImg3, image_4: prodImg4,
      discount_type: discountType, discount_value: parseFloat(discountValue) || 0
    });
    if (!error) { alert('Product added!'); setProdName(''); setProdSku(''); setProdPrice(''); setProdStock(''); setProdImg1(''); setProdImg2(''); setProdImg3(''); setProdImg4(''); setDiscountType('none'); setDiscountValue(''); fetchData(); }
    else alert(error.message);
  };

  // Branch CRUD (with Max Delivery)
  const addBranch = async () => {
    if (!newBranchName || !newBranchLat || !newBranchLng) return alert('Branch name, Lat aur Lng zaroori hain!');
    await supabase.from('branches').insert({ 
      name: newBranchName, address: newBranchAddress, lat: parseFloat(newBranchLat), lng: parseFloat(newBranchLng), 
      delivery_range_km: parseFloat(newBranchRange) || 10, 
      max_delivery_km: parseFloat(newBranchMaxKm) || 15 // Naya field
    });
    setNewBranchName(''); setNewBranchAddress(''); setNewBranchLat(''); setNewBranchLng(''); setNewBranchRange('10'); setNewBranchMaxKm('15');
    fetchData();
  };

  const saveBranch = async () => {
    if (!selectedBranch) return;
    await supabase.from('branches').update(selectedBranch).eq('id', selectedBranch.id);
    setEditingBranch(false); setBranchMenu(false); fetchData();
  };

  const deleteBranch = async (id: string) => {
    if (!confirm('Branch delete karna hai?')) return;
    await supabase.from('branches').delete().eq('id', id);
    setIsBranchModal(false); fetchData();
  };

  const toggleBranchActive = async (branch: Branch) => {
    const newStatus = !branch.is_active;
    await supabase.from('branches').update({ is_active: newStatus }).eq('id', branch.id);
    setSelectedBranch({ ...branch, is_active: newStatus });
    setBranchMenu(false); fetchData();
  };

  // Delivery Boy CRUD
  const addDeliveryBoy = async () => {
    if (!dbName || !dbMobile) return alert('Name aur Mobile zaroori hain!');
    await supabase.from('delivery_boys').insert({ name: dbName, mobile: dbMobile, aadhar: dbAadhar, address: dbAddress });
    setDbName(''); setDbMobile(''); setDbAadhar(''); setDbAddress(''); fetchData();
  };

  const saveBoy = async () => {
    if (!selectedBoy) return;
    await supabase.from('delivery_boys').update(selectedBoy).eq('id', selectedBoy.id);
    setEditingBoy(false); setBoyMenu(false); fetchData();
  };

  const deleteBoy = async (id: string) => {
    if (!confirm('Delivery boy delete karna hai?')) return;
    await supabase.from('delivery_boys').delete().eq('id', id);
    setIsBoyModal(false); fetchData();
  };

  const toggleBoyActive = async (boy: DeliveryBoy) => {
    const newStatus = !boy.is_active;
    await supabase.from('delivery_boys').update({ is_active: newStatus }).eq('id', boy.id);
    setSelectedBoy({ ...boy, is_active: newStatus });
    setBoyMenu(false); fetchData();
  };

  // Tier Functions
  const addTier = async () => {
    const last = tiers[tiers.length - 1];
    const min = last ? last.max_km : 0;
    const max = min + 2;
    const price = last ? last.price + 10 : 10;
    await supabase.from('delivery_tiers').insert({ min_km: min, max_km: max, price });
    fetchData();
  };

  const deleteTier = async (id: string) => {
    if (tiers.length <= 1) return alert('Ek tier toh hona chahiye!');
    await supabase.from('delivery_tiers').delete().eq('id', id);
    fetchData();
  };

  // Tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'catalogue', label: 'Catalogue', icon: '🗂️' },
    { id: 'delivery', label: 'Delivery Boys', icon: '🛵' },
    { id: 'branches', label: 'Branches', icon: '🏬' },
    { id: 'charges', label: 'Delivery Charges', icon: '💰' },
  ];

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
        .modal-scrim{position:fixed; inset:0; background:rgba(4,6,12,.65); backdrop-filter:blur(4px); display:none; align-items:center; justify-content:center; z-index:300; padding:20px;}
        .modal-scrim.show{display:flex;}
        .modal-card{width:100%; max-width:420px; background:#121729; border:1px solid rgba(255,255,255,0.08); border-radius:20px; box-shadow:0 30px 70px -20px rgba(0,0,0,.7); position:relative;}
        .modal-head{display:flex; align-items:flex-start; gap:14px; padding:22px; border-bottom:1px solid rgba(255,255,255,0.08); position:relative;}
        .modal-avatar{width:48px;height:48px;border-radius:14px; flex:none; display:flex; align-items:center; justify-content:center; font-size:21px; background:linear-gradient(150deg, #6ee7b7, #059669);}
        .modal-title{font-size:16.5px; font-weight:700; color:#fff; margin-top:5px;}
        .modal-subtitle{font-size:11.5px; color:#9aa4bd; margin-top:3px;}
        .modal-close{margin-left:auto; width:32px;height:32px;border-radius:9px; background:#161d33; border:1px solid rgba(255,255,255,0.08); color:#9aa4bd; display:flex; align-items:center; justify-content:center; cursor:pointer;}
        .dots-btn{width:32px;height:32px;border-radius:9px; background:#161d33; border:1px solid rgba(255,255,255,0.08); color:#9aa4bd; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:18px;}
        .dots-menu{position:absolute; top:70px; right:22px; min-width:150px; background:#161d33; border:1px solid rgba(255,255,255,0.08); border-radius:12px; box-shadow:0 16px 40px -10px rgba(0,0,0,.6); overflow:hidden; z-index:20; display:none;}
        .dots-menu.show{display:block;}
        .dots-menu button{width:100%; text-align:left; background:none; border:none; color:#f1f5f9; padding:11px 14px; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:9px;}
        .dots-menu button:hover{background:rgba(255,255,255,.05);}
        .dots-menu button.danger{color:#fca5a5;}
        .modal-body{padding:18px 22px;}
        .detail-row{display:flex; justify-content:space-between; align-items:center; padding:11px 0; border-bottom:1px solid rgba(255,255,255,0.08); font-size:13.5px;}
        .detail-row .dl{color:#9aa4bd;}
        .detail-row .dv{font-weight:600; color:#f1f5f9;}
        .detail-row input{background:#161d33; border:1px solid rgba(255,255,255,0.08); border-radius:8px; color:#f1f5f9; padding:7px 10px; font-size:13px; text-align:right; width:60%; outline:none;}
      `}</style>

      {/* Sidebar */}
      <div className="sidebar">
        <h2 style={{ color: '#fff', marginBottom: '30px' }}>FYNTAS Admin</h2>
        {tabs.map(tab => (
          <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span>{tab.icon}</span> {tab.label}
          </div>
        ))}
        <div className="nav-item" style={{ marginTop: '30px' }} onClick={onLogout}>🚪 Logout</div>
      </div>

      {/* Main Content */}
      <div className="content">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="panel">
            <h3>Dashboard Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div style={{ background: '#1a2450', padding: '20px', borderRadius: '10px' }}>
                <h2 style={{ color: '#fff', fontSize: '28px' }}>{orders.length}</h2>
                <p style={{ color: '#9aa4bd' }}>Total Orders</p>
              </div>
              <div style={{ background: '#1a2450', padding: '20px', borderRadius: '10px' }}>
                <h2 style={{ color: '#fff', fontSize: '28px' }}>{branches.length}</h2>
                <p style={{ color: '#9aa4bd' }}>Active Branches</p>
              </div>
              <div style={{ background: '#1a2450', padding: '20px', borderRadius: '10px' }}>
                <h2 style={{ color: '#fff', fontSize: '28px' }}>{products.length}</h2>
                <p style={{ color: '#9aa4bd' }}>Total Products</p>
              </div>
              <div style={{ background: '#1a2450', padding: '20px', borderRadius: '10px' }}>
                <h2 style={{ color: '#fff', fontSize: '28px' }}>{deliveryBoys.length}</h2>
                <p style={{ color: '#9aa4bd' }}>Delivery Boys</p>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS */}
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
                        <button className="btn btn-blue" onClick={async () => { await supabase.from('orders').update({ status: 'Delivered' }).eq('id', order.id); fetchData(); }}>Mark Delivered</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* CATALOGUE */}
        {activeTab === 'catalogue' && (
          <div>
            <div className="panel">
              <h3>Add Category</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input placeholder="Category Name" value={catName} onChange={(e) => setCatName(e.target.value)} />
                <input placeholder="Short Code" value={catShort} onChange={(e) => setCatShort(e.target.value)} />
                <button className="btn btn-purple" onClick={addCategory}>Add</button>
              </div>
            </div>
            <div className="panel">
              <h3>Add Product (SKU + 4 Images + Discount)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input placeholder="SKU Code" value={prodSku} onChange={(e) => setProdSku(e.target.value)} />
                <input placeholder="Product Name" value={prodName} onChange={(e) => setProdName(e.target.value)} />
                <select value={prodCat} onChange={(e) => setProdCat(e.target.value)}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input placeholder="Price (₹)" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
                <input placeholder="Stock" value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                    <option value="none">No Discount</option>
                    <option value="percent">Percentage (%)</option>
                    <option value="amount">Flat Amount (₹)</option>
                  </select>
                  {discountType !== 'none' && (
                    <input placeholder="Discount Value" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
                  )}
                </div>
                
                {/* 4 Images */}
                <input placeholder="Image 1 URL" value={prodImg1} onChange={(e) => setProdImg1(e.target.value)} />
                <input placeholder="Image 2 URL" value={prodImg2} onChange={(e) => setProdImg2(e.target.value)} />
                <input placeholder="Image 3 URL" value={prodImg3} onChange={(e) => setProdImg3(e.target.value)} />
                <input placeholder="Image 4 URL" value={prodImg4} onChange={(e) => setProdImg4(e.target.value)} />
              </div>
              <button className="btn btn-green" style={{ marginTop: '10px' }} onClick={addProduct}>Add Product</button>
              
              <h3 style={{ marginTop: '20px' }}>All Products</h3>
              {products.map(p => (
                <div key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px' }}>
                  <strong>{p.name}</strong> (SKU: {p.sku}) - ₹{p.price} {p.discount_type !== 'none' && <span style={{ color: '#6ee7b7' }}>(-{p.discount_value}{p.discount_type === 'percent' ? '%' : '₹'})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DELIVERY BOYS */}
        {activeTab === 'delivery' && (
          <div className="panel">
            <h3>Add Delivery Boy</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input placeholder="Name" value={dbName} onChange={(e) => setDbName(e.target.value)} />
              <input placeholder="Mobile" value={dbMobile} onChange={(e) => setDbMobile(e.target.value)} />
              <input placeholder="Aadhar" value={dbAadhar} onChange={(e) => setDbAadhar(e.target.value)} />
              <input placeholder="Address" value={dbAddress} onChange={(e) => setDbAddress(e.target.value)} />
            </div>
            <button className="btn btn-green" style={{ marginTop: '10px' }} onClick={addDeliveryBoy}>Add Boy</button>
            
            <h3 style={{ marginTop: '20px' }}>All Boys (Click Name)</h3>
            {deliveryBoys.map(boy => (
              <div key={boy.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => { setSelectedBoy(boy); setIsBoyModal(true); setBoyMenu(false); setEditingBoy(false); }}>
                <span style={{ color: '#a78bfa', fontWeight: 'bold', textDecoration: 'underline' }}>{boy.name}</span>
                <span>{boy.mobile}</span>
                <span>{boy.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            ))}
          </div>
        )}

        {/* BRANCHES */}
        {activeTab === 'branches' && (
          <div className="panel">
            <h3>Add Branch (With Location & Max KM)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input placeholder="Branch Name" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} />
              <input placeholder="Address" value={newBranchAddress} onChange={(e) => setNewBranchAddress(e.target.value)} />
              <input placeholder="Latitude" value={newBranchLat} onChange={(e) => setNewBranchLat(e.target.value)} />
              <input placeholder="Longitude" value={newBranchLng} onChange={(e) => setNewBranchLng(e.target.value)} />
              <input placeholder="Delivery Range (KM)" value={newBranchRange} onChange={(e) => setNewBranchRange(e.target.value)} />
              <input placeholder="Max Delivery (KM)" value={newBranchMaxKm} onChange={(e) => setNewBranchMaxKm(e.target.value)} /> {/* Naya Field */}
            </div>
            <button className="btn btn-purple" style={{ marginTop: '10px' }} onClick={addBranch}>Add Branch</button>

            <h3 style={{ marginTop: '20px' }}>All Branches (Click Name)</h3>
            {branches.map(branch => (
              <div key={branch.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => { setSelectedBranch(branch); setIsBranchModal(true); setBranchMenu(false); setEditingBranch(false); }}>
                <span style={{ color: '#a78bfa', fontWeight: 'bold', textDecoration: 'underline' }}>{branch.name}</span>
                <span>{branch.delivery_range_km} KM Range</span>
                <span>{branch.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            ))}
          </div>
        )}

        {/* CHARGES */}
        {activeTab === 'charges' && (
          <div className="panel">
            <h3>Delivery Charge Settings</h3>
            <label>Base Fare (₹)</label>
            <input type="number" value={settings?.base_fare ?? 0} onChange={(e) => setSettings({ ...settings!, base_fare: parseFloat(e.target.value) })} />
            
            <label>Distance Tiers (0-2=10, 2-4=20, etc.)</label>
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
            
            <button className="btn btn-purple" style={{ marginTop: '20px' }} onClick={async () => { if (settings) { await supabase.from('delivery_settings').update(settings).eq('id', settings.id); alert('Saved!'); } }}>Save Settings</button>
          </div>
        )}
      </div>

      {/* BRANCH MODAL */}
      <div className={`modal-scrim ${isBranchModal ? 'show' : ''}`} onClick={() => setIsBranchModal(false)}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <div className="modal-avatar">🏬</div>
            <div>
              <div className="modal-title">{selectedBranch?.name}</div>
              <div className="modal-subtitle">Branch Details</div>
            </div>
            <div style={{ position: 'relative', marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <div className="dots-btn" onClick={() => setBranchMenu(!branchMenu)}>⋮</div>
              <div className={`dots-menu ${branchMenu ? 'show' : ''}`}>
                <button onClick={() => setEditingBranch(true)}>✏️ Edit</button>
                <button onClick={() => toggleBranchActive(selectedBranch!)}>{selectedBranch?.is_active ? '🚫 Deactivate' : '✅ Activate'}</button>
                <button className="danger" onClick={() => deleteBranch(selectedBranch!.id)}>🗑️ Delete</button>
              </div>
            </div>
            <div className="modal-close" onClick={() => setIsBranchModal(false)}>✕</div>
          </div>
          <div className="modal-body">
            {editingBranch ? (
              <div>
                <div className="detail-row"><span className="dl">Name</span><input value={selectedBranch!.name} onChange={(e) => setSelectedBranch({ ...selectedBranch!, name: e.target.value })} /></div>
                <div className="detail-row"><span className="dl">Address</span><input value={selectedBranch!.address || ''} onChange={(e) => setSelectedBranch({ ...selectedBranch!, address: e.target.value })} /></div>
                <div className="detail-row"><span className="dl">Latitude</span><input value={selectedBranch!.lat} onChange={(e) => setSelectedBranch({ ...selectedBranch!, lat: parseFloat(e.target.value) })} /></div>
                <div className="detail-row"><span className="dl">Longitude</span><input value={selectedBranch!.lng} onChange={(e) => setSelectedBranch({ ...selectedBranch!, lng: parseFloat(e.target.value) })} /></div>
                <div className="detail-row"><span className="dl">Range (KM)</span><input value={selectedBranch!.delivery_range_km} onChange={(e) => setSelectedBranch({ ...selectedBranch!, delivery_range_km: parseFloat(e.target.value) })} /></div>
                <div className="detail-row"><span className="dl">Max Delivery (KM)</span><input value={selectedBranch!.max_delivery_km} onChange={(e) => setSelectedBranch({ ...selectedBranch!, max_delivery_km: parseFloat(e.target.value) })} /></div>
              </div>
            ) : (
              <div>
                <div className="detail-row"><span className="dl">Address</span><span className="dv">{selectedBranch?.address || 'N/A'}</span></div>
                <div className="detail-row"><span className="dl">Latitude</span><span className="dv">{selectedBranch?.lat}</span></div>
                <div className="detail-row"><span className="dl">Longitude</span><span className="dv">{selectedBranch?.lng}</span></div>
                <div className="detail-row"><span className="dl">Range</span><span className="dv">{selectedBranch?.delivery_range_km} KM</span></div>
                <div className="detail-row"><span className="dl">Max Delivery</span><span className="dv">{selectedBranch?.max_delivery_km} KM</span></div>
                <div className="detail-row"><span className="dl">Status</span><span className="dv" style={{ color: selectedBranch?.is_active ? '#6ee7b7' : '#fca5a5' }}>{selectedBranch?.is_active ? 'Active' : 'Inactive'}</span></div>
              </div>
            )}
          </div>
          {editingBranch && (
            <div style={{ padding: '16px 22px 22px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-red" onClick={() => setEditingBranch(false)}>Cancel</button>
              <button className="btn btn-purple" onClick={saveBranch}>Save Changes</button>
            </div>
          )}
        </div>
      </div>

      {/* DELIVERY BOY MODAL */}
      <div className={`modal-scrim ${isBoyModal ? 'show' : ''}`} onClick={() => setIsBoyModal(false)}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <div className="modal-avatar">🛵</div>
            <div>
              <div className="modal-title">{selectedBoy?.name}</div>
              <div className="modal-subtitle">Delivery Boy</div>
            </div>
            <div style={{ position: 'relative', marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <div className="dots-btn" onClick={() => setBoyMenu(!boyMenu)}>⋮</div>
              <div className={`dots-menu ${boyMenu ? 'show' : ''}`}>
                <button onClick={() => setEditingBoy(true)}>✏️ Edit</button>
                <button onClick={() => toggleBoyActive(selectedBoy!)}>{selectedBoy?.is_active ? '🚫 Deactivate' : '✅ Activate'}</button>
                <button className="danger" onClick={() => deleteBoy(selectedBoy!.id)}>🗑️ Delete</button>
              </div>
            </div>
            <div className="modal-close" onClick={() => setIsBoyModal(false)}>✕</div>
          </div>
          <div className="modal-body">
            {editingBoy ? (
              <div>
                <div className="detail-row"><span className="dl">Name</span><input value={selectedBoy!.name} onChange={(e) => setSelectedBoy({ ...selectedBoy!, name: e.target.value })} /></div>
                <div className="detail-row"><span className="dl">Mobile</span><input value={selectedBoy!.mobile} onChange={(e) => setSelectedBoy({ ...selectedBoy!, mobile: e.target.value })} /></div>
                <div className="detail-row"><span className="dl">Aadhar</span><input value={selectedBoy!.aadhar || ''} onChange={(e) => setSelectedBoy({ ...selectedBoy!, aadhar: e.target.value })} /></div>
                <div className="detail-row"><span className="dl">Address</span><input value={selectedBoy!.address || ''} onChange={(e) => setSelectedBoy({ ...selectedBoy!, address: e.target.value })} /></div>
              </div>
            ) : (
              <div>
                <div className="detail-row"><span className="dl">Mobile</span><span className="dv">{selectedBoy?.mobile}</span></div>
                <div className="detail-row"><span className="dl">Aadhar</span><span className="dv">{selectedBoy?.aadhar || 'N/A'}</span></div>
                <div className="detail-row"><span className="dl">Address</span><span className="dv">{selectedBoy?.address || 'N/A'}</span></div>
                <div className="detail-row"><span className="dl">Status</span><span className="dv" style={{ color: selectedBoy?.is_active ? '#6ee7b7' : '#fca5a5' }}>{selectedBoy?.is_active ? 'Active' : 'Inactive'}</span></div>
              </div>
            )}
          </div>
          {editingBoy && (
            <div style={{ padding: '16px 22px 22px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-red" onClick={() => setEditingBoy(false)}>Cancel</button>
              <button className="btn btn-purple" onClick={saveBoy}>Save Changes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
