const AdminDashboard = ({ orders, customers, products, deliveryBoys }: any) => {
  return (
    <div className="panel">
      <h3>Dashboard Overview</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
          <h2>{orders.length}</h2><p>Orders</p>
        </div>
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
          <h2>{customers.length}</h2><p>Customers</p>
        </div>
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
          <h2>{products.length}</h2><p>Products</p>
        </div>
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
          <h2>{deliveryBoys.length}</h2><p>Delivery Boys</p>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
