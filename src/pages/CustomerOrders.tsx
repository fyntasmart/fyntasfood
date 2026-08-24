import { useState } from 'react';
import { supabase } from '../supabaseClient';

const CustomerOrders = () => {
  const [mobile, setMobile] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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
      alert('Error fetching orders: ' + error.message);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#fee2e2', color: '#dc2626', label: 'Pending' };
      case 'accepted': return { bg: '#dbeafe', color: '#2563eb', label: 'Accepted' };
      case 'out_for_delivery': return { bg: '#fef3c7', color: '#d97706', label: 'Out for Delivery' };
      case 'delivered': return { bg: '#d1fae5', color: '#059669', label: 'Delivered' };
      default: return { bg: '#f3f4f6', color: '#111827', label: status };
    }
  };

  return (
    <div style={{ padding: '20px', background: '#ffffff', minHeight: '100vh' }}>
      <h2 style={{ color: '#111827', marginBottom: '20px' }}>My Orders</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Apna Mobile Number Daalo" 
          value={mobile} 
          onChange={(e) => setMobile(e.target.value)}
          style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }}
        />
        <button 
          onClick={fetchOrders} 
          style={{ padding: '12px 20px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          View Orders
        </button>
      </div>

      {loading && <p style={{ color: '#666' }}>Loading orders...</p>}
      
      {searched && !loading && orders.length === 0 && (
        <p style={{ color: '#666' }}>Koi order nahi mila is mobile number par.</p>
      )}

      {orders.map((order) => {
        const statusInfo = getStatusColor(order.status);
        return (
          <div key={order.id} onClick={() => setSelectedOrder(order)} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '15px', marginBottom: '15px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>Order #{order.id.slice(0, 6)}</p>
                <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>{new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}</p>
              </div>
              <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                {statusInfo.label}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Total Amount</span>
              <span style={{ fontWeight: 'bold', color: '#1e40af' }}>₹{order.total_amount}</span>
            </div>
          </div>
        );
      })}

      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedOrder(null)}>
          <div style={{ background: '#fff', borderRadius: '15px', padding: '20px', maxWidth: '350px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#111827' }}>Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#111827' }}>✕</button>
            </div>
            <div style={{ marginBottom: '10px' }}><span style={{ color: '#666' }}>Name: </span><span style={{ fontWeight: 'bold', color: '#111827' }}>{selectedOrder.customer_name}</span></div>
            <div style={{ marginBottom: '10px' }}><span style={{ color: '#666' }}>Address: </span><span style={{ fontWeight: 'bold', color: '#111827' }}>{selectedOrder.address}</span></div>
            <div style={{ marginBottom: '10px' }}><span style={{ color: '#666' }}>Delivery Charge: </span><span style={{ fontWeight: 'bold', color: '#111827' }}>₹{selectedOrder.delivery_charge}</span></div>
            <div style={{ marginBottom: '10px' }}><span style={{ color: '#666' }}>Total: </span><span style={{ fontWeight: 'bold', color: '#1e40af' }}>₹{selectedOrder.total_amount}</span></div>
            <div><span style={{ color: '#666' }}>Status: </span><span style={{ fontWeight: 'bold', color: '#059669' }}>{selectedOrder.status}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
