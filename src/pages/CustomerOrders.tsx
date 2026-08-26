import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CustomerOrders = ({ savedMobile, isLoggedIn }: any) => {
  const [mobile, setMobile] = useState(savedMobile || '');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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
            <button 
              onClick={() => setSelectedOrder(order)}
              style={{ width: '100%', padding: '8px', background: 'none', border: 'none', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}
            >View Details</button>
          </div>
        );
      })}

      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedOrder(null)}>
          <div style={{ background: '#fff', borderRadius: '15px', padding: '20px', maxWidth: '350px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#111111' }}>Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#111111' }}>✕</button>
            </div>
            <div style={{ marginBottom: '10px' }}><span style={{ color: '#666' }}>Name: </span><b>{selectedOrder.customer_name}</b></div>
            <div style={{ marginBottom: '10px' }}><span style={{ color: '#666' }}>Address: </span><b>{selectedOrder.address}</b></div>
            <div style={{ marginBottom: '10px' }}><span style={{ color: '#666' }}>Delivery: </span><b>₹{selectedOrder.delivery_charge}</b></div>
            <div style={{ marginBottom: '10px' }}><span style={{ color: '#666' }}>Total: </span><b>₹{selectedOrder.total_amount}</b></div>
            <div><span style={{ color: '#666' }}>Status: </span><b>{selectedOrder.status}</b></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
