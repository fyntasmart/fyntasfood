import { useEffect, useState } from 'react';

// Props interface
interface AdminOrdersProps {
  orders: any[];
  deliveryBoys: any[];
  assignDeliveryBoy: (orderId: string, boyId: string) => void;
  handleStatusChange: (orderId: string, status: string) => void;
  deleteOrder: (orderId: string) => void;
  printReceipt: (orderId: string, format: string) => void;
}

const AdminOrders = ({ orders, deliveryBoys, assignDeliveryBoy, handleStatusChange, deleteOrder, printReceipt }: AdminOrdersProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const [selectedOrderForView, setSelectedOrderForView] = useState<any>(null);
  const [openOrderMenuId, setOpenOrderMenuId] = useState<string | null>(null);

  // Menu band karne ke liye outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const wrappers = document.querySelectorAll('.menu-wrapper');
      let isInside = false;
      wrappers.forEach((wrapper) => {
        if (wrapper.contains(target)) isInside = true;
      });
      if (!isInside) setOpenOrderMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || order.customer_mobile.includes(searchQuery) || order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const statusOptions = [
    { value: 'pending', label: 'NEW' },
    { value: 'accepted', label: 'CONFIRMED' },
    { value: 'processing', label: 'PROCESSING' },
    { value: 'out_for_delivery', label: 'OUT_FOR_DELIVERY' },
    { value: 'delivered', label: 'DELIVERED' },
    { value: 'completed', label: 'COMPLETED' },
    { value: 'cancelled', label: 'CANCELLED' },
    { value: 'returned', label: 'RETURNED' },
  ];

  // Stats Cards Data
  const stats = [
    { label: 'Total Orders', value: orders.length, color: '#111111' },
    { label: 'New', value: orders.filter(o => o.status === 'pending').length, color: '#3b82f6' },
    { label: 'Confirmed', value: orders.filter(o => o.status === 'accepted').length, color: '#8b5cf6' },
    { label: 'Processing', value: orders.filter(o => o.status === 'processing').length, color: '#f59e0b' },
    { label: 'Out for Delivery', value: orders.filter(o => o.status === 'out_for_delivery').length, color: '#ec4899' },
    { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: '#10b981' },
    { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: '#10b981' },
    { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, color: '#ef4444' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8f9fa', minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#111111', fontSize: '28px', fontWeight: '800' }}>Orders</h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>Manage customer orders and track their status</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{stat.label}</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: stat.color }}></span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color, marginTop: '10px' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table Panel */}
      <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}>
        {/* Controls */}
        <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, color: '#111111', fontWeight: '700' }}>All Orders</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search orders..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ padding: '10px 15px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', width: '220px' }} 
            />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              style={{ padding: '10px 15px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
            >
              <option value="all">All Status</option>
              {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>ID</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Order No</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Delivery Address</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Payment</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No orders found</td></tr>
              ) : (
                currentOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fa')} onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}>
                    <td style={{ padding: '15px', color: '#6b7280', fontSize: '14px' }}>#{order.id.slice(0, 4)}</td>
                    <td style={{ padding: '15px', fontWeight: '600', color: '#111111' }}>ORD{order.id.slice(0, 6).toUpperCase()}</td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '600', color: '#111111' }}>{order.customer_name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{order.customer_mobile}</div>
                    </td>
                    <td style={{ padding: '15px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280' }}>{order.address}</td>
                    <td style={{ padding: '15px', fontWeight: '700', color: '#111111' }}>₹{order.total_amount}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                        {order.payment_method === 'upi' ? 'UPI' : 'COD'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <select 
                        value={order.status} 
                        onChange={(e) => handleStatusChange(order.id, e.target.value)} 
                        style={{ 
                          padding: '6px 10px', 
                          borderRadius: '6px', 
                          border: '1px solid #e5e7eb', 
                          fontSize: '12px', 
                          fontWeight: '600', 
                          cursor: 'pointer',
                          background: order.status === 'completed' ? '#d1fae5' : order.status === 'cancelled' ? '#fee2e2' : '#ffffff',
                          color: order.status === 'completed' ? '#065f46' : order.status === 'cancelled' ? '#991b1b' : '#111111'
                        }}
                      >
                        {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '15px', color: '#6b7280', fontSize: '13px' }}>{new Date(order.created_at).toLocaleString()}</td>
                    <td style={{ padding: '15px' }}>
                      <div className="menu-wrapper">
                        <button className="dots-btn" onClick={(e) => { e.stopPropagation(); setOpenOrderMenuId(openOrderMenuId === order.id ? null : order.id); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>⋮</button>
                        <div className={`dots-menu ${openOrderMenuId === order.id ? 'show' : ''}`} style={{ position: 'absolute', right: '0', top: '30px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: '180px', zIndex: 20, overflow: 'hidden' }}>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedOrderForView(order); setOpenOrderMenuId(null); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: '#111111' }}>👁️ View Details</button>
                          <div style={{ borderTop: '1px solid #f3f4f6', padding: '5px 0' }}>
                            <div style={{ padding: '0 14px', fontSize: '11px', color: '#6b7280' }}>Print Receipt</div>
                            <button onClick={(e) => { e.stopPropagation(); printReceipt(order.id, 'a4'); setOpenOrderMenuId(null); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: '#111111' }}>🖨️ Normal (A4)</button>
                            <button onClick={(e) => { e.stopPropagation(); printReceipt(order.id, 'thermal-80'); setOpenOrderMenuId(null); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: '#111111' }}>🖨️ Thermal 80mm</button>
                            <button onClick={(e) => { e.stopPropagation(); printReceipt(order.id, 'thermal-58'); setOpenOrderMenuId(null); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: '#111111' }}>🖨️ Thermal 58mm</button>
                          </div>
                          <div style={{ borderTop: '1px solid #f3f4f6' }}>
                            <select value={order.delivery_boy_id || ''} onChange={(e) => { e.stopPropagation(); assignDeliveryBoy(order.id, e.target.value); setOpenOrderMenuId(null); }} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: '#111111' }}>
                              <option value="">🛵 Assign Boy</option>
                              {deliveryBoys.filter(b => b.is_active).map(boy => <option key={boy.id} value={boy.id}>{boy.name}</option>)}
                            </select>
                          </div>
                          <button className="danger" onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); setOpenOrderMenuId(null); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: '#dc2626', borderTop: '1px solid #f3f4f6' }}>🗑️ Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center', borderTop: '1px solid #f3f4f6' }}>
          <button 
            className="btn btn-black" 
            style={{ padding: '8px 16px', borderRadius: '8px', background: '#111111', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: '13px' }} 
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} 
            disabled={currentPage <= 1}
          >
            Previous
          </button>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Page {currentPage} of {Math.ceil(filteredOrders.length / ordersPerPage)}</span>
          <button 
            className="btn btn-black" 
            style={{ padding: '8px 16px', borderRadius: '8px', background: '#111111', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: '13px' }} 
            onClick={() => currentPage < Math.ceil(filteredOrders.length / ordersPerPage) && setCurrentPage(currentPage + 1)} 
            disabled={currentPage >= Math.ceil(filteredOrders.length / ordersPerPage)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderForView && (
        <div className="modal-scrim show" onClick={() => setSelectedOrderForView(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Order Details</h3>
              <div className="modal-close" onClick={() => setSelectedOrderForView(null)}>✕</div>
            </div>
            <div className="modal-body">
              <div className="detail-row"><span className="dl">Order ID</span><span className="dv">ORD{selectedOrderForView.id.slice(0, 6).toUpperCase()}</span></div>
              <div className="detail-row"><span className="dl">Customer</span><span className="dv">{selectedOrderForView.customer_name}</span></div>
              <div className="detail-row"><span className="dl">Mobile</span><span className="dv">{selectedOrderForView.customer_mobile}</span></div>
              <div className="detail-row"><span className="dl">Address</span><span className="dv">{selectedOrderForView.address}</span></div>
              <div className="detail-row"><span className="dl">Delivery Charge</span><span className="dv">₹{selectedOrderForView.delivery_charge}</span></div>
              <div className="detail-row"><span className="dl">Total</span><span className="dv" style={{ fontWeight: 'bold', color: '#059669' }}>₹{selectedOrderForView.total_amount}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
