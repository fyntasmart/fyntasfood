import { useState } from 'react';
import { supabase } from '../supabaseClient';

const DeliveryBoyDashboard = () => {
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [boyId, setBoyId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const sendOtp = async () => {
    if (mobile.length !== 10) return setError('Sahi 10-digit mobile number daalo!');
    setLoading(true); setError('');
    
    const { data, error } = await supabase.functions.invoke('send-otp', { body: { mobile } });
    
    if (error) {
      setError('OTP error: ' + (data?.error || error.message || 'Unknown error'));
    } else {
      setStep(2);
      alert('OTP bhej diya gaya hai!');
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true); setError('');
    const { data, error } = await supabase.functions.invoke('verify-otp', { body: { mobile, code: otp } });

    if (error || !data?.success) {
      setError('Galat OTP! Dobara try karo.');
    } else if (data.role !== 'delivery_boy') {
      setError('Yeh mobile number Delivery Boy ke liye registered nahi hai!');
    } else {
      // Delivery Boy ka ID fetch karo
      const { data: boyData, error: boyError } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('mobile', mobile)
        .single();

      if (boyError || !boyData) {
        setError('Delivery Boy details nahi mili!');
      } else {
        setBoyId(boyData.id);
        setIsLoggedIn(true);
        fetchOrders(boyData.id); // Assigned orders fetch karo
      }
    }
    setLoading(false);
  };

  // Orders Fetch Logic
  const fetchOrders = async (id: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('delivery_boy_id', id)
      .order('created_at', { ascending: false });

    if (!error && data) setOrders(data);
  };

  // Status Update Logic
  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (!error) {
      alert('Status Updated!');
      if (boyId) fetchOrders(boyId);
    } else {
      alert('Error updating status: ' + error.message);
    }
  };

  // Status Colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#fee2e2', color: '#dc2626' };
      case 'accepted': return { bg: '#dbeafe', color: '#2563eb' };
      case 'out_for_delivery': return { bg: '#fef3c7', color: '#d97706' };
      case 'delivered': return { bg: '#d1fae5', color: '#059669' };
      default: return { bg: '#f3f4f6', color: '#111827' };
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center', padding: '20px' }}>
        <h2 style={{ color: '#111827' }}>Delivery Boy Login</h2>
        {step === 1 ? (
          <>
            <p style={{ color: '#666' }}>Registered mobile number daalo</p>
            <input 
              type="text" 
              placeholder="Mobile Number" 
              value={mobile} 
              onChange={(e) => setMobile(e.target.value)} 
              style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} 
            />
            {error && <p style={{ color: 'red', wordBreak: 'break-word' }}>{error}</p>}
            <button 
              onClick={sendOtp} 
              disabled={loading} 
              style={{ width: '100%', padding: '15px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <p style={{ color: '#666' }}>OTP daalo</p>
            <input 
              type="text" 
              placeholder="4-digit OTP" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              maxLength={4} 
              style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', textAlign: 'center', fontSize: '20px' }} 
            />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button 
              onClick={verifyOtp} 
              disabled={loading} 
              style={{ width: '100%', padding: '15px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button 
              onClick={() => setStep(1)} 
              style={{ background: 'none', border: 'none', color: '#666', marginTop: '10px', cursor: 'pointer' }}
            >
              Change Number
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f4f6f8', minHeight: '100vh' }}>
      <h2 style={{ color: '#111827' }}>Delivery Boy Dashboard</h2>
      <p style={{ color: '#666' }}>Mobile: {mobile}</p>
      <button 
        onClick={() => { setIsLoggedIn(false); setBoyId(null); setOrders([]); }}
        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', marginBottom: '20px' }}
      >
        Logout
      </button>

      <h3 style={{ color: '#111827' }}>Assigned Orders ({orders.length})</h3>

      {orders.length === 0 && <p style={{ color: '#666' }}>Abhi koi order assign nahi hua.</p>}

      {orders.map(order => {
        const statusInfo = getStatusColor(order.status);
        return (
          <div key={order.id} style={{ background: '#fff', borderRadius: '10px', padding: '15px', marginBottom: '15px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Order #{order.id.slice(0, 6)}</p>
              <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                {order.status}
              </span>
            </div>
            <p style={{ margin: '5px 0', color: '#666' }}><strong>Customer:</strong> {order.customer_name}</p>
            <p style={{ margin: '5px 0', color: '#666' }}><strong>Address:</strong> {order.address}</p>
            <p style={{ margin: '5px 0', color: '#666' }}><strong>Amount:</strong> ₹{order.total_amount}</p>

            {(order.status === 'accepted' || order.status === 'pending') && (
              <button 
                onClick={() => updateStatus(order.id, 'out_for_delivery')}
                style={{ width: '100%', padding: '10px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '10px', cursor: 'pointer' }}
              >
                Start Delivery (Out for Delivery)
              </button>
            )}
            {order.status === 'out_for_delivery' && (
              <button 
                onClick={() => updateStatus(order.id, 'delivered')}
                style={{ width: '100%', padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '10px', cursor: 'pointer' }}
              >
                Mark as Delivered
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DeliveryBoyDashboard;
