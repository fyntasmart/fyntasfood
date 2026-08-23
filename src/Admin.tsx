import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
  delivery_range_km: number;
}

interface Settings {
  id: string;
  base_fare: number;
  max_delivery_km: number;
}

interface Tier {
  id: string;
  min_km: number;
  max_km: number;
  price: number;
}

const Admin = ({ onLogout }: { onLogout: () => void }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);

  // Delivery Boy States
  const [dbName, setDbName] = useState('');
  const [dbMobile, setDbMobile] = useState('');
  const [dbAadhar, setDbAadhar] = useState('');
  const [dbAddress, setDbAddress] = useState('');

  // 🔥 SIRF EK useEffect (Duplicate hata diya)
  useEffect(() => {
    const fetchData = async () => {
      const { data: b } = await supabase.from('branches').select('*').order('name');
      const { data: s } = await supabase.from('delivery_settings').select('*').single();
      const { data: t } = await supabase.from('delivery_tiers').select('*').order('min_km');
      const { data: d } = await supabase.from('delivery_boys').select('*').order('created_at', { ascending: false });
      
      if (b) setBranches(b);
      if (s) setSettings(s);
      if (t) setTiers(t);
      if (d) setDeliveryBoys(d); // ✅ Yahan 'd' use ho raha hai
    };
    fetchData();
  }, []);

  // Tier CRUD
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
    if (tiers.length <= 1) return alert('Kam se kam 1 tier toh hona chahiye!');
    await supabase.from('delivery_tiers').delete().eq('id', id);
    setTiers(tiers.filter(t => t.id !== id));
  };

  // Delivery Boy Add
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
      alert('Delivery boy add hua, lekin login register nahi ho paya.');
    } else {
      alert('Delivery Boy add ho gaya!');
      setDbName(''); setDbMobile(''); setDbAadhar(''); setDbAddress('');
      const { data: d } = await supabase.from('delivery_boys').select('*').order('created_at', { ascending: false });
      if (d) setDeliveryBoys(d);
    }
  };

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
      <style>{`
        .panel { background: #121729; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 20px; margin-bottom: 20px; }
        h3 { font-family: 'Poppins', sans-serif; color: #fff; margin-top: 0; }
        input { background: #161d33; border: 1px solid rgba(255,255,255,0.08); color: #fff; padding: 10px 12px; border-radius: 8px; outline: none; width: 100%; margin-bottom: 10px; }
        label { font-size: 12px; color: #9aa4bd; display: block; margin-bottom: 4px; }
        .btn { border: none; color: #fff; font-weight: 600; padding: 10px 16px; border-radius: 10px; cursor: pointer; }
        .btn-purple { background: linear-gradient(120deg, #7c3aed, #ea580c); }
        .btn-blue { background: linear-gradient(120deg, #60a5fa, #2563eb); }
        .btn-red { background: linear-gradient(120deg, #fca5a5, #dc2626); }
        .btn-green { background: linear-gradient(120deg, #6ee7b7, #059669); }
        .tier-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .tier-row input { width: 70px; margin: 0; text-align: center; }
        .tier-row span { color: #9aa4bd; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#fff', fontFamily: 'Poppins' }}>Admin Dashboard</h1>
        <button onClick={onLogout} className="btn btn-red">Logout</button>
      </div>

      {/* Delivery Charge Settings (Dark Theme + Tier System) */}
      <div className="panel">
        <h3>Delivery Charge Settings (Tier System)</h3>
        <label>Base Fare (₹)</label>
        <input type="number" value={settings?.base_fare ?? 0} onChange={(e) => setSettings({ ...settings!, base_fare: parseFloat(e.target.value) })} />

        <label>Distance & Price Tiers (0 KM se X KM tak)</label>
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
          <label>Max Delivery Limit (KM)</label>
          <input type="number" value={settings?.max_delivery_km ?? 0} onChange={(e) => setSettings({ ...settings!, max_delivery_km: parseFloat(e.target.value) })} />
        </div>
        
        <button className="btn btn-green" style={{ marginTop: '10px' }} onClick={async () => {
          if (!settings) return;
          await supabase.from('delivery_settings').update(settings).eq('id', settings.id);
          alert('Settings saved!');
        }}>Save Settings</button>
      </div>

      {/* Branch Management (Dark Theme) */}
      <div className="panel">
        <h3>Manage Branches</h3>
        {branches.map(branch => (
          <div key={branch.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#fff' }}>{branch.name} <span style={{ color: '#9aa4bd', fontSize: '12px' }}>({branch.delivery_range_km} KM)</span></div>
            <div style={{ display: 'flex', gap: '10px' }}>
               <input style={{ width: '60px' }} type="number" defaultValue={branch.delivery_range_km} onBlur={(e) => { 
                 const newRange = parseFloat(e.target.value);
                 supabase.from('branches').update({ delivery_range_km: newRange }).eq('id', branch.id).then(() => {
                   setBranches(branches.map(b => b.id === branch.id ? { ...b, delivery_range_km: newRange } : b));
                 });
               }} />
               <button className="btn" style={{ background: branch.is_active ? '#059669' : '#dc2626' }} onClick={async () => {
                  await supabase.from('branches').update({ is_active: !branch.is_active }).eq('id', branch.id);
                  setBranches(branches.map(b => b.id === branch.id ? { ...b, is_active: !b.is_active } : b));
               }}>{branch.is_active ? 'ON' : 'OFF'}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Delivery Boy Section (Dark Theme) */}
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

      {/* Delivery Boys List (Dark Theme) */}
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
                <tr key={boy.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: '10px' }}>{boy.name}</td>
                  <td style={{ padding: '10px' }}>{boy.mobile}</td>
                  <td style={{ padding: '10px' }}>{boy.is_active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Admin;
