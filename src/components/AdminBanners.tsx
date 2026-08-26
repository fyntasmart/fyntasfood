import { useState } from 'react';
import { supabase } from '../supabaseClient';

interface AdminBannersProps {
  banners: any[];
  uploadImage: (file: File) => Promise<string>;
  refreshData: () => void;
}

const AdminBanners = ({ banners, uploadImage, refreshData }: AdminBannersProps) => {
  const [title, setTitle] = useState('');
  const [img, setImg] = useState<File | null>(null);

  const addBanner = async () => {
    if (!title || !img) return alert('Title aur Image do!');
    let url = '';
    if (img) url = await uploadImage(img);
    await supabase.from('banners').insert({ title, image_url: url });
    setTitle(''); setImg(null);
    refreshData();
  };

  const toggleActive = async (banner: any) => {
    await supabase.from('banners').update({ is_active: !banner.is_active }).eq('id', banner.id);
    refreshData();
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('banners').delete().eq('id', id);
    refreshData();
  };

  return (
    <div className="panel">
      <h3>Add Banner</h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input placeholder="Banner Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="file" accept="image/*" onChange={(e) => setImg(e.target.files?.[0] || null)} />
        <button className="btn btn-black" onClick={addBanner}>Add</button>
      </div>
      <h3>All Banners</h3>
      <table>
        <thead><tr><th>Image</th><th>Title</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {banners.map(banner => (
            <tr key={banner.id}>
              <td><img src={banner.image_url} alt="banner" style={{ width: '80px', height: '40px', objectFit: 'cover' }} /></td>
              <td>{banner.title}</td>
              <td><span className={`status-pill ${banner.is_active ? 'active' : 'inactive'}`}>{banner.is_active ? 'Active' : 'Inactive'}</span></td>
              <td>
                <button className="btn btn-green" onClick={() => toggleActive(banner)}>Toggle</button>
                <button className="btn btn-red" onClick={() => deleteBanner(banner.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBanners;
