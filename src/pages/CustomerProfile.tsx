interface ProfileProps {
  userName?: string;
  userMobile?: string;
  onShowOrders?: () => void;
}

const CustomerProfile = ({ userName, userMobile, onShowOrders }: ProfileProps) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>👤 My Profile</h2>
      
      {/* ✅ Ab actual user data dikhega */}
      {userMobile ? (
        <p style={{ color: '#111111', fontWeight: 'bold', fontSize: '18px' }}>
          {userName || 'User'}
          <br />
          <span style={{ fontSize: '14px', color: '#6b7280' }}>+91 {userMobile}</span>
        </p>
      ) : (
        <p style={{ color: '#6b7280' }}>Aap Guest User hain.</p>
      )}
      
      <button 
        onClick={onShowOrders} 
        style={{ width: '100%', padding: '15px', background: '#111111', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}
      >
        📦 My Orders
      </button>
    </div>
  );
};

export default CustomerProfile;
