import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

const CustomerHome = ({ addToCart, onProductClick }: any) => {
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [hotDeals, setHotDeals] = useState<any[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  
  // 🔥 Branch & Stock States
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branchStock, setBranchStock] = useState<any[]>([]);

  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Fetch Branches (active wale)
  useEffect(() => {
    const fetchBranches = async () => {
      const { data } = await supabase.from('branches').select('*').eq('is_active', true);
      if (data && data.length > 0) {
        setBranches(data);
        // Pehle branch ko auto-select karo
        setSelectedBranchId(data[0].id);
      }
    };
    fetchBranches();
  }, []);

  // Fetch Products & Branch Stock
  useEffect(() => {
    const fetchData = async () => {
      const { data: b } = await supabase.from('banners').select('*').eq('is_active', true);
      const { data: c } = await supabase.from('categories').select('*').eq('is_active', true);
      const { data: p } = await supabase.from('products').select('*').eq('is_active', true).limit(50);
      const { data: deals } = await supabase.from('products').select('*').eq('is_active', true).not('discount_type', 'eq', 'none').limit(6);
      const { data: rated } = await supabase.from('products').select('*').eq('is_active', true).order('price', { ascending: false }).limit(6);
      
      if (b) setBanners(b);
      if (c) setCategories(c);
      if (p) setProducts(p);
      if (deals) setHotDeals(deals);
      if (rated) setTopRated(rated);
    };
    fetchData();
  }, []);

  // 🔥 Jab Branch Change ho, tab stock fetch karo
  useEffect(() => {
    if (!selectedBranchId) return;

    const fetchStock = async () => {
      // branch_stock table se products aur stock fetch karo
      const { data } = await supabase
        .from('branch_stock')
        .select('*, products(id, name, sku, price, unit)')
        .eq('branch_id', selectedBranchId);
      
      if (data) setBranchStock(data);
    };
    fetchStock();
  }, [selectedBranchId]);

  // Helper: Kisi product ka stock pata karo (selected branch ke hisaab se)
  const getStockStatus = (productId: string) => {
    // Agar branch_stock table mein product hai, toh uska stock use karo
    const stockItem = branchStock.find(bs => bs.product_id === productId);
    if (stockItem) {
      return stockItem.stock > 0 ? 'in' : 'out';
    }
    // Agar branch_stock mein nahi mila, toh global products.stock check karo
    const product = products.find(p => p.id === productId);
    if (product && product.stock > 0) return 'in';
    return 'out';
  };

  // Filter products based on stock (yeh optional hai, agar sab dikhana hai toh filter mat karo)
  // User ne bola "product sab dikhna chahiye but jo hai wo in stock aur jo nhi hai wo out of stock"
  // Isliye hum sab products dikhayenge, bas status badge add karenge.

  // Auto Banner Slide Logic
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    if (bannerRef.current && banners.length > 0) {
      const slideWidth = bannerRef.current.clientWidth;
      bannerRef.current.scrollTo({ left: currentBanner * slideWidth, behavior: 'smooth' });
    }
  }, [currentBanner, banners.length]);

  return (
    <div>
      {/* 🔥 Branch Select Option (Home page par hi) */}
      <div style={{ 
        background: '#ffffff', 
        borderRadius: '12px', 
        padding: '12px', 
        marginBottom: '15px', 
        border: '1px solid #e5e7eb' 
      }}>
        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '5px' }}>
          📍 Select Your Branch
        </label>
        <select
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: 'bold', color: '#111111' }}
        >
          <option value="">-- Choose Branch --</option>
          {branches.map(branch => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
      </div>

      {/* Banner Carousel */}
      <div ref={bannerRef} style={{ display: 'flex', overflowX: 'auto', gap: '10px', scrollSnapType: 'x mandatory', marginBottom: '20px', scrollbarWidth: 'none', scrollBehavior: 'smooth' }}>
        {banners.map((b) => (
          <img key={b.id} src={b.image_url} style={{ width: '100%', aspectRatio: '2 / 1', objectFit: 'cover', borderRadius: '15px', flexShrink: 0, scrollSnapAlign: 'start' }} />
        ))}
        {banners.length === 0 && <div style={{ width: '100%', aspectRatio: '2 / 1', background: '#eff6ff', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', border: '1px solid #bfdbfe' }}>Banner Yahan Dikhega</div>}
      </div>

      {/* Popular Categories */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px', color: '#000000' }}>Popular Categories</h3>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ textAlign: 'center', minWidth: '70px' }}>
              <img src={cat.image_url || 'https://via.placeholder.com/60'} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #111111' }} />
              <p style={{ fontSize: '12px', margin: '5px 0', color: '#000000' }}>{cat.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hot Deals */}
      {hotDeals.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px', color: '#dc2626' }}>🔥 Hot Deals</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {hotDeals.map(p => {
              const stockStatus = getStockStatus(p.id);
              return (
                <div key={p.id} onClick={() => stockStatus === 'in' && onProductClick(p)} style={{ background: '#ffffff', borderRadius: '10px', padding: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', cursor: stockStatus === 'in' ? 'pointer' : 'not-allowed' }}>
                  <img src={p.image_url || 'https://via.placeholder.com/150'} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#000000' }}>{p.name}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                    <p style={{ margin: 0, color: '#111111', fontWeight: 'bold' }}>₹{p.price}</p>
                    {/* Stock Badge */}
                    <span style={{ 
                      padding: '3px 8px', 
                      borderRadius: '20px', 
                      fontSize: '10px', 
                      fontWeight: 'bold',
                      background: stockStatus === 'in' ? '#d1fae5' : '#fee2e2',
                      color: stockStatus === 'in' ? '#065f46' : '#991b1b'
                    }}>
                      {stockStatus === 'in' ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (stockStatus === 'in') addToCart(p); 
                      else alert('Yeh product abhi out of stock hai!'); 
                    }} 
                    disabled={stockStatus !== 'in'}
                    style={{ 
                      width: '100%', 
                      background: stockStatus === 'in' ? '#111111' : '#9ca3af', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '6px', 
                      padding: '8px', 
                      cursor: stockStatus === 'in' ? 'pointer' : 'not-allowed', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      marginTop: '8px'
                    }}
                  >{stockStatus === 'in' ? '🛒 Add to Cart' : 'Out of Stock'}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Rated */}
      {topRated.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px', color: '#059669' }}>⭐ Top Rated</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {topRated.map(p => {
              const stockStatus = getStockStatus(p.id);
              return (
                <div key={p.id} onClick={() => stockStatus === 'in' && onProductClick(p)} style={{ background: '#ffffff', borderRadius: '10px', padding: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', cursor: stockStatus === 'in' ? 'pointer' : 'not-allowed' }}>
                  <img src={p.image_url || 'https://via.placeholder.com/150'} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#000000' }}>{p.name}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                    <p style={{ margin: 0, color: '#111111', fontWeight: 'bold' }}>₹{p.price}</p>
                    <span style={{ 
                      padding: '3px 8px', 
                      borderRadius: '20px', 
                      fontSize: '10px', 
                      fontWeight: 'bold',
                      background: stockStatus === 'in' ? '#d1fae5' : '#fee2e2',
                      color: stockStatus === 'in' ? '#065f46' : '#991b1b'
                    }}>
                      {stockStatus === 'in' ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (stockStatus === 'in') addToCart(p); 
                      else alert('Yeh product abhi out of stock hai!'); 
                    }} 
                    disabled={stockStatus !== 'in'}
                    style={{ 
                      width: '100%', 
                      background: stockStatus === 'in' ? '#111111' : '#9ca3af', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '6px', 
                      padding: '8px', 
                      cursor: stockStatus === 'in' ? 'pointer' : 'not-allowed', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      marginTop: '8px'
                    }}
                  >{stockStatus === 'in' ? '🛒 Add to Cart' : 'Out of Stock'}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Items */}
      <div>
        <h3 style={{ margin: '0 0 10px', color: '#000000' }}>Featured Items</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {products.map(p => {
            const stockStatus = getStockStatus(p.id);
            return (
              <div key={p.id} onClick={() => stockStatus === 'in' && onProductClick(p)} style={{ background: '#ffffff', borderRadius: '10px', padding: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', cursor: stockStatus === 'in' ? 'pointer' : 'not-allowed' }}>
                <img src={p.image_url || 'https://via.placeholder.com/150'} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#000000' }}>{p.name}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                  <p style={{ margin: 0, color: '#111111', fontWeight: 'bold' }}>₹{p.price}</p>
                  <span style={{ 
                    padding: '3px 8px', 
                    borderRadius: '20px', 
                    fontSize: '10px', 
                    fontWeight: 'bold',
                    background: stockStatus === 'in' ? '#d1fae5' : '#fee2e2',
                    color: stockStatus === 'in' ? '#065f46' : '#991b1b'
                  }}>
                    {stockStatus === 'in' ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (stockStatus === 'in') addToCart(p); 
                    else alert('Yeh product abhi out of stock hai!'); 
                  }} 
                  disabled={stockStatus !== 'in'}
                  style={{ 
                    width: '100%', 
                    background: stockStatus === 'in' ? '#111111' : '#9ca3af', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '6px', 
                    padding: '8px', 
                    cursor: stockStatus === 'in' ? 'pointer' : 'not-allowed', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    marginTop: '8px'
                  }}
                >{stockStatus === 'in' ? '🛒 Add to Cart' : 'Out of Stock'}</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;
