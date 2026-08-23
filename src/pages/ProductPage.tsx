import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const ProductPage = ({ product, addToCart, onBack }: any) => {
  const [currentImage, setCurrentImage] = useState(product.image_url || '');
  const [relatedItems, setRelatedItems] = useState<any[]>([]);

  // Saari photos ka array banao (jo available hain)
  const images = [product.image_url, product.image_2, product.image_3, product.image_4].filter((img: string | null) => img);

  useEffect(() => {
    setCurrentImage(product.image_url || '');
    // Related Items (Same Category ke products)
    const fetchRelated = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(6);
      if (data) setRelatedItems(data);
    };
    fetchRelated();
  }, [product]);

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#111827' }}>←</button>
        <h2 style={{ margin: '0 auto', color: '#111827', fontWeight: 'bold' }}>Product Details</h2>
        <div style={{ width: '24px' }}></div>
      </div>

      <div style={{ padding: '15px' }}>
        
        {/* Main Image (Flipkart Style) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
          <img 
            src={currentImage || 'https://via.placeholder.com/300'} 
            style={{ width: '100%', maxHeight: '350px', objectFit: 'contain', borderRadius: '10px', border: '1px solid #e5e7eb' }} 
          />
        </div>

        {/* Thumbnails (Click karne par badi photo change hogi) */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px', overflowX: 'auto' }}>
            {images.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                onClick={() => setCurrentImage(img)}
                style={{ 
                  width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer',
                  border: currentImage === img ? '2px solid #1e40af' : '1px solid #d1d5db'
                }} 
              />
            ))}
          </div>
        )}

        {/* Product Information */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ margin: '0 0 10px', color: '#111827', fontSize: '22px' }}>{product.name}</h1>
          <p style={{ margin: '0 0 15px', color: '#666' }}>{product.description || 'Description nahi hai'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: '0', color: '#1e40af' }}>₹{product.price} / {product.unit}</h2>
            {product.discount_type !== 'none' && (
              <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                {product.discount_value}{product.discount_type === 'percent' ? '% OFF' : '₹ OFF'}
              </span>
            )}
          </div>
          
          <button 
            onClick={() => addToCart(product)} 
            style={{ 
              width: '100%', padding: '15px', background: '#1e40af', color: '#fff', border: 'none', 
              borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' 
            }}
          >
            Add to Cart
          </button>
        </div>

        {/* Related Items */}
        <div>
          <h3 style={{ color: '#111827', marginBottom: '10px' }}>Related Items</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {relatedItems.length === 0 ? (
              <p style={{ color: '#666' }}>Koi related product nahi hai.</p>
            ) : (
              relatedItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => { 
                    // Product page ko naye product ke saath refresh karne ke liye parent state update hoga
                    window.location.reload(); // Simplest way for now to navigate to new product (ya parent function handle karega)
                  }} 
                  style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px', cursor: 'pointer' }}
                >
                  <img src={item.image_url || 'https://via.placeholder.com/150'} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '5px' }} />
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>{item.name}</p>
                  <p style={{ margin: '5px 0', color: '#1e40af', fontWeight: 'bold' }}>₹{item.price}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductPage;
