import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const getDistanceFromLatLonInKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Checkout = () => {
  // Default location (Bharatpur) taaki app crash na ho
  const [customerLat, setCustomerLat] = useState<number>(27.215);
  const [customerLng, setCustomerLng] = useState<number>(77.335);
  const [branches, setBranches] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Active branches, Settings, aur Tiers fetch karo
        const { data: branchesData } = await supabase
          .from('branches')
          .select('*')
          .eq('is_active', true);
        const { data: settingsData } = await supabase
          .from('delivery_settings')
          .select('*')
          .single();
        const { data: tiersData } = await supabase
          .from('delivery_tiers')
          .select('*')
          .order('max_km');

        if (branchesData && settingsData) {
          setBranches(branchesData);
          setSettings(settingsData);
          setTiers(tiersData || []);

          // 2. Geolocation try karo, agar fail ho jaye toh default location se kaam chalao
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setCustomerLat(position.coords.latitude);
                setCustomerLng(position.coords.longitude);
                setIsLoading(false);
              },
              () => {
                console.log('Location permission nahi mili, default location use ho rahi hai.');
                setIsLoading(false);
              }
            );
          } else {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-select nearest branch (jab lat/lng update ho)
  useEffect(() => {
    if (branches.length > 0 && settings && !selectedBranchId) {
      let nearest = branches[0];
      let minDist = Infinity;
      branches.forEach((b) => {
        const dist = getDistanceFromLatLonInKm(customerLat, customerLng, b.lat, b.lng);
        if (dist < minDist) {
          minDist = dist;
          nearest = b;
        }
      });
      handleBranchSelect(nearest);
    }
  }, [customerLat, customerLng, branches, settings]);

  // 🔥 Tier-based Price Calculation Logic (0-2=10, 2-4=20, etc.)
  const calculateCharge = (distance: number) => {
    if (tiers.length === 0) return settings?.base_fare || 0;
    // Sahi tier dhundo (jaise distance 1.5 hai toh max_km 2 wala tier milega)
    const tier = tiers.find((t) => distance <= t.max_km);
    if (tier) return tier.price;
    // Agar distance sabse zyada hai, toh last wale tier ka price lo
    return tiers[tiers.length - 1].price;
  };

  const handleBranchSelect = (branch: any) => {
    if (!settings) return;
    const distance = getDistanceFromLatLonInKm(customerLat, customerLng, branch.lat, branch.lng);

    if (distance > branch.delivery_range_km) {
      setRangeError(
        `Ye branch aapke location se out of range hai. Please dusri branch select kijiye. (Distance: ${distance.toFixed(2)} KM, Limit: ${branch.delivery_range_km} KM)`
      );
      setSelectedBranchId(null);
      setDeliveryCharge(0);
      return;
    }

    setRangeError('');
    setSelectedBranchId(branch.id);
    
    // 🔥 Naya charge calculation
    const charge = calculateCharge(distance);
    setDeliveryCharge(Math.round(charge));
  };

  if (isLoading) return <div style={{ background: '#0a0e1a', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading branches...</div>;

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
      <style>{`
        .panel { background: #121729; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 20px; margin-bottom: 20px; }
        .btn-branch { background: #161d33; border: 1px solid rgba(255,255,255,0.08); color: #f1f5f9; padding: 12px 16px; border-radius: 10px; cursor: pointer; margin-right: 10px; margin-bottom: 10px; transition: 0.2s; }
        .btn-branch:hover { border-color: #a78bfa; }
        .btn-branch.active { background: linear-gradient(120deg, #7c3aed, #ea580c); border: none; color: #fff; box-shadow: 0 8px 18px -4px rgba(124,58,237,.45); }
        .h3 { font-family: 'Poppins', sans-serif; color: #fff; margin-top: 0; }
      `}</style>

      <h1 className="h3" style={{ textAlign: 'center', marginBottom: '20px' }}>Select Branch</h1>

      <div className="panel">
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => handleBranchSelect(branch)}
              className={`btn-branch ${selectedBranchId === branch.id ? 'active' : ''}`}
            >
              {branch.name}
            </button>
          ))}
        </div>
      </div>

      {rangeError && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#fca5a5', padding: '10px', borderRadius: '10px', marginBottom: '20px' }}>
          ⚠️ {rangeError}
        </div>
      )}

      {selectedBranchId && deliveryCharge > 0 ? (
        <div style={{ background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.3)', color: '#6ee7b7', padding: '15px', borderRadius: '10px' }}>
          <h3>Selected Branch: {branches.find((b) => b.id === selectedBranchId)?.name}</h3>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
            Delivery Charge: ₹ {deliveryCharge}
          </p>
        </div>
      ) : (
        !rangeError && <p style={{ color: '#9aa4bd' }}>Koi branch select karein.</p>
      )}
    </div>
  );
};

export default Checkout;
