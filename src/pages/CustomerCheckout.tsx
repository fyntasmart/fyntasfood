import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const CustomerCheckout = ({ cart, onSuccess, onBack }: any) => {
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch Branches & Tiers on mount (useEffect)
  useEffect(() => {
    const fetchData = async () => {
      const { data: b } = await supabase.from('branches').select('*').eq('is_active', true);
      const { data: t } = await supabase.from('delivery_tiers').select('*').order('max_km');
      if (b) setBranches(b);
      if (t) setTiers(t);
    };
    fetchData();
  }, []);

  // Calculate Delivery Charge based on branch & tiers
  const calculateCharge = (branch: any) => {
    const dist = branch.delivery_range_km;
    const tier = tiers.find((t: any) => dist <= t.max_km);
    setDeliveryCharge(tier ? tier.price : (tiers[tiers.length - 1]?.price || 0));
    setBranch(branch);
  };

  const totalAmount = cart.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0) + deliveryCharge;

  const placeOrder = async () => {
    if (!address || !mobile || !name) return alert('Naam, Mobile aur Address bharna zaroori hai!');
    if (!branch) return alert('Koi branch select karo!');
    setLoading(true);

    try {
      // 1. Create Order
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        customer_name: name, customer_mobile: mobile, address,
        branch_id: branch.id, total_amount: totalAmount, delivery_charge: deliveryCharge, status: 'pending'
      }).select().single();

      if (orderError) throw orderError;

      // 2. Create Order Items
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
    <div style={{ padding: '20px' }}>
      <h2 style={{ margin: '0 0 20px', color: '#111827' }}>Checkout</h2>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', marginBottom: '15px' }}>&larr; Back to Cart</button>

      {/* Address Form */}
      <input placeholder="Aapka Naam" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '8px' }} />
      <input placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '8px' }} />
      <textarea placeholder="Pura Address (Gali, Mohalla, City)" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '8px' }} />

      {/* Select Branch */}
      <h3 style={{ color: '#111827' }}>Select Branch</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
        {branches.map((b: any) => (
          <button key={b.id} onClick={() => calculateCharge(b)} style={{ padding: '10px 15px', border: branch?.id === b.id ? '2px solid #1e40af' : '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', background: branch?.id === b.id ? '#e0e7ff' : '#fff', color: '#111827' }}>
            {b.name}
          </button>
        ))}
      </div>

      {/* Total */}
      <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '15px' }}>
        <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Items Total</span><span>₹{cart.reduce((s: number, i: any) => s + (i.price * i.qty), 0)}</span></p>
        <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery Charge</span><span>₹{deliveryCharge}</span></p>
        <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}><span>Total Payable</span><span>₹{totalAmount}</span></p>
        <button onClick={placeOrder} disabled={loading} style={{ width: '100%', padding: '15px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

export default CustomerCheckout;
