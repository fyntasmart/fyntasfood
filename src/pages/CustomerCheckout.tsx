import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet icons fix
const icon = L.icon({ iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const redIcon = L.icon({ iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png", iconSize: [25, 41], iconAnchor: [12, 41] });

const CustomerCheckout = ({ cart, onSuccess, onBack }: any) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  
  const [branch, setBranch] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: b } = await supabase.from('branches').select('*').eq('is_active', true);
      const { data: t } = await supabase.from('delivery_tiers').select('*').order('max_km');
      if (b) setBranches(b);
      if (t) setTiers(t);
      
      // Default location (Bharatpur)
      setUserLat(27.2150);
      setUserLng(77.3350);
      setAddress("PGHV+65Q, Malmalija, Uttar Pradesh 273002");
    };
    fetchData();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLat(latitude);
          setUserLng(longitude);
          setAddress(`My Current Location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          setUseCurrentLocation(true);
        },
        () => {  // ✅ FIX: error parameter hata diya
          alert("Location permission nahi mili. Address manually likhein.");
          setUseCurrentLocation(false);
        }
      );
    } else {
      alert("Geolocation supported nahi hai.");
      setUseCurrentLocation(false);
    }
  };

  const calculateCharge = (branch: any) => {
    setBranch(branch);
    const dist = branch.delivery_range_km;
    const tier = tiers.find((t: any) => dist <= t.max_km);
    setDeliveryCharge(tier ? tier.price : (tiers[tiers.length - 1]?.price || 0));
  };

  const totalAmount = cart.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0) + deliveryCharge;

  const placeOrder = async () => {
    if (!name || !mobile || !address) return alert('Naam, Mobile aur Address bharna zaroori hai!');
    if (!branch) return alert('Koi branch select karo!');
    setLoading(true);

    try {
      // ✅ customer_id NULL ja raha hai (Guest user), ab error nahi aayega
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        customer_id: null,
        customer_name: name, 
        customer_mobile: mobile, 
        address,
        branch_id: branch.id, 
        total_amount: totalAmount, 
        delivery_charge: deliveryCharge, 
        status: 'pending'
      }).select().single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item: any) => ({
        order_id: order.id, product_id: item.id, quantity: item.qty, price: item.price
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      alert('Order Successfully Placed!');
      onSuccess();
    } catch (e: any) {
      alert('Order fail: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .leaflet-container { height: 200px; width: 100%; z-index: 0; border-radius: 10px; margin-bottom: 15px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px', background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#111827' }}>&larr;</button>
        <h2 style={{ margin: '0 auto', color: '#111827' }}>Checkout</h2>
        <div style={{ width: '24px' }}></div>
      </div>

      <div style={{ padding: '15px' }}>
        
        {/* Saved Banner */}
        <div style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: '10px', padding: '10px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
          🐷 You saved 50 ₹ automatically
        </div>

        {/* Select Branch */}
        <h3 style={{ color: '#111827', marginBottom: '10px' }}>Select Branch</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          {branches.map((b: any) => (
            <button key={b.id} onClick={() => calculateCharge(b)} style={{
              padding: '10px 15px', border: branch?.id === b.id ? '2px solid #1e40af' : '1px solid #d1d5db',
              borderRadius: '8px', cursor: 'pointer', background: branch?.id === b.id ? '#dbeafe' : '#ffffff', color: '#111827', fontWeight: 'bold'
            }}>
              {b.name}
            </button>
          ))}
        </div>

        {/* Map Section */}
        <MapContainer center={[userLat || 27.215, userLng || 77.335]} zoom={13} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* User Location Marker */}
          {userLat && userLng && (
            <Marker position={[userLat, userLng]} icon={icon}>
              <Popup>Your Location</Popup>
            </Marker>
          )}
          {/* Branch Location Marker (Fake, using default map center) */}
          <Marker position={[27.2155, 77.3355]} icon={redIcon}>
            <Popup>Selected Branch</Popup>
          </Marker>
        </MapContainer>

        {/* Delivery To Section */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#111827' }}>Delivery to -</h3>
            <button onClick={() => setUseCurrentLocation(!useCurrentLocation)} style={{ color: '#1e40af', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
              + Change
            </button>
          </div>

          {useCurrentLocation && (
            <button onClick={getCurrentLocation} style={{ width: '100%', padding: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', color: '#1e40af', fontWeight: 'bold', marginBottom: '15px', cursor: 'pointer' }}>
              📍 Use My Current Location
            </button>
          )}

          <input placeholder="Aapka Naam" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />
          <input placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />
          <textarea 
            placeholder="Pura Address (Gali, Mohalla, City) - Yahan Click karke manually edit kar sakte hain"
            value={address} 
            onChange={(e) => { setAddress(e.target.value); setUseCurrentLocation(false); }} 
            rows={2}
            style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} 
          />
        </div>

        {/* Total & Place Order */}
        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '15px' }}>
          <p style={{ display: 'flex', justifyContent: 'space-between', color: '#111827' }}><span>Items Total</span><span>₹{cart.reduce((s: number, i: any) => s + (i.price * i.qty), 0)}</span></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', color: '#111827' }}><span>Delivery Charge</span><span>₹{deliveryCharge}</span></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', color: '#111827', marginTop: '10px' }}><span>Total Amount</span><span>₹{totalAmount}</span></p>
          
          <button onClick={placeOrder} disabled={loading} style={{
            width: '100%', padding: '16px', background: '#1e40af', color: '#ffffff', border: 'none', borderRadius: '10px',
            fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px'
          }}>
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomerCheckout;
