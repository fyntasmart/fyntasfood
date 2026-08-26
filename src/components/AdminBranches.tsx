import { useState } from 'react';
import { supabase } from '../supabaseClient';

interface AdminBranchesProps {
  branches: any[];
  refreshData: () => void;
}

const AdminBranches = ({ branches, refreshData }: AdminBranchesProps) => {
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [newRange, setNewRange] = useState('10');
  const [newMaxKm, setNewMaxKm] = useState('15');
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [isModal, setIsModal] = useState(false);

  const addBranch = async () => {
    if (!newName || !newLat || !newLng) return alert('Name, Lat aur Lng do!');
    await supabase.from('branches').insert({ name: newName, address: newAddress, lat: parseFloat(newLat), lng: parseFloat(newLng), delivery_range_km: parseFloat(newRange) || 10, max_delivery_km: parseFloat(newMaxKm) || 15 });
    setNewName(''); setNewAddress(''); setNewLat(''); setNewLng(''); setNewRange('10'); setNewMaxKm('15');
    refreshData();
  };

  const toggleActive = async (branch: any) => {
    await supabase.from('branches').update({ is_active: !branch.is_active }).eq('id', branch.id);
    refreshData();
  };

  const deleteBranch = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('branches').delete().eq('id', id);
    setIsModal(false);
    refreshData();
  };

  return (
    <div className="panel">
      <h3>Add Branch</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <input placeholder="Branch Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input placeholder="Address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
        <input placeholder="Latitude" value={newLat} onChange={(e) => setNewLat(e.target.value)} />
        <input placeholder="Longitude" value={newLng} onChange={(e) => setNewLng(e.target.value)} />
        <input placeholder="Range (KM)" value={newRange} onChange={(e) => setNewRange(e.target.value)} />
        <input placeholder="Max Delivery (KM)" value={newMaxKm} onChange={(e) => setNewMaxKm(e.target.value)} />
      </div>
      <button className="btn btn-black" onClick={addBranch}>Add</button>
      <h3>All Branches</h3>
      {branches.map(branch => (
        <div key={branch.id} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => { setSelectedBranch(branch); setIsModal(true); }}>
          <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{branch.name}</span> - {branch.delivery_range_km} KM
        </div>
      ))}
      {isModal && selectedBranch && (
        <div className="modal-scrim show" onClick={() => setIsModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>Branch Details</h3><div className="modal-close" onClick={() => setIsModal(false)}>✕</div></div>
            <div className="modal-body">
              <div className="detail-row"><span className="dl">Name</span><span className="dv">{selectedBranch.name}</span></div>
              <div className="detail-row"><span className="dl">Address</span><span className="dv">{selectedBranch.address || 'N/A'}</span></div>
              <div className="detail-row"><span className="dl">Lat</span><span className="dv">{selectedBranch.lat}</span></div>
              <div className="detail-row"><span className="dl">Lng</span><span className="dv">{selectedBranch.lng}</span></div>
              <div className="detail-row"><span className="dl">Range</span><span className="dv">{selectedBranch.delivery_range_km} KM</span></div>
              <div className="detail-row"><span className="dl">Max</span><span className="dv">{selectedBranch.max_delivery_km} KM</span></div>
              <div className="detail-row"><span className="dl">Status</span><span className="dv">{selectedBranch.is_active ? 'Active' : 'Inactive'}</span></div>
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button className="btn btn-blue" onClick={() => toggleActive(selectedBranch)}>Toggle</button>
                <button className="btn btn-red" onClick={() => deleteBranch(selectedBranch.id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBranches;
