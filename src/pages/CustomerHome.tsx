import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

const CustomerHome = ({ addToCart, onProductClick }: any) => {
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: b } = await supabase.from('banners').select('*').eq('is_active', true);
      const { data: c } = await supabase.from('categories').select('*').eq('is_active', true);
      const { data: p } = await supabase.from('products').select('*').eq('is_active', true).limit(10);
      
      if (b) setBanners(b);
      if (c) setCategories(c);
      if (p) setProducts(p);
    };
    fetchData();
  }, []);

  // Auto Banner Slide Logic
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Scroll to slide
  useEffect(() => {
    if (bannerRef.current && banners.length > 0) {
      const slideWidth = bannerRef.current.clientWidth;
      bannerRef.current.scrollTo({ left: currentBanner * slideWidth, behavior: 'smooth' });
    }
  }, [currentBanner, banners.length]);

  return (
    <div>
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
              <img src={cat.image_url || 'https://via.placeholder.com/60'} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1e40af' }} />
              <p style={{ fontSize: '12px', margin: '5px 0', color: '#000000' }}>{cat.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Items (Click par Full Page khulega) */}
      <div>
        <h3 style={{ margin: '0 0 10px', color: '#000000' }}>Featured Items</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {products.map(p => (
            <div 
              key={p.id} 
              onClick={() => onProductClick(p)} 
              style={{ background: '#ffffff', borderRadius: '10px', padding: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', cursor: 'pointer' }}
            >
              <img src={p.image_url || 'https://via.placeholder.com/150'} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
              <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#000000' }}>{p.name}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                <p style={{ margin: 0, color: '#1d4ed8', fontWeight: 'bold' }}>₹{p.price}</p>
                {/* Add to Cart Button (Click par Cart mein jayega, Page nahi khulega) */}
                <button 
                  onClick={(e) => { e.stopPropagation(); addToCart(p); }} 
                  style={{ background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >🛒 Add</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;
