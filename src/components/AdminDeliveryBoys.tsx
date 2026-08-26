import { useState } from 'react';
import { supabase } from '../supabaseClient';

interface AdminDeliveryBoysProps {
  deliveryBoys: any[];
  refreshData: () => void;
}

const AdminDeliveryBoys = ({ deliveryBoys, refreshData }: AdminDeliveryBoysProps) => {
  const [dbName, setDbName] = useState('');
  const [dbMobile, setDbMobile] = useState('');
  const [dbAadhar, setDbAadhar] = useState('');
  const [dbAddress, setDbAddress] = useState('');
  const [selectedBoy, setSelectedBoy] = useState<any>(null);
  const [isModal, setIsModal] = useState(false);
  const [menu, setMenu] = useState(false);

  const addBoy = async () => {
    if (!dbName || !dbMobile) return alert('Naam aur Mobile do!');
    await supabase.from('delivery_boys').insert({ name: dbName, mobile: dbMobile, aadhar: dbAadhar, address: dbAddress });
    await supabase.from('registered_users').insert({ mobile: dbMobile, role: 'delivery_boy' });
    setDbName(''); setDbMobile(''); setDbAadhar(''); setDbAddress('');
    refreshData();
  };

  const toggleActive = async (boy: any) => {
    await supabase.from('delivery_boys').update({ is_active: !boy.is_active }).eq('id', boy.id);
    refreshData();
  };

  const deleteBoy = async (id: string) => {
    if (!confirm('Delete karein?')) return;
    await supabase.from('delivery_boys').delete().eq('id', id);
    setIsModal(false);
    refreshData();
  };

  return (
    <div className="panel">
      <h3>Add Delivery Boy</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <input placeholder="Name" value={dbName} onChange={(e) => setDbName(e.target.value)} />
        <input placeholder="Mobile" value={dbMobile} onChange={(e) => setDbMobile(e.target.value)} />
        <input placeholder="Aadhar" value={dbAadhar} onChange={(e) => setDbAadhar(e.target.value)} />
        <input placeholder="Address" value={dbAddress} onChange={(e) => setDbAddress(e.target.value)} />
      </div>
      <button className="btn btn-green" onClick={addBoy}>Add Boy</button>
      <h3>All Boys (Click Name)</h3>
      {deliveryBoys.map(boy => (
        <div key={boy.id} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => { setSelectedBoy(boy); setIsModal(true); setMenu(false); }}>
          <span style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}>{boy.name}</span> - {boy.mobile}
        </div>
      ))}
      {isModal && selectedBoy && (
        <div className="modal-scrim show" onClick={() => setIsModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>Delivery Boy Details</h3><div className="modal-close" onClick={() => setIsModal(false)}>✕</div></div>
            <div className="modal-body">
              <div className="detail-row"><span className="dl">Name</span><span className="dv">{selectedBoy.name}</span></div>
              <div className="detail-row"><span className="dl">Mobile</span><span className="dv">{selectedBoy.mobile}</span></div>
              <div className="detail-row"><span className="dl">Aadhar</span><span className="dv">{selectedBoy.aadhar || 'N/A'}</span></div>
              <div className="detail-row"><span className="dl">Address</span><span className="dv">{selectedBoy.address || 'N/A'}</span></div>
              <div className="detail-row"><span className="dl">Status</span><span className="dv">{selectedBoy.is_active ? 'Active' : 'Inactive'}</span></div>
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button className="btn btn-blue" onClick={() => toggleActive(selectedBoy)}>{selectedBoy.is_active ? 'Deactivate' : 'Activate'}</button>
                <button className="btn btn-red" onClick={() => deleteBoy(selectedBoy.id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeliveryBoys;
