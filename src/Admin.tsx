import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

// Interfaces
interface Branch { id: string; name: string; address?: string; lat: number; lng: number; is_active: boolean; delivery_range_km: number; max_delivery_km: number; }
interface Settings { id: string; base_fare: number; }
interface Tier { id: string; min_km: number; max_km: number; price: number; }
interface Category { id: string; name: string; short_name: string; image_url?: string; is_active: boolean; }
interface Product { id: string; name: string; sku: string; price: number; stock: number; unit: string; description?: string; discount_type: string; discount_value: number; gst_enabled: boolean; gst_rate: number; is_active: boolean; category_id?: string; image_url?: string; image_2?: string; image_3?: string; image_4?: string; }
interface Order { id: string; customer_name: string; customer_mobile: string; address: string; total_amount: number; delivery_charge: number; status: string; delivery_boy_id: string | null; created_at: string; payment_method: string; payment_status: string; }
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

  // Inventory States
  const [inventorySearch, setInventorySearch] = useState('');

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

  // ---- Product Functions ----
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

  // ---- Category Functions ----
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

  // ---- Branch Functions ----
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

  // ---- Delivery Boy Functions ----
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

  // ---- Order Management ----
  const handleStatusChange = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    fetchData();
  };
  const deleteOrder = async (orderId: string) => {
    if (!confirm('Kya aap yeh order delete karna chahte hain?')) return;
    await supabase.from('order_items').delete().eq('order_id', orderId);
    await supabase.from('orders').delete().eq('id', orderId);
    setOpenOrderMenuId(null); fetchData();
  };
  const printReceipt = (orderId: string, format: string) => {
    window.open(`/invoice/${orderId}?format=${format}`, '_blank');
  };
  const assignDeliveryBoy = async (orderId: string, boyId: string) => {
    if (!boyId) return;
    await supabase.from('orders').update({ delivery_boy_id: boyId }).eq('id', orderId);
    setOpenOrderMenuId(null); fetchData();
  };

  // ---- Inventory Management ----
  const updateStock = async (productId: string, newStock: number) => {
    await supabase.from('products').update({ stock: newStock }).eq('id', productId);
    fetchData();
    alert('Stock updated!');
  };

  // ---- Pagination & Filter Logic ----
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || order.customer_mobile.includes(searchQuery) || order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // ---- Tier Functions ----
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

  // ---- Banner Functions ----
  const addBanner = async () => {
    if (!bannerTitle || !bannerImg) return alert('Banner ka title aur image do!');
    let imgUrl = '';
    if (bannerImg) imgUrl = await uploadImage(bannerImg);
    await supabase.from('banners').insert({ title: bannerTitle, image_url: imgUrl });
    setBannerTitle(''); setBannerImg(null); fetchData();
  };
  const toggleBannerActive = async (banner: Banner) => {
    await supabase.from('banners').update({ is_active: !banner.is_active }).eq('id', banner.id);
    fetchData();
  };
  const deleteBanner = async (id: string) => {
    if (!confirm('Banner delete karna hai?')) return;
    await supabase.from('banners').delete().eq('id', id);
    fetchData();
  };

  // ---- App Content Functions ----
  const handleSelectPage = (key: string) => {
    setSelectedPage(key);
    const page = appPages.find(p => p.page_key === key);
    setCurrentContent(page ? page.content : '');
  };
  const saveContent = async () => {
    const { error } = await supabase.from('app_pages').upsert(
      { page_key: selectedPage, content: currentContent },
      { onConflict: 'page_key' }
    );
    if (!error) { alert('Content saved successfully!'); fetchData(); }
    else { alert('Error: ' + error.message); }
  };

  // ---- Invoice Settings ----
  const saveInvoiceSettings = async () => {
    await supabase.from('invoice_settings').upsert(invoiceSettings);
    alert('Invoice Settings Saved!'); fetchData();
  };

  // ---- Export ----
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
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'inventory', label: 'Inventory', icon: '📦' }, // Inventory tab add!
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

  const statusOptions = [
    { value: 'pending', label: 'NEW' }, { value: 'accepted', label: 'CONFIRMED' },
    { value: 'processing', label: 'PROCESSING' }, { value: 'out_for_delivery', label: 'OUT_FOR_DELIVERY' },
    { value: 'delivered', label: 'DELIVERED' }, { value: 'completed', label: 'COMPLETED' },
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
        .btn-black { background: #111111; } .btn-green { background: #059669; } .btn-red { background: #dc2626; } .btn-blue { background: #2563eb; }
        .status-pill { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .active { background: #d1fae5; color: #065f46; } .inactive { background: #fee2e2; color: #991b1b; }
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
        .detail-row .dl{color:#6b7280;} .detail-row .dv{font-weight:600;}
        .modal-body input { width: 100%; text-align: left; margin-bottom: 5px; }
        .table-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
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

        {activeTab === 'orders' && (
          <div className="panel">
            <div className="table-controls">
              <h3 style={{ margin: 0 }}>All Orders</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ maxWidth: '200px' }} />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: '150px' }}>
                  <option value="all">All Status</option>
                  {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            <table className="order-table">
              <thead>
                <tr><th>ID</th><th>Order No</th><th>Customer</th><th>Delivery Address</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {currentOrders.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>No orders found</td></tr> : (
                  currentOrders.map(order => (
                    <tr key={order.id}>
                      <td>#{order.id.slice(0, 4)}</td>
                      <td style={{ fontWeight: '600' }}>ORD{order.id.slice(0, 6).toUpperCase()}</td>
                      <td>{order.customer_name}<br /><span style={{ fontSize: '11px', color: '#6b7280' }}>{order.customer_mobile}</span></td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.address}</td>
                      <td style={{ fontWeight: '700' }}>₹{order.total_amount}</td>
                      <td>{order.payment_method === 'upi' ? 'UPI' : 'COD'}</td>
                      <td>
                        <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                          {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </td>
                      <td>{new Date(order.created_at).toLocaleString()}</td>
                      <td>
                        <div className="menu-wrapper" ref={menuRef}>
                          <button className="dots-btn" onClick={() => setOpenOrderMenuId(openOrderMenuId === order.id ? null : order.id)}>⋮</button>
                          <div className={`dots-menu ${openOrderMenuId === order.id ? 'show' : ''}`}>
                            <button onClick={() => { setSelectedOrderForView(order); setOpenOrderMenuId(null); }}>👁️ View Details</button>
                            <div style={{ borderTop: '1px solid #f3f4f6', padding: '5px 0' }}>
                              <div style={{ padding: '0 14px', fontSize: '11px', color: '#6b7280' }}>Print Receipt</div>
                              <button onClick={() => printReceipt(order.id, 'a4')}>🖨️ Normal (A4)</button>
                              <button onClick={() => printReceipt(order.id, 'thermal-80')}>🖨️ Thermal 80mm</button>
                              <button onClick={() => printReceipt(order.id, 'thermal-58')}>🖨️ Thermal 58mm</button>
                            </div>
                            <div style={{ borderTop: '1px solid #f3f4f6' }}>
                              <select value={order.delivery_boy_id || ''} onChange={(e) => assignDeliveryBoy(order.id, e.target.value)} style={{ padding: '8px 14px', width: '100%', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: '#111111' }}>
                                <option value="">🛵 Assign Boy</option>
                                {deliveryBoys.filter(b => b.is_active).map(boy => <option key={boy.id} value={boy.id}>{boy.name}</option>)}
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

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
              <button className="btn btn-black" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => currentPage > 1 && paginate(currentPage - 1)} disabled={currentPage <= 1}>Previous</button>
              <span style={{ fontSize: '13px' }}>Page {currentPage} of {Math.ceil(filteredOrders.length / ordersPerPage)}</span>
              <button className="btn btn-black" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => currentPage < Math.ceil(filteredOrders.length / ordersPerPage) && paginate(currentPage + 1)} disabled={currentPage >= Math.ceil(filteredOrders.length / ordersPerPage)}>Next</button>
            </div>
          </div>
        )}

        {/* Inventory Tab (NEW!) */}
        {activeTab === 'inventory' && (
          <div className="panel">
            <div className="table-controls">
              <h3 style={{ margin: 0 }}>Inventory Management</h3>
              <input type="text" placeholder="Search products..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} style={{ maxWidth: '200px' }} />
            </div>
            <table>
              <thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Current Stock</th><th>Update Stock</th></tr></thead>
              <tbody>
                {products.filter(p => p.name.toLowerCase().includes(inventorySearch.toLowerCase())).map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>₹{p.price}</td>
                    <td>{p.stock}</td>
                    <td>
                      <input type="number" defaultValue={p.stock} onBlur={(e) => updateStock(p.id, parseFloat(e.target.value))} style={{ width: '80px' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="panel">
            {editingProductFull ? (
              <>
                <h3>Edit Product (Units + 4 Images + GST)</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <button className="btn btn-red" onClick={handleCancelEditProduct}>← Back to Add/List</button>
                  <h3 style={{ margin: 0 }}>{editingProductFull.name}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input placeholder="SKU Code" value={prodSku} onChange={(e) => setProdSku(e.target.value)} />
                  <input placeholder="Product Name" value={prodName} onChange={(e) => setProdName(e.target.value)} />
                  <select value={prodCat} onChange={(e) => setProdCat(e.target.value)}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input placeholder="Price (₹)" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
                  <input placeholder="Stock" value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
                  <select value={prodUnit} onChange={(e) => setProdUnit(e.target.value)}>
                    {UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                  <textarea placeholder="Product Description" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={2}></textarea>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                      <option value="none">No Discount</option>
                      <option value="percent">Percentage (%)</option>
                      <option value="amount">Flat Amount (₹)</option>
                    </select>
                    {discountType !== 'none' && <input placeholder="Discount Value" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label><input type="checkbox" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} /> Enable GST</label>
                    {gstEnabled && <select value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value))}>{GST_RATES.map(rate => <option key={rate} value={rate}>{rate}%</option>)}</select>}
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Main Image {editingProductFull.image_url && <span style={{ color: 'green' }}>(Current Has Image)</span>}</label>
                    <input type="file" accept="image/*" onChange={(e) => setMainImage(e.target.files?.[0] || null)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Gallery Images (3) {editingProductFull.image_2 && <span style={{ color: 'green' }}>(Current Has Gallery)</span>}</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => setGalleryImages(Array.from(e.target.files || []).slice(0, 3))} />
                  </div>
                </div>
                <button className="btn btn-green" style={{ marginTop: '10px' }} onClick={addOrUpdateProduct}>Update Product</button>
              </>
            ) : (
              <>
                <h3>Add Product (Units + 4 Images + GST)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input placeholder="SKU Code" value={prodSku} onChange={(e) => setProdSku(e.target.value)} />
                  <input placeholder="Product Name" value={prodName} onChange={(e) => setProdName(e.target.value)} />
                  <select value={prodCat} onChange={(e) => setProdCat(e.target.value)}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input placeholder="Price (₹)" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
                  <input placeholder="Stock" value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
                  <select value={prodUnit} onChange={(e) => setProdUnit(e.target.value)}>
                    {UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                  <textarea placeholder="Product Description" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={2}></textarea>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                      <option value="none">No Discount</option>
                      <option value="percent">Percentage (%)</option>
                      <option value="amount">Flat Amount (₹)</option>
                    </select>
                    {discountType !== 'none' && <input placeholder="Discount Value" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label><input type="checkbox" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} /> Enable GST</label>
                    {gstEnabled && <select value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value))}>{GST_RATES.map(rate => <option key={rate} value={rate}>{rate}%</option>)}</select>}
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Main Image</label>
                    <input type="file" accept="image/*" onChange={(e) => setMainImage(e.target.files?.[0] || null)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Gallery Images (3)</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => setGalleryImages(Array.from(e.target.files || []).slice(0, 3))} />
                  </div>
                </div>
                <button className="btn btn-green" style={{ marginTop: '10px' }} onClick={addOrUpdateProduct}>Add Product</button>
              </>
            )}
            <h3 style={{ marginTop: '20px' }}>All Products</h3>
            <table>
              <thead><tr><th>Name</th><th>SKU</th><th>Unit</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td><td>{p.sku}</td><td>{p.unit || 'Pcs'}</td><td>₹{p.price}</td>
                    <td><span className={`status-pill ${p.is_active ? 'active' : 'inactive'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td><div className="dots-btn" onClick={() => { setSelectedProduct(p); setIsProdModal(true); setProdMenu(false); }}>⋮</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  customers.map(c => <tr key={c.id}><td>{c.name || 'Unknown'}</td><td>{c.mobile}</td><td>{new Date(c.created_at).toLocaleDateString()}</td></tr>)
                )}
              </tbody>
            </table>
          </div>
        )}

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
            {deliveryBoys.map(boy => <div key={boy.id} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => { setSelectedBoy(boy); setOriginalBoyMobile(boy.mobile); setIsBoyModal(true); setBoyMenu(false); setEditingBoy(false); }}><span style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}>{boy.name}</span> - {boy.mobile}</div>)}
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="panel">
            <h3>Add Branch (With Location & Max KM)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input placeholder="Branch Name" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} />
              <input placeholder="Address" value={newBranchAddress} onChange={(e) => setNewBranchAddress(e.target.value)} />
              <input placeholder="Latitude" value={newBranchLat} onChange={(e) => setNewBranchLat(e.target.value)} />
              <input placeholder="Longitude" value={newBranchLng} onChange={(e) => setNewBranchLng(e.target.value)} />
              <input placeholder="Range (KM)" value={newBranchRange} onChange={(e) => setNewBranchRange(e.target.value)} />
              <input placeholder="Max Delivery (KM)" value={newBranchMaxKm} onChange={(e) => setNewBranchMaxKm(e.target.value)} />
            </div>
            <button className="btn btn-black" style={{ marginTop: '10px' }} onClick={addBranch}>Add Branch</button>
            <h3 style={{ marginTop: '20px' }}>All Branches (Click Name)</h3>
            {branches.map(branch => <div key={branch.id} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => { setSelectedBranch(branch); setIsBranchModal(true); setBranchMenu(false); setEditingBranch(false); }}><span style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}>{branch.name}</span> - {branch.delivery_range_km} KM</div>)}
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
            <button className="btn btn-black" style={{ marginTop: '20px' }} onClick={async () => { if (settings) { await supabase.from('delivery_settings').update(settings).eq('id', settings.id); alert('Saved!'); } }}>Save Settings</button>
          </div>
        )}

        {activeTab === 'banners' && (
          <div className="panel">
            <h3>Add New Banner</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input placeholder="Banner Title (e.g. Grocery at Home)" value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} />
              <input type="file" accept="image/*" onChange={(e) => setBannerImg(e.target.files?.[0] || null)} />
              <button className="btn btn-black" onClick={addBanner}>Add Banner</button>
            </div>
            <h3>All Banners</h3>
            <table>
              <thead><tr><th>Image</th><th>Title</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {banners.map(banner => (
                  <tr key={banner.id}>
                    <td><img src={banner.image_url} alt="banner" style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '5px' }} /></td>
                    <td>{banner.title}</td>
                    <td><span className={`status-pill ${banner.is_active ? 'active' : 'inactive'}`}>{banner.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <button className="btn btn-green" onClick={() => toggleBannerActive(banner)}>Toggle</button>
                      <button className="btn btn-red" style={{ marginLeft: '5px' }} onClick={() => deleteBanner(banner.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'invoice_settings' && (
          <div className="panel">
            <h3>Invoice Settings</h3>
            <label>Welcome Note</label>
            <textarea value={invoiceSettings.welcome_note || ''} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, welcome_note: e.target.value })} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <label>Terms & Conditions</label>
            <textarea value={invoiceSettings.terms || ''} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, terms: e.target.value })} rows={3} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <label>Footer Text</label>
            <input value={invoiceSettings.footer || ''} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footer: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <button className="btn btn-black" style={{ marginTop: '15px' }} onClick={saveInvoiceSettings}>Save Settings</button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="panel">
            <h3>My Profile (Admin)</h3>
            <p style={{ color: '#666' }}>Mobile: 9984389923</p>
            <p style={{ color: '#666' }}>Role: Admin</p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button className="btn btn-red" onClick={onLogout}>Logout</button>
              <button className="btn btn-black">Change Password</button>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="panel">
            <h3>Policies</h3>
            <p style={{ color: '#666' }}>Yahan aap Privacy Policy, Terms & Conditions, aur Refund Policy ka text edit karke "App Content" tab mein save kar sakte hain.</p>
            <div style={{ marginTop: '20px' }}>
              <button className="btn btn-black" onClick={() => setActiveTab('content')}>Go to App Content</button>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="panel">
            <h3>Manage App Content</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
              Yahan se aap About, Privacy Policy, Terms & Conditions, aur Refund Policy ka text edit kar sakte hain.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <select value={selectedPage} onChange={(e) => handleSelectPage(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                <option value="about">About Us</option>
                <option value="privacy">Privacy Policy</option>
                <option value="terms">Terms & Conditions</option>
                <option value="refund">Refund Policy</option>
              </select>
            </div>
            <textarea value={currentContent} onChange={(e) => setCurrentContent(e.target.value)} rows={10} style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', color: '#111111' }} placeholder={`Enter ${selectedPage} content here...`} />
            <button className="btn btn-black" style={{ marginTop: '15px' }} onClick={saveContent}>Save Content</button>
          </div>
        )}
      </div>

      {/* Modals */}
      {isCatModal && (
        <div className="modal-scrim show" onClick={() => setIsCatModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>{selectedCategory?.name}</h3>
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <div className="dots-btn" onClick={() => setCatMenu(!catMenu)}>⋮</div>
                <div className={`dots-menu ${catMenu ? 'show' : ''}`}>
                  <button onClick={() => { setEditingCat(true); setCatMenu(false); }}>✏️ Edit</button>
                  <button onClick={() => toggleCategoryActive(selectedCategory!)}>{selectedCategory?.is_active ? 'Deactivate' : 'Activate'}</button>
                  <button className="danger" onClick={() => deleteCategory(selectedCategory!.id)}>Delete</button>
                </div>
              </div>
              <div className="modal-close" onClick={() => setIsCatModal(false)}>✕</div>
            </div>
            <div className="modal-body">
              {editingCat ? (
                <div>
                  <div className="detail-row"><span className="dl">Name</span><input value={selectedCategory!.name} onChange={(e) => setSelectedCategory({ ...selectedCategory!, name: e.target.value })} /></div>
                  <div className="detail-row"><span className="dl">Short</span><input value={selectedCategory!.short_name} onChange={(e) => setSelectedCategory({ ...selectedCategory!, short_name: e.target.value })} /></div>
                  <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="btn btn-red" onClick={() => setEditingCat(false)}>Cancel</button>
                    <button className="btn btn-black" onClick={saveCategory}>Save</button>
                  </div>
                </div>
              ) : <div className="detail-row"><span className="dl">Status</span><span className="dv">{selectedCategory?.is_active ? 'Active' : 'Inactive'}</span></div>}
            </div>
          </div>
        </div>
      )}

      {isProdModal && (
        <div className="modal-scrim show" onClick={() => setIsProdModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>{selectedProduct?.name}</h3>
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <div className="dots-btn" onClick={() => setProdMenu(!prodMenu)}>⋮</div>
                <div className={`dots-menu ${prodMenu ? 'show' : ''}`}>
                  <button onClick={() => { handleStartEditProduct(selectedProduct!); }}>✏️ Edit (Full Page)</button>
                  <button onClick={() => toggleProductActive(selectedProduct!)}>{selectedProduct?.is_active ? 'Deactivate' : 'Activate'}</button>
                  <button className="danger" onClick={() => deleteProduct(selectedProduct!.id)}>Delete</button>
                </div>
              </div>
              <div className="modal-close" onClick={() => setIsProdModal(false)}>✕</div>
            </div>
            <div className="modal-body">
              <div className="detail-row"><span className="dl">SKU</span><span className="dv">{selectedProduct?.sku}</span></div>
              <div className="detail-row"><span className="dl">Price</span><span className="dv">₹{selectedProduct?.price}</span></div>
              <div className="detail-row"><span className="dl">Unit</span><span className="dv">{selectedProduct?.unit || 'Pcs'}</span></div>
              <div className="detail-row"><span className="dl">Status</span><span className="dv">{selectedProduct?.is_active ? 'Active' : 'Inactive'}</span></div>
            </div>
          </div>
        </div>
      )}

      {isBranchModal && (
        <div className="modal-scrim show" onClick={() => setIsBranchModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>{selectedBranch?.name}</h3>
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <div className="dots-btn" onClick={() => setBranchMenu(!branchMenu)}>⋮</div>
                <div className={`dots-menu ${branchMenu ? 'show' : ''}`}>
                  <button onClick={() => { setEditingBranch(true); setBranchMenu(false); }}>✏️ Edit</button>
                  <button onClick={() => toggleBranchActive(selectedBranch!)}>{selectedBranch?.is_active ? 'Deactivate' : 'Activate'}</button>
                  <button className="danger" onClick={() => deleteBranch(selectedBranch!.id)}>Delete</button>
                </div>
              </div>
              <div className="modal-close" onClick={() => setIsBranchModal(false)}>✕</div>
            </div>
            <div className="modal-body">
              {editingBranch ? (
                <div>
                  <div className="detail-row"><span className="dl">Name</span><input value={selectedBranch!.name} onChange={(e) => setSelectedBranch({ ...selectedBranch!, name: e.target.value })} /></div>
                  <div className="detail-row"><span className="dl">Lat</span><input type="number" value={selectedBranch!.lat} onChange={(e) => setSelectedBranch({ ...selectedBranch!, lat: parseFloat(e.target.value) })} /></div>
                  <div className="detail-row"><span className="dl">Lng</span><input type="number" value={selectedBranch!.lng} onChange={(e) => setSelectedBranch({ ...selectedBranch!, lng: parseFloat(e.target.value) })} /></div>
                  <div className="detail-row"><span className="dl">Range (KM)</span><input type="number" value={selectedBranch!.delivery_range_km} onChange={(e) => setSelectedBranch({ ...selectedBranch!, delivery_range_km: parseFloat(e.target.value) })} /></div>
                  <div className="detail-row"><span className="dl">Max Delivery (KM)</span><input type="number" value={selectedBranch!.max_delivery_km} onChange={(e) => setSelectedBranch({ ...selectedBranch!, max_delivery_km: parseFloat(e.target.value) })} /></div>
                  <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="btn btn-red" onClick={() => setEditingBranch(false)}>Cancel</button>
                    <button className="btn btn-black" onClick={saveBranch}>Save</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="detail-row"><span className="dl">Address</span><span className="dv">{selectedBranch?.address || 'N/A'}</span></div>
                  <div className="detail-row"><span className="dl">Lat</span><span className="dv">{selectedBranch?.lat}</span></div>
                  <div className="detail-row"><span className="dl">Lng</span><span className="dv">{selectedBranch?.lng}</span></div>
                  <div className="detail-row"><span className="dl">Range</span><span className="dv">{selectedBranch?.delivery_range_km} KM</span></div>
                  <div className="detail-row"><span className="dl">Max</span><span className="dv">{selectedBranch?.max_delivery_km} KM</span></div>
                  <div className="detail-row"><span className="dl">Status</span><span className="dv">{selectedBranch?.is_active ? 'Active' : 'Inactive'}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isBoyModal && (
        <div className="modal-scrim show" onClick={() => setIsBoyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>{selectedBoy?.name}</h3>
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <div className="dots-btn" onClick={() => setBoyMenu(!boyMenu)}>⋮</div>
                <div className={`dots-menu ${boyMenu ? 'show' : ''}`}>
                  <button onClick={() => { setEditingBoy(true); setBoyMenu(false); }}>✏️ Edit</button>
                  <button onClick={() => toggleBoyActive(selectedBoy!)}>{selectedBoy?.is_active ? 'Deactivate' : 'Activate'}</button>
                  <button className="danger" onClick={() => deleteBoy(selectedBoy!.id)}>Delete</button>
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
                  <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="btn btn-red" onClick={() => setEditingBoy(false)}>Cancel</button>
                    <button className="btn btn-black" onClick={saveBoy}>Save</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="detail-row"><span className="dl">Name</span><span className="dv">{selectedBoy?.name}</span></div>
                  <div className="detail-row"><span className="dl">Mobile</span><span className="dv">{selectedBoy?.mobile}</span></div>
                  <div className="detail-row"><span className="dl">Aadhar</span><span className="dv">{selectedBoy?.aadhar || 'N/A'}</span></div>
                  <div className="detail-row"><span className="dl">Address</span><span className="dv">{selectedBoy?.address || 'N/A'}</span></div>
                  <div className="detail-row"><span className="dl">Status</span><span className="dv">{selectedBoy?.is_active ? 'Active' : 'Inactive'}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order View Modal */}
      {selectedOrderForView && (
        <div className="modal-scrim show" onClick={() => setSelectedOrderForView(null)}>
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
  );
};

export default Admin;
