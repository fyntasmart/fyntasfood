import { supabase } from '../supabaseClient';

interface AdminChargesProps {
  settings: any;
  tiers: any[];
  refreshData: () => void;
}

const AdminCharges = ({ settings, tiers, refreshData }: AdminChargesProps) => {
  const addTier = async () => {
    const last = tiers[tiers.length - 1];
    const min = last ? last.max_km : 0;
    const max = min + 2;
    const price = last ? last.price + 10 : 10;
    await supabase.from('delivery_tiers').insert({ min_km: min, max_km: max, price });
    refreshData();
  };

  const deleteTier = async (id: string) => {
    if (tiers.length <= 1) return alert('Ek tier toh hona chahiye!');
    await supabase.from('delivery_tiers').delete().eq('id', id);
    refreshData();
  };

  return (
    <div className="panel">
      <h3>Delivery Charge Settings</h3>
      <label>Base Fare (₹)</label>
      <input type="number" value={settings?.base_fare ?? 0} onChange={(e) => { settings.base_fare = parseFloat(e.target.value); }} />
      <label>Distance Tiers</label>
      {tiers.map(tier => (
        <div key={tier.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input type="number" value={tier.min_km} style={{ width: '70px' }} onChange={(e) => { tier.min_km = parseFloat(e.target.value); }} />
          <span>KM to</span>
          <input type="number" value={tier.max_km} style={{ width: '70px' }} onChange={(e) => { tier.max_km = parseFloat(e.target.value); }} />
          <span>KM = ₹</span>
          <input type="number" value={tier.price} style={{ width: '70px' }} onChange={(e) => { tier.price = parseFloat(e.target.value); }} />
          <button className="btn btn-red" onClick={() => deleteTier(tier.id)}>Del</button>
        </div>
      ))}
      <button className="btn btn-blue" onClick={addTier}>+ Add Tier</button>
      <button className="btn btn-black" style={{ marginTop: '20px' }} onClick={async () => {
        await supabase.from('delivery_settings').update(settings).eq('id', settings.id);
        alert('Saved!');
      }}>Save Settings</button>
    </div>
  );
};

export default AdminCharges;
