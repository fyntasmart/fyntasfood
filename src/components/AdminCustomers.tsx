interface AdminCustomersProps {
  customers: any[];
  exportCustomers: () => void;
}

const AdminCustomers = ({ customers, exportCustomers }: AdminCustomersProps) => {
  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>All Customers ({customers.length})</h3>
        <button className="btn btn-black" onClick={exportCustomers}>Export Excel (CSV)</button>
      </div>
      <table>
        <thead><tr><th>Name</th><th>Mobile Number</th><th>Joined</th></tr></thead>
        <tbody>
          {customers.length === 0 ? <tr><td colSpan={3} style={{ textAlign: 'center' }}>Abhi koi customer nahi hai</td></tr> : (
            customers.map(c => <tr key={c.id}><td>{c.name || 'Unknown'}</td><td>{c.mobile}</td><td>{new Date(c.created_at).toLocaleDateString()}</td></tr>)
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminCustomers;
