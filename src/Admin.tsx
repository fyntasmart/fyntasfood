import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

// Interfaces (Same as before)
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
interface InvoiceSettings { id: string; company_name: string; logo_url: string; address: string; welcome_note: string; terms: string; footer: string; }

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
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({ id: '', company_name: 'FYNTAS', logo_url: '', address: 'Partawal Chowk, Maharajganj Road, Maharajganj, UP, PIN: 273301', welcome_note: '', terms: '', footer: '' });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Products Filtering States
  const [productSearch, setProductSearch] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
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
      supabase.from('invoice_settings').select('*').maybeSingle()
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
    if (inv.data) setInvoiceSettings({ ...invoiceSettings, ...inv.data });
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 10000); return () => clearInterval(interval); }, []);
  useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenOrderMenuId(null); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);

  const uploadImage = async (file: File) => {
    const path = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) return '';
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

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
    if (galleryImages.length > 0) { for (let i = 0; i < galleryImages.length; i++) { const url = await uploadImage(galleryImages[i]); if (url) galleryUrls[i] = url; } }
    const productData = {
      name: prodName, sku: prodSku, category_id: prodCat,
      price: parseFloat(prodPrice) || 0, stock: parseInt(prodStock) || 0,
      unit: prodUnit, description: prodDesc,
      image_url: mainImageUrl, image_2: galleryUrls[0] || '', image_3: galleryUrls[1] || '', image_4: galleryUrls[2] || '',
      discount_type: discountType, discount_value: parseFloat(discountValue) || 0,
      gst_enabled: gstEnabled, gst_rate: gstRate
    };
    if (editingProductFull) { const { error } = await supabase.from('products').update(productData).eq('id', editingProductFull.id); if (error) { alert('Product update nahi hua: ' + error.message); return; } alert('Product Updated!'); }
    else { const { error } = await supabase.from('products').insert(productData); if (error) { alert('Product add nahi hua: ' + error.message); return; } alert('Product Added!'); }
    handleCancelEditProduct(); fetchData();
  };

  const toggleProductActive = async (prod: Product) => { await supabase.from('products').update({ is_active: !prod.is_active }).eq('id', prod.id); setSelectedProduct({ ...prod, is_active: !prod.is_active }); setProdMenu(false); fetchData(); };
  const deleteProduct = async (id: string) => { if (!confirm('Product delete karna hai?')) return; await supabase.from('products').delete().eq('id', id); setIsProdModal(false); fetchData(); };
  const addCategory = async () => { if (!catName || !catShort) return alert('Category naam aur short code do!'); let imgUrl = ''; if (catImg) imgUrl = await uploadImage(catImg); await supabase.from('categories').insert({ name: catName, short_name: catShort, image_url: imgUrl }); setCatName(''); setCatShort(''); setCatImg(null); fetchData(); };
  const saveCategory = async () => { if (!selectedCategory) return; await supabase.from('categories').update(selectedCategory).eq('id', selectedCategory.id); setEditingCat(false); setCatMenu(false); fetchData(); };
  const toggleCategoryActive = async (cat: Category) => { await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id); setSelectedCategory({ ...cat, is_active: !cat.is_active }); setCatMenu(false); fetchData(); };
  const deleteCategory = async (id: string) => { if (!confirm('Category delete karna hai?')) return; await supabase.from('categories').delete().eq('id', id); setIsCatModal(false); fetchData(); };
  const addBranch = async () => { if (!newBranchName || !newBranchLat || !newBranchLng) return alert('Branch name, Lat aur Lng zaroori hain!'); await supabase.from('branches').insert({ name: newBranchName, address: newBranchAddress, lat: parseFloat(newBranchLat), lng: parseFloat(newBranchLng), delivery_range_km: parseFloat(newBranchRange) || 10, max_delivery_km: parseFloat(newBranchMaxKm) || 15 }); setNewBranchName(''); setNewBranchAddress(''); setNewBranchLat(''); setNewBranchLng(''); setNewBranchRange('10'); setNewBranchMaxKm('15'); fetchData(); };
  const saveBranch = async () => { if (!selectedBranch) return; await supabase.from('branches').update(selectedBranch).eq('id', selectedBranch.id); setEditingBranch(false); setBranchMenu(false); fetchData(); };
  const deleteBranch = async (id: string) => { if (!confirm('Branch delete karna hai?')) return; await supabase.from('branches').delete().eq('id', id); setIsBranchModal(false); fetchData(); };
  const toggleBranchActive = async (branch: Branch) => { await supabase.from('branches').update({ is_active: !branch.is_active }).eq('id', branch.id); setSelectedBranch({ ...branch, is_active: !branch.is_active }); setBranchMenu(false); fetchData(); };
  const addDeliveryBoy = async () => { if (!dbName || !dbMobile) return alert('Name aur Mobile zaroori hain!'); await supabase.from('delivery_boys').insert({ name: dbName, mobile: dbMobile, aadhar: dbAadhar, address: dbAddress }); await supabase.from('registered_users').insert({ mobile: dbMobile, role: 'delivery_boy' }); setDbName(''); setDbMobile(''); setDbAadhar(''); setDbAddress(''); fetchData(); };
  const saveBoy = async () => { if (!selectedBoy) return; const { error } = await supabase.from('delivery_boys').update(selectedBoy).eq('id', selectedBoy.id); if (error) { alert('Update error: ' + error.message); return; } if (originalBoyMobile !== selectedBoy.mobile) { await supabase.from('registered_users').update({ mobile: selectedBoy.mobile }).eq('mobile', originalBoyMobile); } setEditingBoy(false); setBoyMenu(false); fetchData(); };
  const deleteBoy = async (id: string) => { if (!confirm('Delivery boy delete karna hai?')) return; await supabase.from('delivery_boys').delete().eq('id', id); setIsBoyModal(false); fetchData(); };
  const toggleBoyActive = async (boy: DeliveryBoy) => { await supabase.from('delivery_boys').update({ is_active: !boy.is_active }).eq('id', boy.id); setSelectedBoy({ ...boy, is_active: !boy.is_active }); setBoyMenu(false); fetchData(); };
  const handleStatusChange = async (orderId: string, status: string) => { await supabase.from('orders').update({ status }).eq('id', orderId); fetchData(); };
  const deleteOrder = async (orderId: string) => { if (!confirm('Kya aap yeh order delete karna chahte hain?')) return; await supabase.from('order_items').delete().eq('order_id', orderId); await supabase.from('orders').delete().eq('id', orderId); setOpenOrderMenuId(null); fetchData(); };
  const printReceipt = (orderId: string, format: string) => { window.open(`/invoice/${orderId}?format=${format}`, '_blank'); };
  const assignDeliveryBoy = async (orderId: string, boyId: string) => { if (!boyId) return; await supabase.from('orders').update({ delivery_boy_id: boyId }).eq('id', orderId); setOpenOrderMenuId(null); fetchData(); };
  const addTier = async () => { const last = tiers[tiers.length - 1]; const min = last ? last.max_km : 0; const max = min + 2; const price = last ? last.price + 10 : 10; await supabase.from('delivery_tiers').insert({ min_km: min, max_km: max, price }); fetchData(); };
  const deleteTier = async (id: string) => { if (tiers.length <= 1) return alert('Ek tier toh hona chahiye!'); await supabase.from('delivery_tiers').delete().eq('id', id); fetchData(); };
  const addBanner = async () => { if (!bannerTitle || !bannerImg) return alert('Banner ka title aur image do!'); let imgUrl = ''; if (bannerImg) imgUrl = await uploadImage(bannerImg); await supabase.from('banners').insert({ title: bannerTitle, image_url: imgUrl }); setBannerTitle(''); setBannerImg(null); fetchData(); };
  const toggleBannerActive = async (banner: Banner) => { await supabase.from('banners').update({ is_active: !banner.is_active }).eq('id', banner.id); fetchData(); };
  const deleteBanner = async (id: string) => { if (!confirm('Banner delete karna hai?')) return; await supabase.from('banners').delete().eq('id', id); fetchData(); };
  const handleSelectPage = (key: string) => { setSelectedPage(key); const page = appPages.find(p => p.page_key === key); setCurrentContent(page ? page.content : ''); };
  const saveContent = async () => { const { error } = await supabase.from('app_pages').upsert({ page_key: selectedPage, content: currentContent }, { onConflict: 'page_key' }); if (!error) { alert('Content saved successfully!'); fetchData(); } else { alert('Error: ' + error.message); } };

  const saveInvoiceSettings = async () => {
    let logo = invoiceSettings.logo_url;
    if (logoFile) { const url = await uploadImage(logoFile); if (url) logo = url; }
    
    const newData = { ...invoiceSettings, logo_url: logo };
    if (!newData.id) {
      const { id, ...rest } = newData;
      const { error } = await supabase.from('invoice_settings').insert(rest as any);
      if (!error) { alert('Invoice Settings Saved!'); fetchData(); } else { alert('Error: ' + error.message); }
    } else {
      const { error } = await supabase.from('invoice_settings').update(newData).eq('id', newData.id);
      if (!error) { alert('Invoice Settings Saved!'); fetchData(); } else { alert('Error: ' + error.message); }
    }
  };

  const exportCustomers = () => { const header = ["Name", "Mobile Number"]; const rows = customers.map(c => [c.name || 'Unknown', c.mobile]); const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].map(e => e.join(",")).join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "customers_list.csv"); document.body.appendChild(link); link.click(); };

  // Orders Filtering
  const filteredOrders = orders.filter(order => { const matchesStatus = statusFilter === 'all' || order.status === statusFilter; const matchesSearch = order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || order.customer_mobile.includes(searchQuery) || order.id.toLowerCase().includes(searchQuery.toLowerCase()); return matchesStatus && matchesSearch; });
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Products Filtering & Stats (NEW)
  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.sku || '').toLowerCase().includes(productSearch.toLowerCase());
    return matchesSearch;
  });
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const inactiveProducts = products.filter(p => !p.is_active).length;
  const outOfStock = products.filter(p => (p.stock || 0) <= 0).length;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' }, { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'products', label: 'Products', icon: '📁' }, { id: 'categories', label: 'Categories', icon: '🗂️' },
    { id: 'customers', label: 'Customers', icon: '👥' }, { id: 'delivery', label: 'Delivery Boys', icon: '🛵' },
    { id: 'branches', label: 'Branches', icon: '🏬' }, { id: 'charges', label: 'Delivery Charges', icon: '💰' },
    { id: 'banners', label: 'Banners', icon: '🖼️' }, { id: 'invoice_settings', label: 'Invoice Settings', icon: '🧾' },
    { id: 'profile', label: 'My Profile', icon: '👤' }, { id: 'policies', label: 'Policies', icon: '📜' },
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
        .dots-menu button:hover{background:#f3f4f6;} .dots-menu button.danger{color:#dc2626;}
        .modal-body{padding:18px 20px;}
        .detail-row{display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f3f4f6; font-size:14px;}
        .detail-row .dl{color:#6b7280;} .detail-row .dv{font-weight:600;}
        .modal-body input { width: 100%; text-align: left; margin-bottom: 5px; }
        .table-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .order-table { width: 100%; border-collapse: collapse; }
        .order-table th { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; font-weight: 600; }
        .order-table td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; vertical-align: middle; }
        .menu-wrapper { position: relative; display: inline-block; }
        
        /* New Stats Card Styles */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: #fff; border: 1px solid #f3f4f6; border-radius: 12px; padding: 20px; }
        .stat-card .val { font-size: 28px; font-weight: 800; }
        .stat-card .lbl { font-size: 13px; color: #6b7280; margin-top: 5px; }
        .stat-card.green .val { color: #059669; }
        .stat-card.red .val { color: #dc2626; }
        .stat-card.gray .val { color: #111111; }
        .stat-card.yellow .val { color: #d97706; }
        .products-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .products-header h1 { margin: 0; font-size: 24px; }
        .products-header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
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

        {/* NEW PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            {/* Products Header (No Export/Import buttons) */}
            <div className="products-header">
              <div>
                <h1>Products</h1>
                <p>Manage your product catalog and inventory</p>
              </div>
              <button className="btn btn-black" onClick={() => { setEditingProductFull(null); handleCancelEditProduct(); }}>+ Add Product</button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card"><div className="val">{totalProducts}</div><div className="lbl">Total Products</div></div>
              <div className="stat-card green"><div className="val">{activeProducts}</div><div className="lbl">Active Products</div></div>
              <div className="stat-card yellow"><div className="val">{inactiveProducts}</div><div className="lbl">Inactive Products</div></div>
              <div className="stat-card red"><div className="val">{outOfStock}</div><div className="lbl">Out of Stock</div></div>
            </div>

            {/* All Products Table */}
            <div className="panel">
              <div className="table-controls">
                <h3 style={{ margin: 0 }}>All Products</h3>
                <input type="text" placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} style={{ maxWidth: '250px' }} />
              </div>

              {editingProductFull ? (
                <div style={{ marginBottom: '20px' }}>
                  <h3>Edit Product (Units + 4 Images + GST)</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <button className="btn btn-red" onClick={handleCancelEditProduct}>← Back to List</button>
                    <h3 style={{ margin: 0 }}>{editingProductFull.name}</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input placeholder="SKU Code" value={prodSku} onChange={(e) => setProdSku(e.target.value)} />
                    <input placeholder="Product Name" value={prodName} onChange={(e) => setProdName(e.target.value)} />
                    <select value={prodCat} onChange={(e) => setProdCat(e.target.value)}><option value="">Select Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    <input placeholder="Price (₹)" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
                    <input placeholder="Stock" value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
                    <select value={prodUnit} onChange={(e) => setProdUnit(e.target.value)}>{UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}</select>
                    <textarea placeholder="Product Description" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={2}></textarea>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}><option value="none">No Discount</option><option value="percent">Percentage (%)</option><option value="amount">Flat Amount (₹)</option></select>
                      {discountType !== 'none' && <input placeholder="Discount Value" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label><input type="checkbox" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} /> Enable GST</label>
                      {gstEnabled && <select value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value))}>{GST_RATES.map(rate => <option key={rate} value={rate}>{rate}%</option>)}</select>}
                    </div>
                    <div><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Main Image {editingProductFull.image_url && <span style={{ color: 'green' }}>(Current Has Image)</span>}</label><input type="file" accept="image/*" onChange={(e) => setMainImage(e.target.files?.[0] || null)} /></div>
                    <div><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Gallery Images (3) {editingProductFull.image_2 && <span style={{ color: 'green' }}>(Current Has Gallery)</span>}</label><input type="file" accept="image/*" multiple onChange={(e) => setGalleryImages(Array.from(e.target.files || []).slice(0, 3))} /></div>
                  </div>
                  <button className="btn btn-green" style={{ marginTop: '10px' }} onClick={addOrUpdateProduct}>Update Product</button>
                </div>
              ) : (
                <table className="order-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Unit</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td>{p.image_url ? <img src={p.image_url} alt="prod" style={{ width: 40, height: 40, borderRadius: 8 }} /> : 'No Img'}</td>
                        <td style={{ fontWeight: '600' }}>{p.name}<br /><span style={{ fontSize: '11px', color: '#6b7280' }}>{p.unit || ''}</span></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.sku || '-'}</td>
                        <td>{categories.find(c => c.id === p.category_id)?.name || '-'}</td>
                        <td>{p.stock}</td>
                        <td>{p.unit || 'Pcs'}</td>
                        <td style={{ fontWeight: '700' }}>₹{p.price}</td>
                        <td><span className={`status-pill ${p.is_active ? 'active' : 'inactive'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>
                          <div className="menu-wrapper" ref={menuRef}>
                            <button className="dots-btn" onClick={() => setProdMenu(prodMenu === p.id ? null : p.id)}>⋮</button>
                            <div className={`dots-menu ${prodMenu === p.id ? 'show' : ''}`}>
                              <button onClick={() => { handleStartEditProduct(p); setProdMenu(null); }}>✏️ Edit</button>
                              <button onClick={() => toggleProductActive(p)}>{p.is_active ? '🚫 Deactivate' : '✅ Activate'}</button>
                              <button className="danger" onClick={() => deleteProduct(p.id)}>🗑️ Delete</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'categories' && ( /* ... Same as before ... */ )}
        {activeTab === 'customers' && ( /* ... Same as before ... */ )}
        {activeTab === 'delivery' && ( /* ... Same as before ... */ )}
        {activeTab === 'branches' && ( /* ... Same as before ... */ )}
        {activeTab === 'charges' && ( /* ... Same as before ... */ )}
        {activeTab === 'banners' && ( /* ... Same as before ... */ )}
        {activeTab === 'invoice_settings' && ( /* ... Same as before ... */ )}
        {activeTab === 'profile' && ( /* ... Same as before ... */ )}
        {activeTab === 'policies' && ( /* ... Same as before ... */ )}
        {activeTab === 'content' && ( /* ... Same as before ... */ )}
      </div>

      {/* Modals */}
      {isCatModal && ( /* ... Same as before ... */ )}
      {isProdModal && ( /* ... Same as before ... */ )}
      {isBranchModal && ( /* ... Same as before ... */ )}
      {isBoyModal && ( /* ... Same as before ... */ )}
      {selectedOrderForView && ( /* ... Same as before ... */ )}
    </div>
  );
};

export default Admin;
