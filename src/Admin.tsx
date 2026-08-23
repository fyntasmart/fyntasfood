import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Branch { id: string; name: string; address?: string; lat: number; lng: number; is_active: boolean; delivery_range_km: number; max_delivery_km: number; }
interface Settings { id: string; base_fare: number; }
interface Tier { id: string; min_km: number; max_km: number; price: number; }
interface Category { id: string; name: string; short_name: string; image_url?: string; is_active: boolean; }
interface Product { id: string; name: string; sku: string; price: number; stock: number; discount_type: string; discount_value: number; is_active: boolean; }
interface Order { id: string; customer_name: string; total_amount: number; status: string; created_at: string; }
interface DeliveryBoy { id: string; name: string; mobile: string; aadhar?: string; address?: string; is_active: boolean; }
interface Customer { id: string; name: string; mobile: string; created_at: string; }

const Admin = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Form States
  const [catName, setCatName] = useState('');
  const [catShort, setCatShort] = useState('');
  const [catImg, setCatImg] = useState<File | null>(null);
  
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState('');
  const [prodImages, setProdImages] = useState<File[]>([]);
  
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchLat, setNewBranchLat] = useState('');
  const [newBranchLng, setNewBranchLng] = useState('');
  const [newBranchRange, setNewBranchRange] = useState('10');
  const [newBranchMaxKm, setNewBranchMaxKm] = useState('15');

  const [dbName, setDbName] = useState('');
  const [dbMobile, setDbMobile] = useState('');
  const [dbAadhar, setDbAadhar] = useState('');
  const [dbAddress, setDbAddress] = useState('');

  // Modal States (Category & Product)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCatModal, setIsCatModal] = useState(false);
  const [catMenu, setCatMenu] = useState(false);
  const [editingCat, setEditingCat] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProdModal, setIsProdModal] = useState(false);
  const [prodMenu, setProdMenu] = useState(false);
  const [editingProd, setEditingProd] = useState(false);

  // Modal States (Branch & Delivery Boy - Same as before)
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
    const [b, s, t, c, p, o, d, cust] = await Promise.all([
      supabase.from('branches').select('*'),
      supabase.from('delivery_settings').select('*').single(),
      supabase.from('delivery_tiers').select('*').order('min_km'),
      supabase.from('categories').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('delivery_boys').select('*'),
      supabase.from('customers').select('*').order('created_at', { ascending: false })
    ]);
    if (b.data) setBranches(b.data);
    if (s.data) setSettings(s.data);
    if (t.data) setTiers(t.data);
    if (c.data) setCategories(c.data);
    if (p.data) setProducts(p.data);
    if (o.data) setOrders(o.data);
    if (d.data) setDeliveryBoys(d.data);
    if (cust.data) setCustomers(cust.data);
  };

  useEffect(() => { fetchData(); }, []);

  // Upload Image
  const uploadImage = async (file: File) => {
    const path = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) return '';
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  // Add Category
  const addCategory = async () => {
    if (!catName || !catShort) return alert('Category naam aur short code do!');
    let imgUrl = '';
    if (catImg) imgUrl = await uploadImage(catImg);
    await supabase.from('categories').insert({ name: catName, short_name: catShort, image_url: imgUrl });
    setCatName(''); setCatShort(''); setCatImg(null); fetchData();
  };

  // Add Product
  const addProduct = async () => {
    if (!prodName || !prodCat || !prodPrice) return alert('Product name, category aur price do!');
    const urls: string[] = [];
    for (const file of prodImages) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    await supabase.from('products').insert({
      name: prodName, sku: prodSku, category_id: prodCat, price: parseFloat(prodPrice) || 0, stock: parseInt(prodStock) || 0,
      image_url: urls[0] || '', image_2: urls[1] || '', image_3: urls[2] || '', image_4: urls[3] || '',
      discount_type: discountType, discount_value: parseFloat(discountValue) || 0
    });
    setProdName(''); setProdSku(''); setProdPrice(''); setProdStock(''); setProdImages([]); setDiscountType('none'); setDiscountValue('');
    fetchData();
  };

  // Export Customers
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

  // Category CRUD
  const saveCategory = async () => {
    if (!selectedCategory) return;
    await supabase.from('categories').update(selectedCategory).eq('id', selectedCategory.id);
    setEditingCat(false); setCatMenu(false); fetchData();
  };
  const toggleCategoryActive = async (cat: Category) => {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    setSelectedCategory({ ...cat, is_active: !cat.is_active }); setCatMenu(false); fetchData();
  };
  const deleteCategory = async (id: string) => {
    if (!confirm('Category delete karna hai?')) return;
    await supabase.from('categories').delete().eq('id', id);
    setIsCatModal(false); fetchData();
  };

  // Product CRUD
  const saveProduct = async () => {
    if (!selectedProduct) return;
    await supabase.from('products').update(selectedProduct).eq('id', selectedProduct.id);
    setEditingProd(false); setProdMenu(false); fetchData();
  };
  const toggleProductActive = async (prod: Product) => {
    await supabase.from('products').update({ is_active: !prod.is_active }).eq('id', prod.id);
    setSelectedProduct({ ...prod, is_active: !prod.is_active }); setProdMenu(false); fetchData();
  };
  const deleteProduct = async (id: string) => {
    if (!confirm('Product delete karna hai?')) return;
    await supabase.from('products').delete().eq('id', id);
    setIsProdModal(false); fetchData();
  };

  // Tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'products', label: 'Products', icon: '📁' },
    { id: 'categories', label: 'Categories', icon: '🗂️' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'delivery', label: 'Delivery Boys', icon: '🛵' },
    { id: 'branches', label: 'Branches', icon: '🏬' },
    { id: 'charges', label: 'Delivery Charges', icon: '💰' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f8', color: '#111827', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .sidebar { width: 250px; background: #ffffff; border-right: 1px solid #e5e7eb; padding: 20px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 12px; cursor: pointer; border-radius: 8px; margin-bottom: 5px; color: #4b5563; }
        .nav-item:hover { background: #f3f4f6; color: #111827; }
        .nav-item.active { background: #111827; color: #ffffff; }
        .content { flex: 1; padding: 20px; }
        .panel { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        input, select { background: #f9fafb; border: 1px solid #d1d5db; color: #111827; padding: 10px; border-radius: 8px; width: 100%; margin-bottom: 10px; font-size: 14px; }
        .btn { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; color: #fff; }
        .btn-black { background: #111827; }
        .btn-green { background: #059669; }
        .btn-red { background: #dc2626; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600; font-size: 13px; }
        td { padding: 12px; border-bottom: 1px solid #f3f4f6; }
        .status-pill { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .active { background: #d1fae5; color: #065f46; }
        .inactive { background: #fee2e2; color: #991b1b; }
        .modal-scrim{position:fixed; inset:0; background:rgba(0,0,0,0.4); backdrop-filter:blur(4px); display:none; align-items:center; justify-content:center; z-index:300; padding:20px;}
        .modal-scrim.show{display:flex;}
        .modal-card{width:100%; max-width:420px; background:#fff; border:1px solid #e5e7eb; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,0.1); position:relative;}
        .modal-head{display:flex; align-items:center; gap:10px; padding:20px; border-bottom:1px solid #e5e7eb;}
        .modal-close{margin-left:auto; width:30px;height:30px;border-radius:8px; background:#f3f4f6; color:#6b7280; display:flex; align-items:center; justify-content:center; cursor:pointer;}
        .dots-btn{width:30px;height:30px;border-radius:8px; background:#f3f4f6; color:#6b7280; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:18px;}
        .dots-menu{position:absolute; top:60px; right:20px; min-width:150px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; box-shadow:0 10px 20px rgba(0,0,0,0.1); overflow:hidden; z-index:20; display:none;}
        .dots-menu.show{display:block;}
        .dots-menu button{width:100%; text-align:left; background:none; border:none; color:#111827; padding:10px 14px; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:8px;}
        .dots-menu button:hover{background:#f3f4f6;}
        .dots-menu button.danger{color:#dc2626;}
        .modal-body{padding:18px 20px;}
        .detail-row{display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f3f4f6; font-size:14px;}
        .detail-row .dl{color:#6b7280;}
        .detail-row .dv{font-weight:600;}
      `}</style>

      <div className="sidebar">
        <h2 style={{ marginBottom: '30px' }}>FYNTAS Admin</h2>
        {tabs.map(tab => (
          <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span>{tab.icon}</span> {tab.label}
          </div>
        ))}
        <div className="nav-item" style={{ marginTop: '30px' }} onClick={onLogout}>🚪 Logout</div>
      </div>

      <div className="content">
        {activeTab === 'dashboard' && (
          <div className="panel">
            <h3>Dashboard Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                <h2>{orders.length}</h2><p>Orders</p>
              </div>
              <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                <h2>{customers.length}</h2><p>Customers</p>
              </div>
              <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                <h2>{products.length}</h2><p>Products</p>
              </div>
              <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                <h2>{deliveryBoys.length}</h2><p>Delivery Boys</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="panel">
            <h3>All Categories</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input placeholder="Category Name" value={catName} onChange={(e) => setCatName(e.target.value)} />
              <input placeholder="Short Code" value={catShort} onChange={(e) => setCatShort(e.target.value)} />
              <input type="file" accept="image/*" onChange={(e) => setCatImg(e.target.files?.[0] || null)} />
              <button className="btn btn-black" onClick={addCategory}>Add</button>
            </div>
            <table>
              <thead><tr><th>Image</th><th>Name</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td>{cat.image_url ? <img src={cat.image_url} alt="cat" style={{ width: 40, height: 40, borderRadius: 8 }} /> : 'No Img'}</td>
                    <td>{cat.name}</td>
                    <td><span className={`status-pill ${cat.is_active ? 'active' : 'inactive'}`}>{cat.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td><div className="dots-btn" onClick={() => { setSelectedCategory(cat); setIsCatModal(true); setCatMenu(false); setEditingCat(false); }}>⋮</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="panel">
            <h3>Add Product (Direct Upload)</h3>
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
                {discountType !== 'none' && <input placeholder="Discount Value" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />}
              </div>
              {[0, 1, 2, 3].map((idx) => (
                <input key={idx} type="file" accept="image/*" placeholder={`Image ${idx + 1}`} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setProdImages(prev => { const newImages = [...prev]; newImages[idx] = file; return newImages; });
                }} />
              ))}
            </div>
            <button className="btn btn-green" style={{ marginTop: '10px' }} onClick={addProduct}>Add Product</button>

            <h3 style={{ marginTop: '20px' }}>All Products</h3>
            <table>
              <thead><tr><th>Name</th><th>SKU</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>₹{p.price}</td>
                    <td><span className={`status-pill ${p.is_active ? 'active' : 'inactive'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td><div className="dots-btn" onClick={() => { setSelectedProduct(p); setIsProdModal(true); setProdMenu(false); setEditingProd(false); }}>⋮</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>All Customers ({customers.length})</h3>
              <button className="btn btn-black" onClick={exportCustomers}>Export Excel (CSV)</button>
            </div>
            <table>
              <thead><tr><th>Name</th><th>Mobile Number</th><th>Joined</th></tr></thead>
              <tbody>
                {customers.length === 0 ? <tr><td colSpan={3} style={{ textAlign: 'center' }}>Abhi koi customer nahi hai</td></tr> : (
                  customers.map(c => (
                    <tr key={c.id}>
                      <td>{c.name || 'Unknown'}</td>
                      <td>{c.mobile}</td>
                      <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Baaki tabs */}
        {activeTab === 'orders' && <div className="panel"><h3>Orders</h3>{orders.length === 0 ? <p>Abhi koi order nahi!</p> : <p>Total Orders: {orders.length}</p>}</div>}
        {activeTab === 'delivery' && <div className="panel"><h3>Delivery Boys</h3>{deliveryBoys.map(b => <div key={b.id}>{b.name} - {b.mobile}</div>)}</div>}
        {activeTab === 'branches' && <div className="panel"><h3>Branches</h3>{branches.map(b => <div key={b.id}>{b.name}</div>)}</div>}
        {activeTab === 'charges' && <div className="panel"><h3>Delivery Charges</h3>{tiers.map(t => <div key={t.id}>{t.min_km} - {t.max_km} KM: ₹{t.price}</div>)}</div>}
      </div>

      {/* Category Modal */}
      <div className={`modal-scrim ${isCatModal ? 'show' : ''}`} onClick={() => setIsCatModal(false)}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h3>{selectedCategory?.name}</h3>
            <div style={{ position: 'relative', marginLeft: 'auto' }}>
              <div className="dots-btn" onClick={() => setCatMenu(!catMenu)}>⋮</div>
              <div className={`dots-menu ${catMenu ? 'show' : ''}`}>
                <button onClick={() => setEditingCat(true)}>✏️ Edit</button>
                <button onClick={() => toggleCategoryActive(selectedCategory!)}>{selectedCategory?.is_active ? '🚫 Deactivate' : '✅ Activate'}</button>
                <button className="danger" onClick={() => deleteCategory(selectedCategory!.id)}>🗑️ Delete</button>
              </div>
            </div>
            <div className="modal-close" onClick={() => setIsCatModal(false)}>✕</div>
          </div>
          <div className="modal-body">
            {editingCat ? (
              <>
                <div className="detail-row"><span className="dl">Name</span><input value={selectedCategory!.name} onChange={(e) => setSelectedCategory({ ...selectedCategory!, name: e.target.value })} /></div>
                <div className="detail-row"><span className="dl">Short</span><input value={selectedCategory!.short_name} onChange={(e) => setSelectedCategory({ ...selectedCategory!, short_name: e.target.value })} /></div>
                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button className="btn btn-red" onClick={() => setEditingCat(false)}>Cancel</button>
                  <button className="btn btn-black" onClick={saveCategory}>Save</button>
                </div>
              </>
            ) : (
              <div className="detail-row"><span className="dl">Status</span><span className="dv">{selectedCategory?.is_active ? 'Active' : 'Inactive'}</span></div>
            )}
          </div>
        </div>
      </div>

      {/* Product Modal */}
      <div className={`modal-scrim ${isProdModal ? 'show' : ''}`} onClick={() => setIsProdModal(false)}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h3>{selectedProduct?.name}</h3>
            <div style={{ position: 'relative', marginLeft: 'auto' }}>
              <div className="dots-btn" onClick={() => setProdMenu(!prodMenu)}>⋮</div>
              <div className={`dots-menu ${prodMenu ? 'show' : ''}`}>
                <button onClick={() => setEditingProd(true)}>✏️ Edit</button>
                <button onClick={() => toggleProductActive(selectedProduct!)}>{selectedProduct?.is_active ? '🚫 Deactivate' : '✅ Activate'}</button>
                <button className="danger" onClick={() => deleteProduct(selectedProduct!.id)}>🗑️ Delete</button>
              </div>
            </div>
            <div className="modal-close" onClick={() => setIsProdModal(false)}>✕</div>
          </div>
          <div className="modal-body">
            {editingProd ? (
              <>
                <div className="detail-row"><span className="dl">Name</span><input value={selectedProduct!.name} onChange={(e) => setSelectedProduct({ ...selectedProduct!, name: e.target.value })} /></div>
                <div className="detail-row"><span className="dl">Price</span><input type="number" value={selectedProduct!.price} onChange={(e) => setSelectedProduct({ ...selectedProduct!, price: parseFloat(e.target.value) })} /></div>
                <div className="detail-row"><span className="dl">Stock</span><input type="number" value={selectedProduct!.stock} onChange={(e) => setSelectedProduct({ ...selectedProduct!, stock: parseFloat(e.target.value) })} /></div>
                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button className="btn btn-red" onClick={() => setEditingProd(false)}>Cancel</button>
                  <button className="btn btn-black" onClick={saveProduct}>Save</button>
                </div>
              </>
            ) : (
              <>
                <div className="detail-row"><span className="dl">SKU</span><span className="dv">{selectedProduct?.sku}</span></div>
                <div className="detail-row"><span className="dl">Price</span><span className="dv">₹{selectedProduct?.price}</span></div>
                <div className="detail-row"><span className="dl">Status</span><span className="dv">{selectedProduct?.is_active ? 'Active' : 'Inactive'}</span></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
