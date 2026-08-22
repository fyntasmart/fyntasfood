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
  per_km_charge: number;
  max_delivery_km: number;
}

const Admin = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: b } = await supabase.from('branches').select('*').order('name');
      const { data: s } = await supabase.from('delivery_settings').select('*').single();
      if (b) setBranches(b);
      if (s) setSettings(s);
    };
    fetchData();
  }, []);

  const toggleBranch = async (branch: Branch) => {
    const { error } = await supabase.from('branches').update({ is_active: !branch.is_active }).eq('id', branch.id);
    if (!error) {
      setBranches(branches.map((b) => b.id === branch.id ? { ...b, is_active: !b.is_active } : b));
    }
  };

  const updateRange = async (branchId: string, newRange: number) => {
    const { error } = await supabase.from('branches').update({ delivery_range_km: newRange }).eq('id', branchId);
    if (!error) {
      setBranches(branches.map((b) => b.id === branchId ? { ...b, delivery_range_km: newRange } : b));
      alert('Branch range update ho gayi!');
    }
  };

  const updateSettings = async () => {
    if (!settings) return;
    const { error } = await supabase.from('delivery_settings').update(settings).eq('id', settings.id);
    if (!error) alert('Delivery charges successfully update ho gaye!');
  };

  if (!settings) return <p>Loading Admin Panel...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#4f46e5' }}>Admin Dashboard</h1>

      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Global Delivery Charge Settings (Sab Branches pe lagu)</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <label>
            Base Fare (₹):
            <input type="number" value={settings.base_fare} onChange={(e) => setSettings({ ...settings, base_fare: parseFloat(e.target.value) })} style={{ marginLeft: '5px', width: '80px' }} />
          </label>
          <label>
            Per KM Charge (₹):
            <input type="number" value={settings.per_km_charge} onChange={(e) => setSettings({ ...settings, per_km_charge: parseFloat(e.target.value) })} style={{ marginLeft: '5px', width: '80px' }} />
          </label>
          <label>
            Max Delivery Limit (KM):
            <input type="number" value={settings.max_delivery_km} onChange={(e) => setSettings({ ...settings, max_delivery_km: parseFloat(e.target.value) })} style={{ marginLeft: '5px', width: '80px' }} />
          </label>
        </div>
        <button onClick={updateSettings} style={{ marginTop: '15px', padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Save Settings
        </button>
      </div>

      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h3>Manage Branches (On/Off aur Range)</h3>
        {branches.map((branch) => (
          <div key={branch.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <strong>{branch.name}</strong>
              <br />
              <span style={{ fontSize: '14px', color: '#666' }}>Current Range: {branch.delivery_range_km} KM</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontSize: '14px' }}>
                New Range (KM):
                <input type="number" defaultValue={branch.delivery_range_km} onBlur={(e) => updateRange(branch.id, parseFloat(e.target.value))} style={{ width: '60px', marginLeft: '5px', padding: '5px' }} />
              </label>
              <button onClick={() => toggleBranch(branch)} style={{ padding: '8px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: branch.is_active ? 'green' : 'red', color: 'white', fontWeight: 'bold' }}>
                {branch.is_active ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
