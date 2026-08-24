import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DeliveryBoyDashboard = () => {
  const [mobile, setMobile] = useState('');
  const [boyId, setBoyId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Delivery Boy Login
  const login = async () => {
    if (!mobile || mobile.length !== 10) return alert('Sahi 10-digit mobile number daalo!');
    setLoading(true);

    const { data: boy, error: boyError } = await supabase
      .from('delivery_boys')
      .select('*')
      .eq('mobile', mobile)
      .single();

    if (boyError || !boy) {
      alert('Yeh mobile number Delivery Boy ke roop mein registered nahi hai!');
      setLoading(false);
      return;
    }

    // Registered Users mein bhi check karo
    const { data: regUser } = await supabase
      .from('registered_users')
      .select('*')
      .eq('mobile', mobile)
      .eq('role', 'delivery_boy')
      .maybeSingle();

    if (!regUser) {
      alert('Is number ka Delivery Boy login active nahi hai. Admin se contact karein!');
      setLoading(false);
      return;
    }

    setBoyId(boy.id);
    setIsLoggedIn(true);
    fetchOrders(boy.id);
    setLoading(false);
  };

  // Orders Fetch karo
  const fetchOrders = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('delivery_boy_id', id)
      .order('created_at', { ascending: false });

    if (!error) setOrders(data || []);
    setLoading(false);
  };

  // Status Update
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
        <p style={{ color: '#666' }}>Apna registered mobile number daalo</p>
        <input
          type="text"
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #d1d5db', borderRadius: '8px' }}
        />
        <button 
          onClick={login} 
          disabled={loading}
          style={{ width: '100%', padding: '15px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {loading ? 'Checking...' : 'Login'}
        </button>
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
      >Logout</button>

      <h3 style={{ color: '#111827' }}>Assigned Orders ({orders.length})</h3>
      {loading && <p>Loading...</p>}
      {orders.length === 0 && <p style={{ color: '#666' }}>Abhi koi order assign nahi hua.</p>}

      {orders.map(order => {
        const statusInfo = getStatusColor(order.status);
        return (
          <div key={order.id} style={{ background: '#fff', borderRadius: '10px', padding: '15px', marginBottom: '15px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Order #{order.id.slice(0, 6)}</p>
              <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{order.status}</span>
            </div>
            <p style={{ margin: '5px 0', color: '#666' }}><strong>Customer:</strong> {order.customer_name}</p>
            <p style={{ margin: '5px 0', color: '#666' }}><strong>Address:</strong> {order.address}</p>
            <p style={{ margin: '5px 0', color: '#666' }}><strong>Amount:</strong> ₹{order.total_amount}</p>

            {(order.status === 'accepted' || order.status === 'pending') && (
              <button 
                onClick={() => updateStatus(order.id, 'out_for_delivery')}
                style={{ width: '100%', padding: '10px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '10px', cursor: 'pointer' }}
              >Start Delivery (Out for Delivery)</button>
            )}
            {order.status === 'out_for_delivery' && (
              <button 
                onClick={() => updateStatus(order.id, 'delivered')}
                style={{ width: '100%', padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '10px', cursor: 'pointer' }}
              >Mark as Delivered</button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DeliveryBoyDashboard;
