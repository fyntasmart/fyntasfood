import { useState } from 'react';
import { supabase } from '../supabaseClient';

interface AdminContentProps {
  appPages: any[];
  refreshData: () => void;
}

const AdminContent = ({ appPages, refreshData }: AdminContentProps) => {
  const [selectedPage, setSelectedPage] = useState('about');
  const [content, setContent] = useState('');

  const handleSelectPage = (key: string) => {
    setSelectedPage(key);
    const page = appPages.find(p => p.page_key === key);
    setContent(page ? page.content : '');
  };

  const save = async () => {
    await supabase.from('app_pages').upsert({ page_key: selectedPage, content }, { onConflict: 'page_key' });
    alert('Saved!');
    refreshData();
  };

  return (
    <div className="panel">
      <h3>Manage App Content</h3>
      <p style={{ color: '#6b7280' }}>Yahan se aap About, Privacy Policy, Terms & Conditions, aur Refund Policy ka text edit kar sakte hain.</p>
      <select value={selectedPage} onChange={(e) => handleSelectPage(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
        <option value="about">About Us</option>
        <option value="privacy">Privacy Policy</option>
        <option value="terms">Terms & Conditions</option>
        <option value="refund">Refund Policy</option>
      </select>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #d1d5db' }} placeholder="Yahan content likho" />
      <button className="btn btn-black" onClick={save}>Save</button>
    </div>
  );
};

export default AdminContent;
