import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

// ---- Interfaces ----
interface Branch {
  id: string;
  name: string;
  is_active: boolean;
  delivery_range_km: number;
}

interface Settings {
  id: string;
  base_fare: number;
  per_km_charge: number;
  max_delivery_km: number;
}

interface DeliveryBoy {
  id: string;
  name: string;
  mobile: string;
  aadhar: string;
  address: string;
  is_active: boolean;
}

const Admin = ({ onLogout }: { onLogout: () => void }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);

  // Delivery Boy Form States
  const [dbName, setDbName] = useState('');
  const [dbMobile, setDbMobile] = useState('');
  const [dbAadhar, setDbAadhar] = useState('');
  const [dbAddress, setDbAddress] = useState('');

  // ---- Modal & Menu States ----
  const [selectedBoy, setSelectedBoy] = useState<DeliveryBoy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', mobile: '', aadhar: '', address: '', is_active: true });
  const menuRef = useRef<HTMLDivElement>(null); // For closing menu on outside click

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      const { data: b } = await supabase.from('branches').select('*').order('name');
      const { data: s } = await supabase.from('delivery_settings').select('*').single();
      const { data: d } = await supabase.from('delivery_boys').select('*').order('created_at', { ascending: false });
      if (b) setBranches(b);
      if (s) setSettings(s);
      if (d) setDeliveryBoys(d);
    };
    fetchData();
  }, []);

  // ---- Modal Handlers ----
  const openModal = (boy: DeliveryBoy) => {
    setSelectedBoy(boy);
    setEditForm({ name: boy.name, mobile: boy.mobile, aadhar: boy.aadhar, address: boy.address, is_active: boy.is_active });
    setIsEditing(false);
    setIsMenuOpen(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsMenuOpen(false);
    setSelectedBoy(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---- CRUD Actions ----
  const handleEdit = () => {
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedBoy) return;
    const { error } = await supabase
      .from('delivery_boys')
      .update(editForm)
      .eq('id', selectedBoy.id);

    if (!error) {
      setDeliveryBoys(deliveryBoys.map(b => b.id === selectedBoy.id ? { ...b, ...editForm } : b));
      setSelectedBoy({ ...selectedBoy, ...editForm });
      setIsEditing(false);
      alert('Details update ho gaye!');
    } else {
      alert('Error updating: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedBoy) return;
    if(!confirm(`Kya aap "${selectedBoy.name}" ko delete karna chahte hain?`)) return;

    // Note: Delivery boy ko registered_users se bhi delete karna padega
    const { error } = await supabase.from('delivery_boys').delete().eq('id', selectedBoy.id);
    
    if (!error) {
      await supabase.from('registered_users').delete().eq('mobile', selectedBoy.mobile);
      setDeliveryBoys(deliveryBoys.filter(b => b.id !== selectedBoy.id));
      closeModal();
      alert('Delivery Boy delete ho gaya!');
    } else {
      alert('Error deleting: ' + error.message);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedBoy) return;
    const newStatus = !selectedBoy.is_active;
    const { error } = await supabase
      .from('delivery_boys')
      .update({ is_active: newStatus })
      .eq('id', selectedBoy.id);

    if (!error) {
      const updatedBoy = { ...selectedBoy, is_active: newStatus };
      setDeliveryBoys(deliveryBoys.map(b => b.id === selectedBoy.id ? updatedBoy : b));
      setSelectedBoy(updatedBoy);
      setEditForm(prev => ({ ...prev, is_active: newStatus }));
      setIsMenuOpen(false);
    }
  };

  // Add Delivery Boy Function
  const addDeliveryBoy = async () => {
    if (!dbName || !dbMobile || !dbAadhar) return alert('Name, Mobile aur Aadhar zaroori hain!');
    if (dbMobile.length !== 10) return alert('Sahi 10-digit mobile number daalo!');

    const { error: dbError } = await supabase.from('delivery_boys').insert({
      name: dbName, mobile: dbMobile, aadhar: dbAadhar, address: dbAddress
    });

    if (dbError) { alert('Error adding: ' + dbError.message); return; }

    const { error: regError } = await supabase.from('registered_users').insert({
      mobile: dbMobile, role: 'delivery_boy'
    });

    if (regError && regError.code !== '23505') {
      alert('Delivery boy add hua, lekin login register nahi ho paya. Error: ' + regError.message);
    } else {
      alert('Delivery Boy add ho gaya!');
      setDbName(''); setDbMobile(''); setDbAadhar(''); setDbAddress('');
      const { data: d } = await supabase.from('delivery_boys').select('*').order('created_at', { ascending: false });
      if (d) setDeliveryBoys(d);
    }
  };

  const toggleBranch = async (branch: Branch) => { /* ... existing code ... */ 
    const { error } = await supabase.from('branches').update({ is_active: !branch.is_active }).eq('id', branch.id);
    if (!error) setBranches(branches.map(b => b.id === branch.id ? { ...b, is_active: !b.is_active } : b));
  };

  const updateRange = async (branchId: string, newRange: number) => { /* ... existing code ... */
    const { error } = await supabase.from('branches').update({ delivery_range_km: newRange }).eq('id', branchId);
    if (!error) {
      setBranches(branches.map(b => b.id === branchId ? { ...b, delivery_range_km: newRange } : b));
      alert('Branch range update ho gayi!');
    }
  };

  const updateSettings = async () => { /* ... existing code ... */
    if (!settings) return;
    const { error } = await supabase.from('delivery_settings').update(settings).eq('id', settings.id);
    if (!error) alert('Delivery charges successfully update ho gaye!');
  };

  // ---- Render ----
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Styles matching the reference code */}
      <style>{`
        :root {
          --bg: #0a0e1a; --bg2: #0d1220; --panel: #121729; --panel-2: #161d33;
          --line: rgba(255,255,255,0.08); --text-hi: #f1f5f9; --text-mid: #9aa4bd; --text-low: #5f6b87;
          --purple-1: #a78bfa; --purple-2: #7c3aed; --blue-1: #60a5fa; --blue-2: #2563eb;
          --pink-1: #f0abfc; --pink-2: #c026d3; --green-1: #6ee7b7; --green-2: #059669;
          --orange-1: #fbbf24; --orange-2: #ea580c; --red-1: #fca5a5; --red-2: #dc2626;
        }
        .modal-scrim{position:fixed; inset:0; background:rgba(4,6,12,.65); backdrop-filter:blur(4px); display:none; align-items:center; justify-content:center; z-index:300; padding:20px; animation:fadeIn .2s ease;}
        .modal-scrim.show{display:flex;}
        @keyframes fadeIn{from{opacity:0;} to{opacity:1;}}
        @keyframes popIn{from{opacity:0; transform:scale(.94) translateY(8px);} to{opacity:1; transform:scale(1) translateY(0);}}
        .modal-card{width:100%; max-width:420px; background:var(--panel); border:1px solid var(--line); border-radius:20px; box-shadow:0 30px 70px -20px rgba(0,0,0,.7); animation:popIn .25s cubic-bezier(.16,1,.3,1); position:relative;}
        .modal-head{display:flex; align-items:flex-start; gap:14px; padding:22px 22px 16px; border-bottom:1px solid var(--line); position:relative;}
        .modal-avatar{width:48px;height:48px;border-radius:14px; flex:none; display:flex; align-items:center; justify-content:center; font-size:21px; background:linear-gradient(150deg, var(--green-1), var(--green-2));}
        .modal-title{font-family:'Poppins',sans-serif; font-size:16.5px; font-weight:700; color:#fff; margin-top:5px;}
        .modal-subtitle{font-size:11.5px; color:var(--text-mid); margin-top:3px;}
        .modal-close{margin-left:auto; width:32px;height:32px;border-radius:9px; background:var(--panel-2); border:1px solid var(--line); color:var(--text-mid); display:flex; align-items:center; justify-content:center; cursor:pointer; flex:none;}
        .modal-close:hover{color:var(--text-hi);}
        .dots-btn{width:32px;height:32px;border-radius:9px; background:var(--panel-2); border:1px solid var(--line); color:var(--text-mid); display:flex; align-items:center; justify-content:center; cursor:pointer; flex:none; font-size:18px; letter-spacing:2px;}
        .dots-menu{position:absolute; top:60px; right:22px; min-width:150px; background:var(--panel-2); border:1px solid var(--line); border-radius:12px; box-shadow:0 16px 40px -10px rgba(0,0,0,.6); overflow:hidden; z-index:20; display:none; animation:popIn .18s ease;}
        .dots-menu.show{display:block;}
        .dots-menu button{width:100%; text-align:left; background:none; border:none; color:var(--text-hi); padding:11px 14px; font-size:13px; font-family:'Inter',sans-serif; font-weight:500; display:flex; align-items:center; gap:9px; cursor:pointer;}
        .dots-menu button:hover{background:rgba(255,255,255,.05);}
        .dots-menu button.danger{color:#fca5a5;}
        .modal-body{padding:18px 22px 6px;}
        .detail-row{display:flex; justify-content:space-between; align-items:center; padding:11px 0; border-bottom:1px solid var(--line); font-size:13.5px;}
        .detail-row:last-child{border-bottom:none;}
        .detail-row .dl{color:var(--text-mid);}
        .detail-row .dv{font-weight:600; color:var(--text-hi);}
        .detail-row input{background:var(--panel-2); border:1px solid var(--line); border-radius:8px; color:var(--text-hi); padding:7px 10px; font-size:13px; text-align:right; width:60%; outline:none; font-family:'Inter',sans-serif;}
        .modal-foot{padding:16px 22px 22px; display:flex; gap:10px; justify-content:flex-end;}
        .btn-purple{background:linear-gradient(120deg, var(--purple-1), var(--orange-2)); box-shadow:0 8px 18px -4px rgba(124,58,237,.45);}
        .btn{appearance:none; border:none; cursor:pointer; font-family:'Inter',sans-serif; font-weight:600; font-size:12.5px; padding:10px 16px; border-radius:11px; color:#fff; display:inline-flex; align-items:center; gap:7px; white-space:nowrap; transition:filter .15s, transform .15s;}
        .btn:hover{filter:brightness(1.08);}
        .btn-danger{background:rgba(248,113,113,.1); border:1px solid rgba(248,113,113,.3); color:#fca5a5; font-weight:700;}
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#4f46e5' }}>Admin Dashboard</h1>
        <button onClick={onLogout} style={{ padding: '10px 20px', background: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* Delivery Settings */}
      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Global Delivery Charge Settings</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <label>Base Fare (₹):
            <input type="number" value={settings?.base_fare} onChange={(e) => setSettings({ ...settings!, base_fare: parseFloat(e.target.value) })} style={{ marginLeft: '5px', width: '80px' }} />
          </label>
          <label>Per KM Charge (₹):
            <input type="number" value={settings?.per_km_charge} onChange={(e) => setSettings({ ...settings!, per_km_charge: parseFloat(e.target.value) })} style={{ marginLeft: '5px', width: '80px' }} />
          </label>
          <label>Max Delivery Limit (KM):
            <input type="number" value={settings?.max_delivery_km} onChange={(e) => setSettings({ ...settings!, max_delivery_km: parseFloat(e.target.value) })} style={{ marginLeft: '5px', width: '80px' }} />
          </label>
        </div>
        <button onClick={updateSettings} style={{ marginTop: '15px', padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save Settings</button>
      </div>

      {/* Branch Management */}
      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Manage Branches (On/Off aur Range)</h3>
        {branches.map((branch) => (
          <div key={branch.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <strong>{branch.name}</strong>
              <br />
              <span style={{ fontSize: '14px', color: '#666' }}>Current Range: {branch.delivery_range_km} KM</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontSize: '14px' }}>New Range (KM):
                <input type="number" defaultValue={branch.delivery_range_km} onBlur={(e) => updateRange(branch.id, parseFloat(e.target.value))} style={{ width: '60px', marginLeft: '5px', padding: '5px' }} />
              </label>
              <button onClick={() => toggleBranch(branch)} style={{ padding: '8px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: branch.is_active ? 'green' : 'red', color: 'white', fontWeight: 'bold' }}>
                {branch.is_active ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Delivery Boy Section */}
      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Add Delivery Boy</h3>
        <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
          <input placeholder="Name" value={dbName} onChange={(e) => setDbName(e.target.value)} style={{ padding: '10px' }} />
          <input placeholder="Mobile Number" value={dbMobile} onChange={(e) => setDbMobile(e.target.value)} style={{ padding: '10px' }} />
          <input placeholder="Aadhar Number" value={dbAadhar} onChange={(e) => setDbAadhar(e.target.value)} style={{ padding: '10px' }} />
          <input placeholder="Address" value={dbAddress} onChange={(e) => setDbAddress(e.target.value)} style={{ padding: '10px' }} />
        </div>
        <button onClick={addDeliveryBoy} style={{ marginTop: '10px', padding: '10px 20px', background: 'green', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Add Boy</button>
      </div>

      {/* Delivery Boys List (Clickable Name) */}
      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h3>All Delivery Boys</h3>
        {deliveryBoys.length === 0 ? <p>Abhi koi delivery boy add nahi hua.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '8px' }}>Name</th>
                <th style={{ padding: '8px' }}>Mobile</th>
                <th style={{ padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveryBoys.map((boy) => (
                <tr key={boy.id} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => openModal(boy)}>
                  <td style={{ padding: '8px', color: '#4f46e5', fontWeight: 'bold', textDecoration: 'underline' }}>{boy.name}</td>
                  <td style={{ padding: '8px' }}>{boy.mobile}</td>
                  <td style={{ padding: '8px' }}>{boy.is_active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL for Delivery Boy Details */}
      <div className={`modal-scrim ${isModalOpen ? 'show' : ''}`} onClick={closeModal}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <div className="modal-avatar">🛵</div>
            <div>
              <div className="modal-title">{selectedBoy?.name}</div>
              <div className="modal-subtitle">Delivery Boy</div>
            </div>
            
            {/* 3-Dot Menu */}
            <div ref={menuRef} style={{ position: 'relative', marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <div className="dots-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>⋮</div>
              <div className={`dots-menu ${isMenuOpen ? 'show' : ''}`}>
                <button onClick={handleEdit}>✏️ Edit</button>
                <button onClick={handleToggleActive}>
                  {selectedBoy?.is_active ? '🚫 Deactivate' : '✅ Activate'}
                </button>
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
              <button className="btn btn-danger" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn btn-purple" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Admin;
