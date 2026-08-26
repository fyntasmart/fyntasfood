import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CustomerOrders = ({ savedMobile, isLoggedIn }: any) => {
  const [mobile, setMobile] = useState(savedMobile || '');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // 🔥 Auto-fetch if already logged in
  useEffect(() => {
    if (isLoggedIn && savedMobile) {
      setMobile(savedMobile);
      fetchOrders();
    }
  }, [isLoggedIn, savedMobile]);

  const fetchOrders = async () => {
    if (!mobile || mobile.length !== 10) return alert('Sahi 10-digit mobile number daalo!');
    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_mobile', mobile)
      .order('created_at', { ascending: false });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  // 🔥 Cancel/Return Function
  const cancelOrder = async (orderId: string) => {
    if (!confirm('Kya aap yeh order cancel karna chahte hain?')) return;
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    if (!error) {
      alert('Order Cancelled!');
      fetchOrders();
    } else {
      alert('Error: ' + error.message);
    }
  };

  const returnOrder = async (orderId: string) => {
    if (!confirm('Kya aap yeh order return karna chahte hain?')) return;
    const { error } = await supabase.from('orders').update({ status: 'returned' }).eq('id', orderId);
    if (!error) {
      alert('Order Returned!');
      fetchOrders();
    } else {
      alert('Error: ' + error.message);
    }
  };

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#fee2e2', color: '#dc2626', label: 'Pending' };
      case 'accepted': return { bg: '#dbeafe', color: '#2563eb', label: 'Accepted' };
      case 'out_for_delivery': return { bg: '#fef3c7', color: '#d97706', label: 'Out for Delivery' };
      case 'delivered': return { bg: '#d1fae5', color: '#059669', label: 'Delivered' };
      case 'cancelled': return { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled' };
      case 'returned': return { bg: '#fee2e2', color: '#dc2626', label: 'Returned' };
      default: return { bg: '#f3f4f6', color: '#111111', label: status };
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      <h2 style={{ color: '#111111' }}>My Orders</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Apna Mobile Number Daalo" 
          value={mobile} 
          onChange={(e) => setMobile(e.target.value)}
          style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111111' }}
        />
        <button 
          onClick={fetchOrders} 
          style={{ padding: '12px 20px', background: '#111111', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >View Orders</button>
      </div>

      {loading && <p style={{ color: '#666' }}>Loading...</p>}
      {searched && !loading && orders.length === 0 && <p style={{ color: '#666' }}>Koi order nahi mila.</p>}

      {orders.map(order => {
        const statusInfo = getStatusColor(order.status);
        return (
          <div key={order.id} style={{ background: '#fff', borderRadius: '10px', padding: '15px', marginBottom: '15px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#111111' }}>Order #{order.id.slice(0, 6)}</p>
                <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                {statusInfo.label}
              </span>
            </div>
            <p style={{ margin: '5px 0', color: '#666' }}>Total: <b>₹{order.total_amount}</b></p>

            {/* 🔥 Cancel / Return Buttons */}
            {(order.status === 'pending' || order.status === 'accepted') && (
              <button 
                onClick={() => cancelOrder(order.id)}
                style={{ width: '100%', padding: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >Cancel Order</button>
            )}
            {order.status === 'delivered' && (
              <button 
                onClick={() => returnOrder(order.id)}
                style={{ width: '100%', padding: '10px', background: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >Return Order</button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CustomerOrders;
