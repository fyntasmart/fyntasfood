import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';

const CustomerCheckout = ({ cart, onSuccess, onBack }: any) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [branch, setBranch] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState<'upi' | 'cod'>('upi'); // UPI by default
  
  // UPI Modal State
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [tempOrderId, setTempOrderId] = useState('');

  // UPI Details
  const UPI_ID = '9984389923@ybl';
  const UPI_NAME = 'Fyntas Food';

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

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

  // UPI Link Generator
  const generateUpiLink = (amount: number, orderRef: string) => {
    const payee = UPI_ID;
    const payeeName = encodeURIComponent(UPI_NAME);
    const amountStr = amount.toFixed(2);
    const note = encodeURIComponent(`Order ${orderRef}`);
    return `upi://pay?pa=${payee}&pn=${payeeName}&am=${amountStr}&cu=INR&tn=${note}`;
  };

  const handlePlaceOrder = async (paymentStatus: string, paymentMethod: string, paymentId: string | null) => {
    if (!name || !mobile || !address) return alert('Naam, Mobile aur Address bharna zaroori hai!');
    if (!branch) return alert('Koi branch select karo!');
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
    // Temporary ID for the Payment Note
    const tempId = Math.floor(100000 + Math.random() * 900000).toString();
    setTempOrderId(tempId);
    setShowUpiModal(true);
  };

  const handleCodButton = () => {
    handlePlaceOrder('pending', 'cod', null);
  };

  const handleConfirmUpiPayment = () => {
    // User ne QR scan karke pay kar diya, ab order confirm karo
    setShowUpiModal(false);
    handlePlaceOrder('paid', 'upi', `UPI-${tempOrderId}-${Date.now()}`);
  };

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#111827' }}>&larr;</button>
        <h2 style={{ margin: '0 auto', color: '#111827' }}>Checkout</h2>
        <div style={{ width: '24px' }}></div>
      </div>

      <div style={{ padding: '15px' }}>
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

        {/* Address Form */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '15px', marginBottom: '20px' }}>
          <h3 style={{ color: '#111827' }}>Delivery Address</h3>
          <input placeholder="Aapka Naam" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />
          <input placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />
          <textarea placeholder="Pura Address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />
        </div>

        {/* Payment Method Selection */}
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ color: '#111827' }}>Payment Method</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setPayMethod('upi')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: payMethod === 'upi' ? '2px solid #1e40af' : '1px solid #ccc', background: payMethod === 'upi' ? '#dbeafe' : '#fff', color: '#111827', fontWeight: 'bold', cursor: 'pointer' }}>UPI / QR</button>
            <button onClick={() => setPayMethod('cod')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: payMethod === 'cod' ? '2px solid #1e40af' : '1px solid #ccc', background: payMethod === 'cod' ? '#dbeafe' : '#fff', color: '#111827', fontWeight: 'bold', cursor: 'pointer' }}>Cash on Delivery</button>
          </div>
        </div>

        {/* Total */}
        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '15px' }}>
          <p style={{ display: 'flex', justifyContent: 'space-between', color: '#111827' }}><span>Items Total</span><span>₹{cart.reduce((s: number, i: any) => s + (i.price * i.qty), 0)}</span></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', color: '#111827' }}><span>Delivery Charge</span><span>₹{deliveryCharge}</span></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', color: '#111827', marginTop: '10px' }}><span>Total Amount</span><span>₹{totalAmount}</span></p>

          {payMethod === 'upi' && (
            <button onClick={handlePayButton} disabled={loading} style={{ width: '100%', padding: '16px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' }}>
              {loading ? 'Placing Order...' : 'Pay via UPI / QR'}
            </button>
          )}
          {payMethod === 'cod' && (
            <button onClick={handleCodButton} disabled={loading} style={{ width: '100%', padding: '16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' }}>
              {loading ? 'Placing Order...' : 'Place Order (COD)'}
            </button>
          )}
        </div>
      </div>

      {/* UPI QR Code Modal */}
      {showUpiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowUpiModal(false)}>
          <div style={{ background: '#fff', borderRadius: '15px', padding: '20px', maxWidth: '350px', width: '100%', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#111827', marginBottom: '5px' }}>Scan & Pay</h3>
            <p style={{ color: '#666', margin: '0 0 15px', fontSize: '14px' }}>Total Amount: <b style={{ color: '#1e40af' }}>₹{totalAmount}</b></p>

            {/* QR Code */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <QRCodeSVG 
                value={generateUpiLink(totalAmount, tempOrderId)} 
                size={200} 
                level="M" 
                fgColor="#000000" 
                bgColor="#ffffff" 
              />
            </div>

            <p style={{ fontSize: '12px', color: '#666' }}>Scan karein ya niche click karke UPI App open karein</p>

            <a 
              href={generateUpiLink(totalAmount, tempOrderId)} 
              style={{ display: 'block', width: '100%', padding: '12px', background: '#059669', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', marginBottom: '10px', boxSizing: 'border-box' }}
            >
              📱 Open UPI App
            </a>

            <button onClick={handleConfirmUpiPayment} style={{ width: '100%', padding: '12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              ✓ I have paid - Place Order
            </button>

            <button onClick={() => setShowUpiModal(false)} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', marginTop: '10px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCheckout;
