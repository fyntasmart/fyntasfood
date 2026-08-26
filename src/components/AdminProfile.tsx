const AdminProfile = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <div className="panel">
      <h3>My Profile</h3>
      <p>Mobile: 9984389923</p>
      <p>Role: Admin</p>
      <button className="btn btn-red" onClick={onLogout}>Logout</button>
    </div>
  );
};

export default AdminProfile;
