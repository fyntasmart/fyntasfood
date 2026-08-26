const AdminPolicies = ({ onGoToContent }: { onGoToContent: () => void }) => {
  return (
    <div className="panel">
      <h3>Policies</h3>
      <p>Yahan aap Privacy Policy, Terms & Conditions, aur Refund Policy ka text edit karke "App Content" tab mein save kar sakte hain.</p>
      <button className="btn btn-black" onClick={onGoToContent}>Go to App Content</button>
    </div>
  );
};

export default AdminPolicies;
