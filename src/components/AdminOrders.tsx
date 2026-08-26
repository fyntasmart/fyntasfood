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

  return (
    <div className="panel">
      <div className="table-controls">
        <h3 style={{ margin: 0 }}>All Orders</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ maxWidth: '200px' }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: '150px' }}>
            <option value="all">All Status</option>
            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      <table className="order-table">
        <thead>
          <tr>
            <th>ID</th><th>Order No</th><th>Customer</th><th>Address</th>
            <th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentOrders.length === 0 ? (
            <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>No orders found</td></tr>
          ) : (
            currentOrders.map(order => (
              <tr key={order.id}>
                <td>#{order.id.slice(0, 4)}</td>
                <td style={{ fontWeight: '600' }}>ORD{order.id.slice(0, 6).toUpperCase()}</td>
                <td>{order.customer_name}<br /><span style={{ fontSize: '11px', color: '#6b7280' }}>{order.customer_mobile}</span></td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.address}</td>
                <td style={{ fontWeight: '700' }}>₹{order.total_amount}</td>
                <td>{order.payment_method === 'upi' ? 'UPI' : 'COD'}</td>
                <td>
                  <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td>
                  <div className="menu-wrapper">
                    <button className="dots-btn" onClick={(e) => { e.stopPropagation(); setOpenOrderMenuId(openOrderMenuId === order.id ? null : order.id); }}>⋮</button>
                    <div className={`dots-menu ${openOrderMenuId === order.id ? 'show' : ''}`}>
                      {/* View Details */}
                      <button onClick={(e) => { e.stopPropagation(); setSelectedOrderForView(order); setOpenOrderMenuId(null); }}>👁️ View Details</button>
                      {/* Print Options */}
                      <div style={{ borderTop: '1px solid #f3f4f6', padding: '5px 0' }}>
                        <div style={{ padding: '0 14px', fontSize: '11px', color: '#6b7280' }}>Print Receipt</div>
                        <button onClick={(e) => { e.stopPropagation(); printReceipt(order.id, 'a4'); setOpenOrderMenuId(null); }}>🖨️ Normal (A4)</button>
                        <button onClick={(e) => { e.stopPropagation(); printReceipt(order.id, 'thermal-80'); setOpenOrderMenuId(null); }}>🖨️ Thermal 80mm</button>
                        <button onClick={(e) => { e.stopPropagation(); printReceipt(order.id, 'thermal-58'); setOpenOrderMenuId(null); }}>🖨️ Thermal 58mm</button>
                      </div>
                      {/* Assign Boy */}
                      <div style={{ borderTop: '1px solid #f3f4f6' }}>
                        <select value={order.delivery_boy_id || ''} onChange={(e) => { e.stopPropagation(); assignDeliveryBoy(order.id, e.target.value); setOpenOrderMenuId(null); }} style={{ padding: '8px 14px', width: '100%', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: '#111111' }}>
                          <option value="">🛵 Assign Boy</option>
                          {deliveryBoys.filter(b => b.is_active).map(boy => <option key={boy.id} value={boy.id}>{boy.name}</option>)}
                        </select>
                      </div>
                      {/* Delete */}
                      <button className="danger" onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); setOpenOrderMenuId(null); }}>🗑️ Delete</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
        <button className="btn btn-black" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={currentPage <= 1}>Previous</button>
        <span style={{ fontSize: '13px' }}>Page {currentPage} of {Math.ceil(filteredOrders.length / ordersPerPage)}</span>
        <button className="btn btn-black" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => currentPage < Math.ceil(filteredOrders.length / ordersPerPage) && setCurrentPage(currentPage + 1)} disabled={currentPage >= Math.ceil(filteredOrders.length / ordersPerPage)}>Next</button>
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
