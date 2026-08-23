import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

interface Branch { id: string; name: string; is_active: boolean; delivery_range_km: number; }
interface Settings { id: string; base_fare: number; max_delivery_km: number; }
interface Tier { id: string; min_km: number; max_km: number; price: number; }
interface DeliveryBoy { id: string; name: string; mobile: string; aadhar: string; address: string; is_active: boolean; }

const Admin = ({ onLogout }: { onLogout: () => void }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);

  const [dbName, setDbName] = useState('');
  const [dbMobile, setDbMobile] = useState('');
  const [dbAadhar, setDbAadhar] = useState('');
  const [dbAddress, setDbAddress] = useState('');

  // Modal States
  const [selectedBoy, setSelectedBoy] = useState<DeliveryBoy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', mobile: '', aadhar: '', address: '', is_active: true });
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      const { data: b } = await supabase.from('branches').select('*').order('name');
      const { data: s } = await supabase.from('delivery_settings').select('*').single();
      const { data: t } = await supabase.from('delivery_tiers').select('*').order('min_km');
      const { data: d } = await supabase.from('delivery_boys').select('*').order('created_at', { ascending: false });
      
      if (b) setBranches(b);
      if (s) setSettings(s);
      if (t) setTiers(t);
      if (d) setDeliveryBoys(d); // 'd' yahan use ho raha hai
    };
    fetchData();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal Handlers
  const openModal = (boy: DeliveryBoy) => {
    setSelectedBoy(boy);
    setEditForm({ name: boy.name, mobile: boy.mobile, aadhar: boy.aadhar, address: boy.address, is_active: boy.is_active });
    setIsEditing(false);
    setIsMenuOpen(false);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setIsMenuOpen(false); setSelectedBoy(null); };
  const handleEdit = () => { setIsEditing(true); setIsMenuOpen(false); };
  
  const handleSaveEdit = async () => {
    if (!selectedBoy) return;
    const { error } = await supabase.from('delivery_boys').update(editForm).eq('id', selectedBoy.id);
    if (!error) {
      setDeliveryBoys(deliveryBoys.map(b => b.id === selectedBoy.id ? { ...b, ...editForm } : b));
      setSelectedBoy({ ...selectedBoy, ...editForm });
      setIsEditing(false);
      alert('Details update ho gaye!');
    } else { alert('Error: ' + error.message); }
  };

  const handleDelete = async () => {
    if (!selectedBoy) return;
    if(!confirm(`Kya aap "${selectedBoy.name}" ko delete karna chahte hain?`)) return;
    const { error } = await supabase.from('delivery_boys').delete().eq('id', selectedBoy.id);
    if (!error) {
      await supabase.from('registered_users').delete().eq('mobile', selectedBoy.mobile);
      setDeliveryBoys(deliveryBoys.filter(b => b.id !== selectedBoy.id));
      closeModal();
      alert('Delivery Boy delete ho gaya!');
    } else { alert('Error: ' + error.message); }
  };

  const handleToggleActive = async () => {
    if (!selectedBoy) return;
    const newStatus = !selectedBoy.is_active;
    const { error } = await supabase.from('delivery_boys').update({ is_active: newStatus }).eq('id', selectedBoy.id);
    if (!error) {
      const updatedBoy = { ...selectedBoy, is_active: newStatus };
      setDeliveryBoys(deliveryBoys.map(b => b.id === selectedBoy.id ? updatedBoy : b));
      setSelectedBoy(updatedBoy);
      setEditForm(prev => ({ ...prev, is_active: newStatus }));
      setIsMenuOpen(false);
    }
  };

  // Tier Handlers
  const updateTier = async (tier: Tier, field: keyof Tier, value: number) => {
    const updatedTier = { ...tier, [field]: value };
    setTiers(tiers.map(t => t.id === tier.id ? updatedTier : t));
    await supabase.from('delivery_tiers').update({ [field]: value }).eq('id', tier.id);
  };

  const addTier = async () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? lastTier.max_km : 0;
    const newMax = newMin + 2;
    const newPrice = lastTier ? lastTier.price + 10 : 10;
    const { data, error } = await supabase.from('delivery_tiers').insert({ min_km: newMin, max_km: newMax, price: newPrice }).select().single();
    if (!error && data) setTiers([...tiers, data]);
  };

  const deleteTier = async (id: string) => {
    if (tiers.length <= 1) return alert('Kam se kam 1 tier chahiye!');
    await supabase.from('delivery_tiers').delete().eq('id', id);
    setTiers(tiers.filter(t => t.id !== id));
  };

  // Add Delivery Boy
  const addDeliveryBoy = async () => {
    if (!dbName || !dbMobile || !dbAadhar) return alert('Name, Mobile aur Aadhar zaroori hain!');
    if (dbMobile.length !== 10) return alert('Sahi 10-digit mobile number daalo!');
    const { error: dbError } = await supabase.from('delivery_boys').insert({ name: dbName, mobile: dbMobile, aadhar: dbAadhar, address: dbAddress });
    if (dbError) { alert('Error adding: ' + dbError.message); return; }
    const { error: regError } = await supabase.from('registered_users').insert({ mobile: dbMobile, role: 'delivery_boy' });
    if (regError && regError.code !== '23505') { alert('Login register nahi ho paya.'); }
    else {
      alert('Delivery Boy add ho gaya!');
      setDbName(''); setDbMobile(''); setDbAadhar(''); setDbAddress('');
      const { data: d } = await supabase.from('delivery_boys').select('*').order('created_at', { ascending: false });
      if (d) setDeliveryBoys(d);
    }
  };

  // Branch Toggle
  const toggleBranch = async (branch: Branch) => {
    const { error } = await supabase.from('branches').update({ is_active: !branch.is_active }).eq('id', branch.id);
    if (!error) setBranches(branches.map(b => b.id === branch.id ? { ...b, is_active: !b.is_active } : b));
  };

  const updateRange = async (branchId: string, newRange: number) => {
    await supabase.from('branches').update({ delivery_range_km: newRange }).eq('id', branchId);
    setBranches(branches.map(b => b.id === branchId ? { ...b, delivery_range_km: newRange } : b));
  };

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
      <style>{`
        .panel { background: #121729; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 20px; margin-bottom: 20px; }
        input { background: #161d33; border: 1px solid rgba(255,255,255,0.08); color: #fff; padding: 10px 12px; border-radius: 8px; outline: none; width: 100%; margin-bottom: 10px; }
        .btn { border: none; color: #fff; font-weight: 600; padding: 10px 16px; border-radius: 10px; cursor: pointer; }
        .btn-purple { background: linear-gradient(120deg, #7c3aed, #ea580c); }
        .btn-red { background: linear-gradient(120deg, #fca5a5, #dc2626); }
        .btn-green { background: linear-gradient(120deg, #6ee7b7, #059669); }
        .btn-blue { background: linear-gradient(120deg, #60a5fa, #2563eb); }
        .tier-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .tier-row input { width: 70px; margin: 0; text-align: center; }
        .tier-row span { color: #9aa4bd; }
        
        /* Modal CSS */
        .modal-scrim{position:fixed; inset:0; background:rgba(4,6,12,.65); backdrop-filter:blur(4px); display:none; align-items:center; justify-content:center; z-index:300; padding:20px; animation:fadeIn .2s ease;}
        .modal-scrim.show{display:flex;}
        @keyframes fadeIn{from{opacity:0;} to{opacity:1;}}
        .modal-card{width:100%; max-width:420px; background:#121729; border:1px solid rgba(255,255,255,0.08); border-radius:20px; box-shadow:0 30px 70px -20px rgba(0,0,0,.7); animation:popIn .25s cubic-bezier(.16,1,.3,1); position:relative;}
        @keyframes popIn{from{opacity:0; transform:scale(.94) translateY(8px);} to{opacity:1; transform:scale(1) translateY(0);}}
        .modal-head{display:flex; align-items:flex-start; gap:14px; padding:22px 22px 16px; border-bottom:1px solid rgba(255,255,255,0.08); position:relative;}
        .modal-avatar{width:48px;height:48px;border-radius:14px; flex:none; display:flex; align-items:center; justify-content:center; font-size:21px; background:linear-gradient(150deg, #6ee7b7, #059669);}
        .modal-title{font-size:16.5px; font-weight:700; color:#fff; margin-top:5px;}
        .modal-subtitle{font-size:11.5px; color:#9aa4bd; margin-top:3px;}
        .modal-close{margin-left:auto; width:32px;height:32px;border-radius:9px; background:#161d33; border:1px solid rgba(255,255,255,0.08); color:#9aa4bd; display:flex; align-items:center; justify-content:center; cursor:pointer; flex:none;}
        .dots-btn{width:32px;height:32px;border-radius:9px; background:#161d33; border:1px solid rgba(255,255,255,0.08); color:#9aa4bd; display:flex; align-items:center; justify-content:center; cursor:pointer; flex:none; font-size:18px; letter-spacing:2px;}
        .dots-menu{position:absolute; top:60px; right:22px; min-width:150px; background:#161d33; border:1px solid rgba(255,255,255,0.08); border-radius:12px; box-shadow:0 16px 40px -10px rgba(0,0,0,.6); overflow:hidden; z-index:20; display:none; animation:popIn .18s ease;}
        .dots-menu.show{display:block;}
        .dots-menu button{width:100%; text-align:left; background:none; border:none; color:#f1f5f9; padding:11px 14px; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:9px;}
        .dots-menu button:hover{background:rgba(255,255,255,.05);}
        .dots-menu button.danger{color:#fca5a5;}
        .modal-body{padding:18px 22px 6px;}
        .detail-row{display:flex; justify-content:space-between; align-items:center; padding:11px 0; border-bottom:1px solid rgba(255,255,255,0.08); font-size:13.5px;}
        .detail-row:last-child{border-bottom:none;}
        .detail-row .dl{color:#9aa4bd;}
        .detail-row .dv{font-weight:600; color:#f1f5f9;}
        .detail-row input{background:#161d33; border:1px solid rgba(255,255,255,0.08); border-radius:8px; color:#f1f5f9; padding:7px 10px; font-size:13px; text-align:right; width:60%; outline:none;}
        .modal-foot{padding:16px 22px 22px; display:flex; gap:10px; justify-content:flex-end;}
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#fff', fontFamily: 'Poppins' }}>Admin Dashboard</h1>
        <button onClick={onLogout} className="btn btn-red">Logout</button>
      </div>

      {/* Tiers */}
      <div className="panel">
        <h3>Delivery Charge Settings (Tier System)</h3>
        <label style={{ color: '#9aa4bd' }}>Base Fare (₹)</label>
        <input type="number" value={settings?.base_fare ?? 0} onChange={(e) => setSettings({ ...settings!, base_fare: parseFloat(e.target.value) })} />
        <label style={{ color: '#9aa4bd' }}>Distance & Price Tiers</label>
        {tiers.map(tier => (
          <div className="tier-row" key={tier.id}>
            <input type="number" value={tier.min_km} onChange={(e) => updateTier(tier, 'min_km', parseFloat(e.target.value))} />
            <span>KM se</span>
            <input type="number" value={tier.max_km} onChange={(e) => updateTier(tier, 'max_km', parseFloat(e.target.value))} />
            <span>KM tak</span>
            <span>₹</span>
            <input type="number" value={tier.price} onChange={(e) => updateTier(tier, 'price', parseFloat(e.target.value))} />
            <button className="btn btn-red" onClick={() => deleteTier(tier.id)}>Del</button>
          </div>
        ))}
        <button className="btn btn-blue" onClick={addTier}>+ Add New Tier</button>
        <div style={{ marginTop: '15px' }}>
          <label style={{ color: '#9aa4bd' }}>Max Delivery Limit (KM)</label>
          <input type="number" value={settings?.max_delivery_km ?? 0} onChange={(e) => setSettings({ ...settings!, max_delivery_km: parseFloat(e.target.value) })} />
        </div>
        <button className="btn btn-green" style={{ marginTop: '10px' }} onClick={async () => { if (settings) { await supabase.from('delivery_settings').update(settings).eq('id', settings.id); alert('Settings saved!'); } }}>Save Settings</button>
      </div>

      {/* Branches */}
      <div className="panel">
        <h3>Manage Branches</h3>
        {branches.map(branch => (
          <div key={branch.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#fff' }}>{branch.name} <span style={{ color: '#9aa4bd', fontSize: '12px' }}>({branch.delivery_range_km} KM)</span></div>
            <div style={{ display: 'flex', gap: '10px' }}>
               <input style={{ width: '60px' }} type="number" defaultValue={branch.delivery_range_km} onBlur={(e) => updateRange(branch.id, parseFloat(e.target.value))} />
               <button className="btn" style={{ background: branch.is_active ? '#059669' : '#dc2626' }} onClick={() => toggleBranch(branch)}>{branch.is_active ? 'ON' : 'OFF'}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Delivery Boy */}
      <div className="panel">
        <h3>Add Delivery Boy</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input placeholder="Name" value={dbName} onChange={(e) => setDbName(e.target.value)} />
          <input placeholder="Mobile Number" value={dbMobile} onChange={(e) => setDbMobile(e.target.value)} />
          <input placeholder="Aadhar Number" value={dbAadhar} onChange={(e) => setDbAadhar(e.target.value)} />
          <input placeholder="Address" value={dbAddress} onChange={(e) => setDbAddress(e.target.value)} />
        </div>
        <button className="btn btn-green" style={{ marginTop: '10px' }} onClick={addDeliveryBoy}>Add Boy</button>
      </div>

      {/* All Delivery Boys List (Clickable + Modal) */}
      <div className="panel">
        <h3>All Delivery Boys</h3>
        {deliveryBoys.length === 0 ? <p style={{ color: '#9aa4bd' }}>Abhi koi delivery boy add nahi hua.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '10px', textAlign: 'left', color: '#9aa4bd' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'left', color: '#9aa4bd' }}>Mobile</th>
                <th style={{ padding: '10px', textAlign: 'left', color: '#9aa4bd' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveryBoys.map((boy) => (
                <tr key={boy.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }} onClick={() => openModal(boy)}>
                  <td style={{ padding: '10px', color: '#a78bfa', fontWeight: 'bold', textDecoration: 'underline' }}>{boy.name}</td>
                  <td style={{ padding: '10px' }}>{boy.mobile}</td>
                  <td style={{ padding: '10px' }}>{boy.is_active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      <div className={`modal-scrim ${isModalOpen ? 'show' : ''}`} onClick={closeModal}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <div className="modal-avatar">🛵</div>
            <div>
              <div className="modal-title">{selectedBoy?.name}</div>
              <div className="modal-subtitle">Delivery Boy</div>
            </div>
            <div ref={menuRef} style={{ position: 'relative', marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <div className="dots-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>⋮</div>
              <div className={`dots-menu ${isMenuOpen ? 'show' : ''}`}>
                <button onClick={handleEdit}>✏️ Edit</button>
                <button onClick={handleToggleActive}>{selectedBoy?.is_active ? '🚫 Deactivate' : '✅ Activate'}</button>
                <button className="danger" onClick={handleDelete}>🗑️ Delete</button>
              </div>
            </div>
            <div className="modal-close" onClick={closeModal}>✕</div>
          </div>

          <div className="modal-body">
            {isEditing ? (
              <div>
                <div className="detail-row"><span className="dl">Name</span><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
                <div className="detail-row"><span className="dl">Mobile</span><input type="text" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} /></div>
                <div className="detail-row"><span className="dl">Aadhar</span><input type="text" value={editForm.aadhar} onChange={(e) => setEditForm({ ...editForm, aadhar: e.target.value })} /></div>
                <div className="detail-row"><span className="dl">Address</span><input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></div>
              </div>
            ) : (
              <div>
                <div className="detail-row"><span className="dl">Mobile</span><span className="dv">{selectedBoy?.mobile}</span></div>
                <div className="detail-row"><span className="dl">Aadhar</span><span className="dv">{selectedBoy?.aadhar}</span></div>
                <div className="detail-row"><span className="dl">Address</span><span className="dv">{selectedBoy?.address}</span></div>
                <div className="detail-row"><span className="dl">Status</span><span className="dv" style={{ color: selectedBoy?.is_active ? '#6ee7b7' : '#fca5a5' }}>{selectedBoy?.is_active ? 'Active' : 'Inactive'}</span></div>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="modal-foot">
              <button className="btn btn-red" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn btn-purple" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
