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

interface DeliveryBoy {
  id: string;
  name: string;
  mobile: string;
  aadhar: string;
  address: string;
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

  const toggleBranch = async (branch: Branch) => {
    const { error } = await supabase.from('branches').update({ is_active: !branch.is_active }).eq('id', branch.id);
    if (!error) setBranches(branches.map(b => b.id === branch.id ? { ...b, is_active: !b.is_active } : b));
  };

  const updateRange = async (branchId: string, newRange: number) => {
    const { error } = await supabase.from('branches').update({ delivery_range_km: newRange }).eq('id', branchId);
    if (!error) {
      setBranches(branches.map(b => b.id === branchId ? { ...b, delivery_range_km: newRange } : b));
      alert('Branch range update ho gayi!');
    }
  };

  const updateSettings = async () => {
    if (!settings) return;
    const { error } = await supabase.from('delivery_settings').update(settings).eq('id', settings.id);
    if (!error) alert('Delivery charges successfully update ho gaye!');
  };

  // Add Delivery Boy Function
  const addDeliveryBoy = async () => {
    if (!dbName || !dbMobile || !dbAadhar) return alert('Name, Mobile aur Aadhar zaroori hain!');
    if (dbMobile.length !== 10) return alert('Sahi 10-digit mobile number daalo!');

    // 1. Delivery Boys table mein insert
    const { error: dbError } = await supabase.from('delivery_boys').insert({
      name: dbName,
      mobile: dbMobile,
      aadhar: dbAadhar,
      address: dbAddress
    });

    if (dbError) {
      alert('Error adding delivery boy: ' + dbError.message);
      return;
    }

    // 2. registered_users table mein insert (taaki wo OTP se login kar sake)
    const { error: regError } = await supabase.from('registered_users').insert({
      mobile: dbMobile,
      role: 'delivery_boy'
    });

    if (regError && regError.code !== '23505') {
      alert('Delivery boy add hua, lekin login register nahi ho paya. Error: ' + regError.message);
    } else {
      alert('Delivery Boy add ho gaya! Wo ab OTP se login kar sakta hai.');
      setDbName(''); setDbMobile(''); setDbAadhar(''); setDbAddress('');
      // Refresh list
      const { data: d } = await supabase.from('delivery_boys').select('*').order('created_at', { ascending: false });
      if (d) setDeliveryBoys(d);
    }
  };

  // Toggle Delivery Boy Active
  const toggleBoyActive = async (boy: DeliveryBoy) => {
    // Simple update logic
    const { error } = await supabase.from('delivery_boys').update({ is_active: !boy.is_active }).eq('id', boy.id);
    if (!error) {
      setDeliveryBoys(deliveryBoys.map(b => b.id === boy.id ? { ...b, is_active: !b.is_active } : b));
    }
  };

  if (!settings) return <p>Loading Admin Panel...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#4f46e5' }}>Admin Dashboard</h1>
        <button onClick={onLogout} style={{ padding: '10px 20px', background: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* Delivery Settings */}
      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Global Delivery Charge Settings</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <label>Base Fare (₹):
            <input type="number" value={settings.base_fare} onChange={(e) => setSettings({ ...settings, base_fare: parseFloat(e.target.value) })} style={{ marginLeft: '5px', width: '80px' }} />
          </label>
          <label>Per KM Charge (₹):
            <input type="number" value={settings.per_km_charge} onChange={(e) => setSettings({ ...settings, per_km_charge: parseFloat(e.target.value) })} style={{ marginLeft: '5px', width: '80px' }} />
          </label>
          <label>Max Delivery Limit (KM):
            <input type="number" value={settings.max_delivery_km} onChange={(e) => setSettings({ ...settings, max_delivery_km: parseFloat(e.target.value) })} style={{ marginLeft: '5px', width: '80px' }} />
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

      {/* Delivery Boys List */}
      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h3>All Delivery Boys</h3>
        {deliveryBoys.length === 0 ? <p>Abhi koi delivery boy add nahi hua.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '8px' }}>Name</th>
                <th style={{ padding: '8px' }}>Mobile</th>
                <th style={{ padding: '8px' }}>Aadhar</th>
                <th style={{ padding: '8px' }}>Status</th>
                <th style={{ padding: '8px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {deliveryBoys.map((boy) => (
                <tr key={boy.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{boy.name}</td>
                  <td style={{ padding: '8px' }}>{boy.mobile}</td>
                  <td style={{ padding: '8px' }}>{boy.aadhar}</td>
                  <td style={{ padding: '8px' }}>{boy.is_active ? 'Active' : 'Inactive'}</td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => toggleBoyActive(boy)} style={{ padding: '5px 10px', cursor: 'pointer', background: boy.is_active ? 'red' : 'green', color: 'white', border: 'none', borderRadius: '4px' }}>
                      {boy.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
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
