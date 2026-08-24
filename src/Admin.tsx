import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

// Interfaces
interface Branch { id: string; name: string; address?: string; lat: number; lng: number; is_active: boolean; delivery_range_km: number; max_delivery_km: number; }
interface Settings { id: string; base_fare: number; }
interface Tier { id: string; min_km: number; max_km: number; price: number; }
interface Category { id: string; name: string; short_name: string; image_url?: string; is_active: boolean; }
interface Product { id: string; name: string; sku: string; price: number; stock: number; unit: string; description?: string; discount_type: string; discount_value: number; gst_enabled: boolean; gst_rate: number; is_active: boolean; category_id?: string; image_url?: string; image_2?: string; image_3?: string; image_4?: string; }
interface Order { id: string; customer_name: string; customer_mobile: string; address: string; total_amount: number; delivery_charge: number; status: string; delivery_boy_id: string | null; created_at: string; }
interface DeliveryBoy { id: string; name: string; mobile: string; aadhar?: string; address?: string; is_active: boolean; }
interface Customer { id: string; name: string; mobile: string; created_at: string; }
interface Banner { id: string; title: string; image_url: string; is_active: boolean; }
interface AppPage { id: string; page_key: string; content: string; }
interface InvoiceSettings { id: string; welcome_note: string; terms: string; footer: string; }

const UNITS = ['Pcs', 'Kg', 'Gram', 'Liter', 'ML', 'Half Plate', 'Full Plate', 'Dozen', 'Packet', 'Box'];
const GST_RATES = [0, 5, 12, 18, 28];

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
  const [banners, setBanners] = useState<Banner[]>([]);
  const [appPages, setAppPages] = useState<AppPage[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({ id: '', welcome_note: '', terms: '', footer: '' });

  // Order Management States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Modal & Menu States
  const [selectedOrderForView, setSelectedOrderForView] = useState<Order | null>(null);
  const [openOrderMenuId, setOpenOrderMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [editingProductFull, setEditingProductFull] = useState<Product | null>(null);
  const [selectedPage, setSelectedPage] = useState('about');
  const [currentContent, setCurrentContent] = useState('');

  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImg, setBannerImg] = useState<File | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodUnit, setProdUnit] = useState('Pcs');
  const [prodDesc, setProdDesc] = useState('');
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState('');
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState(0);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [catName, setCatName] = useState('');
  const [catShort, setCatShort] = useState('');
  const [catImg, setCatImg] = useState<File | null>(null);
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

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCatModal, setIsCatModal] = useState(false);
  const [catMenu, setCatMenu] = useState(false);
  const [editingCat, setEditingCat] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProdModal, setIsProdModal] = useState(false);
  const [prodMenu, setProdMenu] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isBranchModal, setIsBranchModal] = useState(false);
  const [branchMenu, setBranchMenu] = useState(false);
  const [editingBranch, setEditingBranch] = useState(false);
  const [selectedBoy, setSelectedBoy] = useState<DeliveryBoy | null>(null);
  const [isBoyModal, setIsBoyModal] = useState(false);
  const [boyMenu, setBoyMenu] = useState(false);
  const [editingBoy, setEditingBoy] = useState(false);
  const [originalBoyMobile, setOriginalBoyMobile] = useState('');

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
    if (pages.data && pages.data.length > 0) setAppPages(pages.data);
    if (inv.data) setInvoiceSettings(inv.data);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Auto-Refresh
    return () => clearInterval(interval);
  }, []);

  // Close 3-dot menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenOrderMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const uploadImage = async (file: File) => {
    const path = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) return '';
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  // ---- Product Functions (Same as before) ----
  const handleStartEditProduct = (product: Product) => {
    setEditingProductFull(product);
    setProdName(product.name); setProdSku(product.sku || ''); setProdCat(product.category_id || '');
    setProdPrice(product.price.toString()); setProdStock(product.stock.toString());
    setProdUnit(product.unit || 'Pcs'); setProdDesc(product.description || '');
    setDiscountType(product.discount_type || 'none'); setDiscountValue(product.discount_value ? product.discount_value.toString() : '');
    setGstEnabled(product.gst_enabled); setGstRate(product.gst_rate);
    setMainImage(null); setGalleryImages([]); setIsProdModal(false);
  };

  const handleCancelEditProduct = () => {
    setEditingProductFull(null);
    setProdName(''); setProdSku(''); setProdCat(''); setProdPrice(''); setProdStock('');
    setProdUnit('Pcs'); setProdDesc(''); setDiscountType('none'); setDiscountValue('');
    setGstEnabled(false); setGstRate(0); setMainImage(null); setGalleryImages([]);
  };

  const addOrUpdateProduct = async () => {
    if (!prodName || !prodCat || !prodPrice) return alert('Product name, category aur price do!');
    let mainImageUrl = editingProductFull?.image_url || '';
    if (mainImage) { const url = await uploadImage(mainImage); if (url) mainImageUrl = url; }
    const galleryUrls = [editingProductFull?.image_2 || '', editingProductFull?.image_3 || '', editingProductFull?.image_4 || ''];
    if (galleryImages.length > 0) {
      for (let i = 0; i < galleryImages.length; i++) {
        const url = await uploadImage(galleryImages[i]);
        if (url) galleryUrls[i] = url;
      }
    }
    const productData = {
      name: prodName, sku: prodSku, category_id: prodCat,
      price: parseFloat(prodPrice) || 0, stock: parseInt(prodStock) || 0,
      unit: prodUnit, description: prodDesc,
      image_url: mainImageUrl, image_2: galleryUrls[0] || '', image_3: galleryUrls[1] || '', image_4: galleryUrls[2] || '',
      discount_type: discountType, discount_value: parseFloat(discountValue) || 0,
      gst_enabled: gstEnabled, gst_rate: gstRate
    };
    if (editingProductFull) {
      const { error } = await supabase.from('products').update(productData).eq('id', editingProductFull.id);
      if (error) { alert('Product update nahi hua: ' + error.message); return; }
      alert('Product Updated!');
    } else {
      const { error } = await supabase.from('products').insert(productData);
      if (error) { alert('Product add nahi hua: ' + error.message); return; }
      alert('Product Added!');
    }
    handleCancelEditProduct(); fetchData();
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

  const addCategory = async () => {
    if (!catName || !catShort) return alert('Category naam aur short code do!');
    let imgUrl = '';
    if (catImg) imgUrl = await uploadImage(catImg);
    await supabase.from('categories').insert({ name: catName, short_name: catShort, image_url: imgUrl });
    setCatName(''); setCatShort(''); setCatImg(null); fetchData();
  };

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

  const addBranch = async () => {
    if (!newBranchName || !newBranchLat || !newBranchLng) return alert('Branch name, Lat aur Lng zaroori hain!');
    await supabase.from('branches').insert({ name: newBranchName, address: newBranchAddress, lat: parseFloat(newBranchLat), lng: parseFloat(newBranchLng), delivery_range_km: parseFloat(newBranchRange) || 10, max_delivery_km: parseFloat(newBranchMaxKm) || 15 });
    setNewBranchName(''); setNewBranchAddress(''); setNewBranchLat(''); setNewBranchLng(''); setNewBranchRange('10'); setNewBranchMaxKm('15'); fetchData();
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
    await supabase.from('branches').update({ is_active: !branch.is_active }).eq('id', branch.id);
    setSelectedBranch({ ...branch, is_active: !branch.is_active }); setBranchMenu(false); fetchData();
  };

  const addDeliveryBoy = async () => {
    if (!dbName || !dbMobile) return alert('Name aur Mobile zaroori hain!');
    await supabase.from('delivery_boys').insert({ name: dbName, mobile: dbMobile, aadhar: dbAadhar, address: dbAddress });
    await supabase.from('registered_users').insert({ mobile: dbMobile, role: 'delivery_boy' });
    setDbName(''); setDbMobile(''); setDbAadhar(''); setDbAddress(''); fetchData();
  };

  const saveBoy = async () => {
    if (!selectedBoy) return;
    const { error } = await supabase.from('delivery_boys').update(selectedBoy).eq('id', selectedBoy.id);
    if (error) { alert('Update error: ' + error.message); return; }
    if (originalBoyMobile !== selectedBoy.mobile) {
      await supabase.from('registered_users').update({ mobile: selectedBoy.mobile }).eq('mobile', originalBoyMobile);
    }
    setEditingBoy(false); setBoyMenu(false); fetchData();
  };

  const deleteBoy = async (id: string) => {
    if (!confirm('Delivery boy delete karna hai?')) return;
    await supabase.from('delivery_boys').delete().eq('id', id);
    setIsBoyModal(false); fetchData();
  };

  const toggleBoyActive = async (boy: DeliveryBoy) => {
    await supabase.from('delivery_boys').update({ is_active: !boy.is_active }).eq('id', boy.id);
    setSelectedBoy({ ...boy, is_active: !boy.is_active }); setBoyMenu(false); fetchData();
  };

  // ---- ORDER MANAGEMENT NEW FUNCTIONS ----
  const handleStatusChange = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    fetchData();
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Kya aap yeh order delete karna chahte hain?')) return;
    // Delete order items first then order
    await supabase.from('order_items').delete().eq('order_id', orderId);
    await supabase.from('orders').delete().eq('id', orderId);
    setOpenOrderMenuId(null);
    fetchData();
  };

  const printReceipt = (orderId: string, format: string) => {
    window.open(`/invoice/${orderId}?format=${format}`, '_blank');
  };

  const assignDeliveryBoy = async (orderId: string, boyId: string) => {
    if (!boyId) return;
    await supabase.from('orders').update({ delivery_boy_id: boyId }).eq('id', orderId);
    setOpenOrderMenuId(null); // Close menu after assignment
    fetchData();
  };

  // ---- Pagination Logic ----
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.customer_mobile.includes(searchQuery) ||
                          order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // ---- Invoice Settings Functions ----
  const saveInvoiceSettings = async () => {
    await supabase.from('invoice_settings').upsert(invoiceSettings);
    alert('Invoice Settings Saved!');
    fetchData();
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

  // Map user-friendly labels to DB statuses
  const statusOptions = [
    { value: 'pending', label: 'NEW' },
    { value: 'accepted', label: 'CONFIRMED' },
    { value: 'processing', label: 'PROCESSING' },
    { value: 'out_for_delivery', label: 'OUT_FOR_DELIVERY' },
    { value: 'delivered', label: 'DELIVERED' },
    { value: 'completed', label: 'COMPLETED' },
    { value: 'cancelled', label: 'CANCELLED' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa', color: '#111111', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .sidebar { width: 250px; background: #ffffff; border-right: 1px solid #f3f4f6; padding: 20px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 12px; cursor: pointer; border-radius: 8px; margin-bottom: 5px; color: #6b7280; }
        .nav-item:hover { background: #f3f4f6; color: #111111; }
        .nav-item.active { background: #111111; color: #ffffff; }
        .content { flex: 1; padding: 20px; }
        .panel { background: #ffffff; border: 1px solid #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        input, select, textarea { background: #ffffff; border: 1px solid #e5e7eb; color: #111111; padding: 10px; border-radius: 8px; width: 100%; margin-bottom: 10px; font-size: 14px; }
        .btn { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; color: #fff; }
        .btn-black { background: #111111; }
        .btn-green { background: #059669; }
        .btn-red { background: #dc2626; }
        .btn-blue { background: #2563eb; }
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
        .dots-menu button{width:100%; text-align:left; background:none; border:none; color:#111111; padding:10px 14px; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:8px;}
        .dots-menu button:hover{background:#f3f4f6;}
        .dots-menu button.danger{color:#dc2626;}
        .modal-body{padding:18px 20px;}
        .detail-row{display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f3f4f6; font-size:14px;}
        .detail-row .dl{color:#6b7280;}
        .detail-row .dv{font-weight:600;}
        .modal-body input { width: 100%; text-align: left; margin-bottom: 5px; }
        
        /* Order Table Styles */
        .table-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .search-box { max-width: 300px; position: relative; }
        .order-table { width: 100%; border-collapse: collapse; }
        .order-table th { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; font-weight: 600; }
        .order-table td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; vertical-align: middle; }
        .order-table tr:hover { background: #f8f9fa; }
        .menu-wrapper { position: relative; display: inline-block; }
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
        {activeTab === 'dashboard' && (
          <div className="panel">
            <h3>Dashboard Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}><h2>{orders.length}</h2><p>Orders</p></div>
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}><h2>{customers.length}</h2><p>Customers</p></div>
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}><h2>{products.length}</h2><p>Products</p></div>
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}><h2>{deliveryBoys.length}</h2><p>Delivery Boys</p></div>
            </div>
          </div>
        )}

        {/* NEW ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="panel">
            <div className="table-controls">
              <h3 style={{ margin: 0 }}>All Orders</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '10px' }}
                  />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: '150px' }}>
                  <option value="all">All Status</option>
                  {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <select style={{ maxWidth: '70px' }}>
                  <option>10</option>
                </select>
              </div>
            </div>

            <table className="order-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Order No</th>
                  <th>Customer</th>
                  <th>Delivery Address</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>No orders found</td></tr> : (
                  currentOrders.map(order => (
                    <tr key={order.id}>
                      <td>#{order.id.slice(0, 4)}</td>
                      <td style={{ fontWeight: '600' }}>ORD{order.id.slice(0, 6).toUpperCase()}</td>
                      <td>
                        {order.customer_name}
                        <br /><span style={{ fontSize: '11px', color: '#6b7280' }}>{order.customer_mobile}</span>
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.address}
                      </td>
                      <td style={{ fontWeight: '700' }}>₹{order.total_amount}</td>
                      <td>{order.payment_method === 'upi' ? 'UPI' : 'COD'}</td>
                      <td>
                        {/* Manual Status Change Dropdown */}
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', border: '1px solid #d1d5db', borderRadius: '4px' }}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>{new Date(order.created_at).toLocaleString()}</td>
                      <td>
                        {/* 3-Dot Menu */}
                        <div className="menu-wrapper" ref={menuRef}>
                          <button
                            className="dots-btn"
                            onClick={() => setOpenOrderMenuId(openOrderMenuId === order.id ? null : order.id)}
                          >
                            ⋮
                          </button>
                          <div className={`dots-menu ${openOrderMenuId === order.id ? 'show' : ''}`}>
                            <button onClick={() => { setSelectedOrderForView(order); setOpenOrderMenuId(null); }}>👁️ View Details</button>
                            <div style={{ borderTop: '1px solid #f3f4f6', padding: '5px 0' }}>
                              <div style={{ padding: '0 14px', fontSize: '11px', color: '#6b7280' }}>Print Receipt</div>
                              <button onClick={() => printReceipt(order.id, 'a4')}>🖨️ Normal (A4)</button>
                              <button onClick={() => printReceipt(order.id, 'thermal-80')}>🖨️ Thermal 80mm</button>
                              <button onClick={() => printReceipt(order.id, 'thermal-58')}>🖨️ Thermal 58mm</button>
                            </div>
                            <div style={{ borderTop: '1px solid #f3f4f6' }}>
                              <select
                                value={order.delivery_boy_id || ''}
                                onChange={(e) => assignDeliveryBoy(order.id, e.target.value)}
                                style={{ padding: '8px 14px', width: '100%', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: '#111111' }}
                              >
                                <option value="">🛵 Assign Boy</option>
                                {deliveryBoys.filter(b => b.is_active).map(boy => (
                                  <option key={boy.id} value={boy.id}>{boy.name}</option>
                                ))}
                              </select>
                            </div>
                            <button className="danger" onClick={() => deleteOrder(order.id)}>🗑️ Delete</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
              <button
                className="btn btn-black"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </button>
              <span style={{ fontSize: '13px' }}>Page {currentPage} of {Math.ceil(filteredOrders.length / ordersPerPage)}</span>
              <button
                className="btn btn-black"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => currentPage < Math.ceil(filteredOrders.length / ordersPerPage) && paginate(currentPage + 1)}
                disabled={currentPage >= Math.ceil(filteredOrders.length / ordersPerPage)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ... (Baaki Tabs: Products, Categories, Customers, Delivery, Branches, Charges, Banners, Invoice Settings, Profile, Policies, Content) ... */}
        {/* ...(Yahan pichle wale saare tabs ka code waisa hi rahega, maine Order tab ko replace kiya hai)... */}
        
        {/* Baaki tabs ka code yahan paste kar do, kyunki pichle response mein full code diya tha. */}
        {/* NOTE: Aapko bas 'products', 'categories', 'customers', 'delivery', 'branches', 'charges', 'banners', 'invoice_settings', 'profile', 'policies', 'content' ke sections wahi rakhne hain jo pichle code mein the. */}

        {/* View Order Details Modal */}
        {selectedOrderForView && (
          <div className={`modal-scrim show`} onClick={() => setSelectedOrderForView(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Order Details</h3>
                <div className="modal-close" onClick={() => setSelectedOrderForView(null)}>✕</div>
              </div>
              <div className="modal-body">
                <div className="detail-row"><span className="dl">Order ID</span><span className="dv">ORD{selectedOrderForView.id.slice(0, 6).toUpperCase()}</span></div>
                <div className="detail-row"><span className="dl">Customer</span><span className="dv">{selectedOrderForView.customer_name}</span></div>
                <div className="detail-row"><span className="dl">Mobile</span><span className="dv">{selectedOrderForView.customer_mobile}</span></div>
                <div className="detail-row"><span className="dl">Address</span><span className="dv">{selectedOrderForView.address}</span></div>
                <div className="detail-row"><span className="dl">Delivery Charge</span><span className="dv">₹{selectedOrderForView.delivery_charge}</span></div>
                <div className="detail-row"><span className="dl">Total</span><span className="dv" style={{ fontWeight: 'bold', color: '#059669' }}>₹{selectedOrderForView.total_amount}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
