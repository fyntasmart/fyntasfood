import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const CustomerCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: c } = await supabase.from('categories').select('*').eq('is_active', true);
      if (c && c.length > 0) {
        setCategories(c);
        setSelectedCat(c[0].id);
        const { data: p } = await supabase.from('products').select('*').eq('category_id', c[0].id);
        if (p) setProducts(p);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (selectedCat) {
        const { data: p } = await supabase.from('products').select('*').eq('category_id', selectedCat);
        if (p) setProducts(p);
      }
    };
    fetchProducts();
  }, [selectedCat]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: '10px', marginTop: '10px' }}>
      {/* Left Sidebar */}
      <div style={{ width: '100px', background: '#fff', borderRadius: '10px', padding: '10px', overflowY: 'auto' }}>
        {categories.map(cat => (
          <div key={cat.id} onClick={() => setSelectedCat(cat.id)} style={{ padding: '10px 5px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', background: selectedCat === cat.id ? '#2563eb' : '#f3f4f6', color: selectedCat === cat.id ? '#fff' : '#111827', marginBottom: '10px' }}>
            <img src={cat.image_url || 'https://via.placeholder.com/50'} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', marginBottom: '5px' }} />
            <div style={{ fontSize: '11px' }}>{cat.name}</div>
          </div>
        ))}
      </div>

      {/* Right Products */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <h3 style={{ margin: '10px 0' }}>Products</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {products.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: '10px', padding: '10px' }}>
              <img src={p.image_url || 'https://via.placeholder.com/150'} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '5px' }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>{p.name}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                <p style={{ margin: 0, color: '#059669', fontWeight: 'bold' }}>₹{p.price}</p>
                <span style={{ fontSize: '15px' }}>🛒</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerCategories;
