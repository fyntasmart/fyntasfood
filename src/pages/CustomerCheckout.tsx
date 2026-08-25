import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import QRCode from 'react-qr-code';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const icon = L.icon({ iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] });

// 🔥 Razorpay API Key (Public Key)
const RAZORPAY_KEY_ID = 'rzp_live_TU5CXRkM3NXLkk';

const CustomerCheckout = ({ cart, onSuccess, onBack, savedMobile, isLoggedIn }: any) => {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState(savedMobile || '');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [branch, setBranch] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [tiers, setTiers] = useState<any[]>([]);
  
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  const [payMethod, setPayMethod] = useState<'razorpay' | 'upi' | 'cod'>('razorpay');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [tempOrderId, setTempOrderId] = useState('');

  const UPI_ID = '9984389923@ybl';
  const UPI_NAME = 'Fyntas Food';

  // 🔥 Razorpay Script Load Logic (React 19 compatible)
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Agar user logged in hai, toh Step 3 par le jao
  useEffect(() => {
    if (isLoggedIn && savedMobile) {
      setMobile(savedMobile);
      setStep(3);
    }
  }, [isLoggedIn, savedMobile]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: b } = await supabase.from('branches').select('*').eq('is_active', true);
      const { data: t } = await supabase.from('delivery_tiers').select('*').order('max_km');
      if (b) setBranches(b);
      if (t) setTiers(t);
      setUserLat(27.2150);
      setUserLng(77.3350);
      setAddress("PGHV+65Q, Malmalija, Uttar Pradesh 273002");
    };
    fetchData();
  }, []);

  const calculateCharge = (branch: any) => {
    setBranch(branch);
    const dist = branch.delivery_range_km;
    const tier = tiers.find((t: any) => dist <= t.max_km);
    setDeliveryCharge(tier ? tier.price : (tiers[tiers.length - 1]?.price || 0));
  };

  const totalAmount = cart.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0) + deliveryCharge;

  const sendOtp = async () => {
    if (mobile.length !== 10) return setError('Sahi 10-digit mobile number daalo!');
    setLoading(true); setError('');
    const { data, error } = await supabase.functions.invoke('send-otp', { body: { mobile, role: 'customer' } });
    if (error) setError('OTP error: ' + (data?.error || error.message));
    else { setStep(2); alert('OTP bhej diya gaya hai!'); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true); setError('');
    const { data, error } = await supabase.functions.invoke('verify-otp', { body: { mobile, code: otp } });
    if (error || !data?.success) setError('Galat OTP! Dobara try karo.');
    else { setStep(3); }
    setLoading(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLat(latitude); setUserLng(longitude);
          setAddress(`My Current Location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          setUseCurrentLocation(true);
        },
        () => { alert("Location permission nahi mili. Address manually likhein."); setUseCurrentLocation(false); }
      );
    } else { alert("Geolocation supported nahi hai."); setUseCurrentLocation(false); }
  };

  const generateUpiLink = (amount: number, orderRef: string) => {
    return `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Order ' + orderRef)}`;
  };

  // 🔥 Razorpay Payment Handler (Direct window.Razorpay use)
  const handleRazorpay = async () => {
    if (!name || !address || !branch) return alert('Naam, Address aur Branch bharna zaroori hai!');
    setLoading(true);

    try {
      // 1. Order pehle database mein save karo
      const orderData = {
        customer_id: null,
        customer_name: name,
        customer_mobile: mobile,
        address,
        branch_id: branch.id,
        total_amount: totalAmount,
        delivery_charge: deliveryCharge,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'razorpay'
      };

      const { data: order, error: orderError } = await supabase.from('orders').insert(orderData).select().single();
      if (orderError) throw orderError;

      // 2. Razorpay Options
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: totalAmount * 100,
        currency: 'INR',
        name: 'FYNTAS Food',
        description: 'Order Payment',
        handler: async (response: any) => {
          // 3. verify-payment Edge Function call karo
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment', {
            body: { 
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: order.id,
              amount: totalAmount * 100
            }
          });

          if (verifyError || !verifyData?.success) {
            alert('Payment verification fail hua! Contact support.');
            return;
          }

          // 4. Order Items save karo
          const orderItems = cart.map((item: any) => ({
            order_id: order.id, product_id: item.id, quantity: item.qty, price: item.price
          }));
          await supabase.from('order_items').insert(orderItems);

          // 5. Payment success update
          await supabase.from('orders').update({ payment_status: 'paid', status: 'accepted' }).eq('id', order.id);

          alert('Payment Successful! Order Placed!');
          onSuccess();
        },
        prefill: { name, contact: mobile },
        theme: { color: '#111111' }
      };

      // Razorpay Open
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert('Razorpay script load nahi hua! Page refresh karke try karein.');
      }
    } catch (e: any) {
      alert('Razorpay error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodButton = () => {
    handlePlaceOrder('pending', 'cod', null);
  };

  const handleConfirmUpiPayment = () => {
    setShowUpiModal(false);
    handlePlaceOrder('paid', 'upi', `UPI-${tempOrderId}-${Date.now()}`);
  };

  const handlePlaceOrder = async (paymentStatus: string, paymentMethod: string, paymentId: string | null) => {
    if (!name || !address || !branch) return alert('Naam, Address aur Branch bharna zaroori hai!');
    setLoading(true);

    try {
      const orderData = {
        customer_id: null,
        customer_name: name,
        customer_mobile: mobile,
        address,
        branch_id: branch.id,
        total_amount: totalAmount,
        delivery_charge: deliveryCharge,
        status: 'pending',
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        payment_id: paymentId
      };

      const { data: order, error: orderError } = await supabase.from('orders').insert(orderData).select().single();
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

  const handlePayButton = () => {
    const tempId = Math.floor(100000 + Math.random() * 900000).toString();
    setTempOrderId(tempId); setShowUpiModal(true);
  };

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#111827' }}>&larr;</button>
        <h2 style={{ margin: '0 auto', color: '#111827' }}>Checkout</h2>
        <div style={{ width: '24px' }}></div>
      </div>

      <div style={{ padding: '15px' }}>
        {step === 1 && (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h3 style={{ color: '#111827' }}>Login / Verify</h3>
            <p style={{ color: '#666' }}>Order karne ke liye apna mobile number daalo</p>
            <input type="text" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            {error && <p style={{ color: 'red', wordBreak: 'break-word' }}>{error}</p>}
            <button onClick={sendOtp} disabled={loading} style={{ width: '100%', padding: '15px', background: '#111111', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? 'Sending...' : 'Send OTP'}</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h3 style={{ color: '#111827' }}>Enter OTP</h3>
            <p style={{ color: '#666' }}>Mobile {mobile} par bheja gaya OTP daalo</p>
            <input type="text" placeholder="4-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', textAlign: 'center', fontSize: '20px' }} />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button onClick={verifyOtp} disabled={loading} style={{ width: '100%', padding: '15px', background: '#111111', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#666', marginTop: '10px', cursor: 'pointer' }}>Change Number</button>
          </div>
        )}

        {step === 3 && (
          <>
            <p style={{ color: '#059669', fontWeight: 'bold', marginBottom: '15px' }}>✅ Mobile Verified: {mobile}</p>
            <h3 style={{ color: '#111827', marginBottom: '10px' }}>Select Branch</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
              {branches.map((b: any) => (
                <button key={b.id} onClick={() => calculateCharge(b)} style={{ padding: '10px 15px', border: branch?.id === b.id ? '2px solid #111111' : '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', background: branch?.id === b.id ? '#f3f4f6' : '#ffffff', color: '#111827', fontWeight: 'bold' }}>{b.name}</button>
              ))}
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#111827', margin: 0 }}>Delivery To -</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={getCurrentLocation} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>📍 Use My Location</button>
                  <button onClick={() => setUseCurrentLocation(!useCurrentLocation)} style={{ background: 'none', border: 'none', color: '#111', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>+ Change</button>
                </div>
              </div>

              {useCurrentLocation ? (
                <div style={{ marginBottom: '15px' }}>
                  <MapContainer center={[userLat || 27.215, userLng || 77.335]} zoom={13} scrollWheelZoom={false} style={{ height: '200px', width: '100%', borderRadius: '10px', zIndex: 0 }}>
                    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {userLat && userLng && (
                      <Marker position={[userLat, userLng]} icon={icon}>
                        <Popup>Your Location</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Current Location use ho rahi hai. Neeche manually bhi edit kar sakte hain.</p>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Manual Address mode ON hai. Neeche address likhein.</p>
              )}

              <input placeholder="Aapka Naam (Must)" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />
              <textarea placeholder="Pura Address (Yahan click karke manually edit kar sakte hain)" value={address} onChange={(e) => { setAddress(e.target.value); setUseCurrentLocation(false); }} rows={2} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ color: '#111827' }}>Payment Method</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setPayMethod('razorpay')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: payMethod === 'razorpay' ? '2px solid #111111' : '1px solid #ccc', background: payMethod === 'razorpay' ? '#f3f4f6' : '#fff', color: '#111827', fontWeight: 'bold', cursor: 'pointer' }}>💳 Razorpay</button>
                <button onClick={() => setPayMethod('upi')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: payMethod === 'upi' ? '2px solid #111111' : '1px solid #ccc', background: payMethod === 'upi' ? '#f3f4f6' : '#fff', color: '#111827', fontWeight: 'bold', cursor: 'pointer' }}>UPI / QR</button>
                <button onClick={() => setPayMethod('cod')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: payMethod === 'cod' ? '2px solid #111111' : '1px solid #ccc', background: payMethod === 'cod' ? '#f3f4f6' : '#fff', color: '#111827', fontWeight: 'bold', cursor: 'pointer' }}>COD</button>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '15px' }}>
              <p style={{ display: 'flex', justifyContent: 'space-between', color: '#111827' }}><span>Items Total</span><span>₹{cart.reduce((s: number, i: any) => s + (i.price * i.qty), 0)}</span></p>
              <p style={{ display: 'flex', justifyContent: 'space-between', color: '#111827' }}><span>Delivery Charge</span><span>₹{deliveryCharge}</span></p>
              <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', color: '#111827', marginTop: '10px' }}><span>Total Amount</span><span>₹{totalAmount}</span></p>

              {payMethod === 'razorpay' && <button onClick={handleRazorpay} disabled={loading} style={{ width: '100%', padding: '16px', background: '#111111', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' }}>{loading ? 'Processing...' : 'Pay via Razorpay'}</button>}
              {payMethod === 'upi' && <button onClick={handlePayButton} disabled={loading} style={{ width: '100%', padding: '16px', background: '#111111', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' }}>{loading ? 'Placing...' : 'Pay via UPI / QR'}</button>}
              {payMethod === 'cod' && <button onClick={handleCodButton} disabled={loading} style={{ width: '100%', padding: '16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' }}>{loading ? 'Placing...' : 'Place Order (COD)'}</button>}
            </div>
          </>
        )}
      </div>

      {showUpiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowUpiModal(false)}>
          <div style={{ background: '#fff', borderRadius: '15px', padding: '20px', maxWidth: '350px', width: '100%', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#111827', marginBottom: '5px' }}>Scan & Pay</h3>
            <p style={{ color: '#666', margin: '0 0 15px', fontSize: '14px' }}>Total Amount: <b style={{ color: '#111111' }}>₹{totalAmount}</b></p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <QRCode value={generateUpiLink(totalAmount, tempOrderId)} size={200} fgColor="#000000" bgColor="#ffffff" />
            </div>
            <a href={generateUpiLink(totalAmount, tempOrderId)} style={{ display: 'block', width: '100%', padding: '12px', background: '#059669', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', marginBottom: '10px', boxSizing: 'border-box' }}>📱 Open UPI App</a>
            <button onClick={handleConfirmUpiPayment} style={{ width: '100%', padding: '12px', background: '#111111', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>✓ I have paid - Place Order</button>
            <button onClick={() => setShowUpiModal(false)} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', marginTop: '10px' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCheckout;
