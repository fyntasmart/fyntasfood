import { useState } from 'react';
import { supabase } from '../supabaseClient';

const UNITS = ['Pcs', 'Kg', 'Gram', 'Liter', 'ML', 'Half Plate', 'Full Plate', 'Dozen', 'Packet', 'Box'];
const GST_RATES = [0, 5, 12, 18, 28];

interface AdminProductsProps {
  products: any[];
  categories: any[];
  uploadImage: (file: File) => Promise<string>;
  refreshData: () => void;
}

const AdminProducts = ({ products, categories, uploadImage, refreshData }: AdminProductsProps) => {
  const [editingProduct, setEditingProduct] = useState<any>(null);
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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModal, setIsModal] = useState(false);
  const [menu, setMenu] = useState(false);

  const resetForm = () => {
    setEditingProduct(null);
    setProdName(''); setProdSku(''); setProdCat(''); setProdPrice(''); setProdStock('');
    setProdUnit('Pcs'); setProdDesc(''); setDiscountType('none'); setDiscountValue('');
    setGstEnabled(false); setGstRate(0); setMainImage(null); setGalleryImages([]);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setProdName(product.name); setProdSku(product.sku || ''); setProdCat(product.category_id || '');
    setProdPrice(product.price.toString()); setProdStock(product.stock.toString());
    setProdUnit(product.unit || 'Pcs'); setProdDesc(product.description || '');
    setDiscountType(product.discount_type || 'none'); setDiscountValue(product.discount_value ? product.discount_value.toString() : '');
    setGstEnabled(product.gst_enabled); setGstRate(product.gst_rate);
    setMainImage(null); setGalleryImages([]); setMenu(false); setIsModal(false);
  };

  const saveProduct = async () => {
    if (!prodName || !prodCat || !prodPrice) return alert('Product name, category aur price do!');
    let mainImageUrl = editingProduct?.image_url || '';
    if (mainImage) { const url = await uploadImage(mainImage); if (url) mainImageUrl = url; }
    const galleryUrls = [editingProduct?.image_2 || '', editingProduct?.image_3 || '', editingProduct?.image_4 || ''];
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
    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id);
      alert('Product Updated!');
    } else {
      await supabase.from('products').insert(productData);
      alert('Product Added!');
    }
    resetForm();
    refreshData();
  };

  const toggleActive = async (product: any) => {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    refreshData();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete karein?')) return;
    await supabase.from('products').delete().eq('id', id);
    refreshData();
  };

  return (
    <div className="panel">
      {editingProduct ? (
        <>
          <h3>Edit Product</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input placeholder="SKU" value={prodSku} onChange={(e) => setProdSku(e.target.value)} />
            <input placeholder="Name" value={prodName} onChange={(e) => setProdName(e.target.value)} />
            <select value={prodCat} onChange={(e) => setProdCat(e.target.value)}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Price" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
            <input placeholder="Stock" value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
            <select value={prodUnit} onChange={(e) => setProdUnit(e.target.value)}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <textarea placeholder="Description" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={2} />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                <option value="none">No Discount</option>
                <option value="percent">%</option>
                <option value="amount">₹</option>
              </select>
              {discountType !== 'none' && <input placeholder="Value" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label><input type="checkbox" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} /> GST</label>
              {gstEnabled && <select value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value))}>{GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}</select>}
            </div>
            <div>
              <label>Main Image</label>
              <input type="file" accept="image/*" onChange={(e) => setMainImage(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label>Gallery (3)</label>
              <input type="file" multiple accept="image/*" onChange={(e) => setGalleryImages(Array.from(e.target.files || []).slice(0, 3))} />
            </div>
          </div>
          <button className="btn btn-green" onClick={saveProduct}>Save</button>
          <button className="btn btn-red" onClick={resetForm}>Cancel</button>
        </>
      ) : (
        <>
          <h3>Add Product</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input placeholder="SKU" value={prodSku} onChange={(e) => setProdSku(e.target.value)} />
            <input placeholder="Name" value={prodName} onChange={(e) => setProdName(e.target.value)} />
            <select value={prodCat} onChange={(e) => setProdCat(e.target.value)}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Price" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
            <input placeholder="Stock" value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
            <select value={prodUnit} onChange={(e) => setProdUnit(e.target.value)}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <textarea placeholder="Description" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={2} />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                <option value="none">No Discount</option>
                <option value="percent">%</option>
                <option value="amount">₹</option>
              </select>
              {discountType !== 'none' && <input placeholder="Value" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label><input type="checkbox" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} /> GST</label>
              {gstEnabled && <select value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value))}>{GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}</select>}
            </div>
            <div>
              <label>Main Image</label>
              <input type="file" accept="image/*" onChange={(e) => setMainImage(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label>Gallery (3)</label>
              <input type="file" multiple accept="image/*" onChange={(e) => setGalleryImages(Array.from(e.target.files || []).slice(0, 3))} />
            </div>
          </div>
          <button className="btn btn-green" onClick={saveProduct}>Add Product</button>
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
              <td>
                <div className="menu-wrapper">
                  <button className="dots-btn" onClick={() => { setSelectedProduct(p); setMenu(true); }}>⋮</button>
                  {menu && selectedProduct?.id === p.id && (
                    <div className="dots-menu show">
                      <button onClick={() => handleEdit(p)}>Edit</button>
                      <button onClick={() => toggleActive(p)}>{p.is_active ? 'Deactivate' : 'Activate'}</button>
                      <button className="danger" onClick={() => deleteProduct(p.id)}>Delete</button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminProducts;
