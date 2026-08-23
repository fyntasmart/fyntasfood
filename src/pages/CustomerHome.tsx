import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const CustomerHome = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

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

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>GreenRun</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <span>🔔</span>
          <span>🛒</span>
        </div>
      </div>

      {/* Search Bar */}
      <input placeholder="Search products here..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', marginBottom: '15px' }} />

      {/* Banner Carousel */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', scrollSnapType: 'x mandatory', marginBottom: '20px', scrollbarWidth: 'none' }}>
        {banners.map(b => (
          <img key={b.id} src={b.image_url} style={{ width: '100%', height: '150px', borderRadius: '15px', objectFit: 'cover', flexShrink: 0, scrollSnapAlign: 'start' }} />
        ))}
        {banners.length === 0 && <div style={{ width: '100%', height: '150px', background: '#e5e7eb', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>Banner Yahan Dikhega</div>}
      </div>

      {/* Popular Categories */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px' }}>Popular Categories</h3>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ textAlign: 'center', minWidth: '70px' }}>
              <img src={cat.image_url || 'https://via.placeholder.com/60'} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
              <p style={{ fontSize: '12px', margin: '5px 0' }}>{cat.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Items */}
      <div>
        <h3 style={{ margin: '0 0 10px' }}>Featured Items</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {products.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: '10px', padding: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <img src={p.image_url || 'https://via.placeholder.com/150'} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
              <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{p.name}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                <p style={{ margin: 0, color: '#059669', fontWeight: 'bold' }}>₹{p.price}</p>
                <span style={{ fontSize: '18px', color: '#2563eb' }}>🛒</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;
