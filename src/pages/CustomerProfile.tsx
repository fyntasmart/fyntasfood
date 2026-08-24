interface ProfileProps {
  onShowOrders?: () => void;
}

const CustomerProfile = ({ onShowOrders }: ProfileProps) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>👤 My Profile</h2>
      <p style={{ color: '#666' }}>Aap Guest User hain.</p>
      
      <button 
        onClick={onShowOrders} 
        style={{ 
          width: '100%', padding: '15px', background: '#1e40af', color: '#fff', 
          border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', 
          cursor: 'pointer', marginTop: '20px' 
        }}
      >
        📦 My Orders
      </button>
    </div>
  );
};

export default CustomerProfile;
