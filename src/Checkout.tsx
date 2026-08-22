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
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Active branches fetch karo
        const { data: branchesData } = await supabase
          .from('branches')
          .select('*')
          .eq('is_active', true);
        const { data: settingsData } = await supabase
          .from('delivery_settings')
          .select('*')
          .single();

        if (branchesData && settingsData) {
          setBranches(branchesData);
          setSettings(settingsData);

          // 2. Geolocation try karo, agar fail ho jaye toh default location se kaam chalao
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setCustomerLat(position.coords.latitude);
                setCustomerLng(position.coords.longitude);
                setIsLoading(false);
              },
              () => {
                console.log(
                  'Location permission nahi mili, default location use ho rahi hai.'
                );
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
        const dist = getDistanceFromLatLonInKm(
          customerLat,
          customerLng,
          b.lat,
          b.lng
        );
        if (dist < minDist) {
          minDist = dist;
          nearest = b;
        }
      });
      handleBranchSelect(nearest);
    }
  }, [customerLat, customerLng, branches, settings]);

  const handleBranchSelect = (branch: any) => {
    if (!settings) return;
    const distance = getDistanceFromLatLonInKm(
      customerLat,
      customerLng,
      branch.lat,
      branch.lng
    );

    if (distance > branch.delivery_range_km) {
      setRangeError(
        `Ye branch aapke location se out of range hai. Please dusri branch select kijiye. (Distance: ${distance.toFixed(
          2
        )} KM, Limit: ${branch.delivery_range_km} KM)`
      );
      setSelectedBranchId(null);
      setDeliveryCharge(0);
      return;
    }

    setRangeError('');
    setSelectedBranchId(branch.id);
    const charge = settings.base_fare + distance * settings.per_km_charge;
    setDeliveryCharge(Math.round(charge));
  };

  if (isLoading) return <p>Loading branches...</p>;

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'sans-serif',
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      <h1>Select Branch</h1>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => handleBranchSelect(branch)}
            style={{
              padding: '10px 15px',
              border:
                selectedBranchId === branch.id
                  ? '2px solid blue'
                  : '1px solid #ccc',
              background: selectedBranchId === branch.id ? '#e0f7fa' : 'white',
              cursor: 'pointer',
            }}
          >
            {branch.name}
          </button>
        ))}
      </div>

      {rangeError && (
        <div
          style={{
            color: 'red',
            background: '#ffe6e6',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
          }}
        >
          ⚠️ {rangeError}
        </div>
      )}

      {selectedBranchId && deliveryCharge > 0 ? (
        <div
          style={{
            border: '1px solid green',
            padding: '15px',
            borderRadius: '8px',
            background: '#f0fdf4',
          }}
        >
          <h3>
            Selected Branch:{' '}
            {branches.find((b) => b.id === selectedBranchId)?.name}
          </h3>
          <p>
            Delivery Charge: <strong>₹ {deliveryCharge}</strong>
          </p>
        </div>
      ) : (
        !rangeError && <p>Koi branch select karein.</p>
      )}
    </div>
  );
};

export default Checkout;
