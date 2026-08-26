import { useState } from 'react';
import { supabase } from '../supabaseClient';

interface AdminCategoriesProps {
  categories: any[];
  uploadImage: (file: File) => Promise<string>;
  refreshData: () => void;
}

const AdminCategories = ({ categories, uploadImage, refreshData }: AdminCategoriesProps) => {
  const [catName, setCatName] = useState('');
  const [catShort, setCatShort] = useState('');
  const [catImg, setCatImg] = useState<File | null>(null);
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [isModal, setIsModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const addCategory = async () => {
    if (!catName || !catShort) return alert('Naam aur short code do!');
    let imgUrl = '';
    if (catImg) imgUrl = await uploadImage(catImg);
    await supabase.from('categories').insert({ name: catName, short_name: catShort, image_url: imgUrl });
    setCatName(''); setCatShort(''); setCatImg(null);
    refreshData();
  };

  const saveCategory = async () => {
    if (!selectedCat) return;
    await supabase.from('categories').update(selectedCat).eq('id', selectedCat.id);
    setIsModal(false); setOpenMenuId(null);
    refreshData();
  };

  const toggleActive = async (cat: any) => {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    setOpenMenuId(null);
    refreshData();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete karein?')) return;
    await supabase.from('categories').delete().eq('id', id);
    setIsModal(false); setOpenMenuId(null);
    refreshData();
  };

  return (
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
              <td>
                <div className="menu-wrapper">
                  <button className="dots-btn" onClick={() => setOpenMenuId(openMenuId === cat.id ? null : cat.id)}>⋮</button>
                  {openMenuId === cat.id && (
                    <div className="dots-menu show">
                      <button onClick={() => setIsModal(true)}>Edit</button>
                      <button onClick={() => toggleActive(cat)}>{cat.is_active ? 'Deactivate' : 'Activate'}</button>
                      <button className="danger" onClick={() => deleteCategory(cat.id)}>Delete</button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModal && selectedCat && (
        <div className="modal-scrim show" onClick={() => setIsModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>Edit Category</h3><div className="modal-close" onClick={() => setIsModal(false)}>✕</div></div>
            <div className="modal-body">
              <div className="detail-row"><span className="dl">Name</span><input value={selectedCat.name} onChange={(e) => setSelectedCat({ ...selectedCat, name: e.target.value })} /></div>
              <div className="detail-row"><span className="dl">Short</span><input value={selectedCat.short_name} onChange={(e) => setSelectedCat({ ...selectedCat, short_name: e.target.value })} /></div>
              <button className="btn btn-black" onClick={saveCategory}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
