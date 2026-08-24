import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const CustomerAddresses = () => {
  const [mobile, setMobile] = useState('');
  const [addresses, setAddresses] = useState<any[]>([]);
  
  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Form States
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fCity, setFCity] = useState('');
  const [fPincode, setFPincode] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch addresses
  const fetchAddresses = async () => {
    if (!mobile || mobile.length !== 10) return alert('Sahi 10-digit mobile number daalo!');
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_mobile', mobile)
      .order('created_at', { ascending: false });

    if (!error) setAddresses(data || []);
  };

  // Close 3-dot menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset Form
  const resetForm = () => {
    setEditingAddress(null);
    setFName(''); setFPhone(''); setFAddress(''); setFCity(''); setFPincode('');
  };

  // Open Add Modal
  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (addr: any) => {
    setEditingAddress(addr);
    setFName(addr.full_name);
    setFPhone(addr.phone);
    setFAddress(addr.address);
    setFCity(addr.city);
    setFPincode(addr.pincode);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  // Save Address (Add or Update)
  const saveAddress = async () => {
    if (!fName || !fPhone || !fAddress) return alert('Name, Phone aur Address bharna zaroori hai!');
    
    const addressData = {
      customer_mobile: mobile,
      full_name: fName,
      phone: fPhone,
      address: fAddress,
      city: fCity,
      pincode: fPincode
    };

    let error = null;
    if (editingAddress) {
      // Update
      const res = await supabase.from('customer_addresses').update(addressData).eq('id', editingAddress.id);
      error = res.error;
    } else {
      // Add
      const res = await supabase.from('customer_addresses').insert(addressData);
      error = res.error;
    }

    if (error) {
      alert('Error saving address: ' + error.message);
    } else {
      alert('Address Saved!');
      setIsModalOpen(false);
      resetForm();
      fetchAddresses();
    }
  };

  // Delete Address
  const deleteAddress = async (id: string) => {
    if (!confirm('Kya aap yeh address delete karna chahte hain?')) return;
    const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
    if (!error) {
      setOpenMenuId(null);
      fetchAddresses();
    } else {
      alert('Error deleting: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#ffffff', minHeight: '100vh' }}>
      <h2 style={{ color: '#111827', marginBottom: '20px' }}>Manage Addresses</h2>

      {/* Mobile Input */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Apna Mobile Number Daalo" 
          value={mobile} 
          onChange={(e) => setMobile(e.target.value)}
          style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }}
        />
        <button onClick={fetchAddresses} style={{ padding: '12px 20px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          View
        </button>
      </div>

      {/* Add Address Button */}
      <button onClick={openAddModal} style={{ width: '100%', padding: '15px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px' }}>
        + Add New Address
      </button>

      {/* Address List */}
      {addresses.length === 0 && <p style={{ color: '#666' }}>Koi address save nahi hua.</p>}

      {addresses.map((addr) => (
        <div key={addr.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '15px', marginBottom: '15px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 5px', fontWeight: 'bold', color: '#111827' }}>{addr.full_name}</p>
              <p style={{ margin: '0 0 5px', color: '#666', fontSize: '14px' }}>{addr.address}</p>
              <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{addr.city} - {addr.pincode} | {addr.phone}</p>
            </div>
            
            {/* 3 Dot Menu */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button onClick={() => setOpenMenuId(openMenuId === addr.id ? null : addr.id)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#111827' }}>⋮</button>
              
              {openMenuId === addr.id && (
                <div style={{ position: 'absolute', top: '25px', right: '0', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 20, width: '150px', overflow: 'hidden' }}>
                  <button onClick={() => openEditModal(addr)} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', color: '#111827', borderBottom: '1px solid #f3f4f6' }}>✏️ Edit</button>
                  <button onClick={() => deleteAddress(addr.id)} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}>🗑️ Delete</button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setIsModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: '15px', padding: '20px', maxWidth: '400px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#111827' }}>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#111827' }}>✕</button>
            </div>

            <label style={{ display: 'block', color: '#6b7280', marginBottom: '5px' }}>Full Name</label>
            <input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Name" style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />

            <label style={{ display: 'block', color: '#6b7280', marginBottom: '5px' }}>Phone Number</label>
            <input value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="Phone" style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />

            <label style={{ display: 'block', color: '#6b7280', marginBottom: '5px' }}>Full Address</label>
            <textarea value={fAddress} onChange={(e) => setFAddress(e.target.value)} placeholder="Address" rows={2} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#6b7280', marginBottom: '5px' }}>City</label>
                <input value={fCity} onChange={(e) => setFCity(e.target.value)} placeholder="City" style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#6b7280', marginBottom: '5px' }}>Pincode</label>
                <input value={fPincode} onChange={(e) => setFPincode(e.target.value)} placeholder="Pincode" style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />
              </div>
            </div>

            <button onClick={saveAddress} style={{ width: '100%', padding: '15px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              {editingAddress ? 'Update Address' : 'Save Address'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerAddresses;
