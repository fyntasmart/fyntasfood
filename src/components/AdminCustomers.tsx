import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface AdminCustomersProps {
  customers: any[];
  refreshData: () => void;
}

const AdminCustomers = ({ customers, refreshData }: AdminCustomersProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Menu band karne ke liye outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const wrappers = document.querySelectorAll('.menu-wrapper');
      let isInside = false;
      wrappers.forEach((wrapper) => {
        if (wrapper.contains(target)) isInside = true;
      });
      if (!isInside) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Logic
  const filteredCustomers = customers.filter(customer => {
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? customer.is_active : !customer.is_active);
    const matchesSearch = customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          customer.mobile?.includes(searchQuery) || 
                          customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Stats
  const totalCustomers = customers.length;
  const verifiedCustomers = customers.filter(c => c.is_active || c.phone_verified_at).length;
  const unverifiedCustomers = totalCustomers - verifiedCustomers;

  const toggleActive = async (customer: any) => {
    await supabase.from('customers').update({ is_active: !customer.is_active }).eq('id', customer.id);
    setOpenMenuId(null);
    refreshData();
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('Kya aap is customer ko delete karna chahte hain?')) return;
    await supabase.from('customers').delete().eq('id', id);
    setOpenMenuId(null);
    refreshData();
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8f9fa', minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#111111', fontSize: '28px', fontWeight: '800' }}>Customers</h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>Manage your customer base and view their order history</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Total Customers</span>
            <span style={{ fontSize: '20px' }}>👥</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#111111', marginTop: '10px' }}>{totalCustomers}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>All registered users</div>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Verified Customers</span>
            <span style={{ fontSize: '20px' }}>✅</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', marginTop: '10px' }}>{verifiedCustomers}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Phone verified accounts</div>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Unverified Customers</span>
            <span style={{ fontSize: '20px' }}>❌</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#ef4444', marginTop: '10px' }}>{unverifiedCustomers}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Pending verification</div>
        </div>
      </div>

      {/* Table Panel */}
      <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}>
        {/* Controls */}
        <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, color: '#111111', fontWeight: '700' }}>Customers</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search by name, email, phone..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ padding: '10px 15px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', width: '280px' }} 
            />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              style={{ padding: '10px 15px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>ID</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Phone</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Joined</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No customers found</td></tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fa')} onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}>
                    <td style={{ padding: '15px', color: '#6b7280' }}>#{customer.id}</td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '600', color: '#111111' }}>{customer.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{customer.email || 'No email'}</div>
                    </td>
                    <td style={{ padding: '15px', color: '#6b7280' }}>+91 {customer.mobile || 'N/A'}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ background: customer.is_active ? '#d1fae5' : '#fee2e2', color: customer.is_active ? '#065f46' : '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '15px', color: '#6b7280', fontSize: '13px' }}>{new Date(customer.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '15px' }}>
                      <div className="menu-wrapper">
                        <button className="dots-btn" onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === customer.id ? null : customer.id); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>⋮</button>
                        <div className={`dots-menu ${openMenuId === customer.id ? 'show' : ''}`} style={{ position: 'absolute', right: '0', top: '30px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: '180px', zIndex: 20, overflow: 'hidden' }}>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setOpenMenuId(null); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: '#111111' }}>👁️ View Details</button>
                          <button onClick={(e) => { e.stopPropagation(); toggleActive(customer); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: '#d97706' }}>{customer.is_active ? '🚫 Deactivate' : '✅ Activate'}</button>
                          <button className="danger" onClick={(e) => { e.stopPropagation(); deleteCustomer(customer.id); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: '#dc2626', borderTop: '1px solid #f3f4f6' }}>🗑️ Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="modal-scrim show" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Customer Details</h3>
              <div className="modal-close" onClick={() => setSelectedCustomer(null)}>✕</div>
            </div>
            <div className="modal-body">
              <div className="detail-row"><span className="dl">ID</span><span className="dv">#{selectedCustomer.id}</span></div>
              <div className="detail-row"><span className="dl">Name</span><span className="dv">{selectedCustomer.name}</span></div>
              <div className="detail-row"><span className="dl">Phone</span><span className="dv">+91 {selectedCustomer.mobile}</span></div>
              <div className="detail-row"><span className="dl">Email</span><span className="dv">{selectedCustomer.email || 'N/A'}</span></div>
              <div className="detail-row"><span className="dl">Status</span><span className="dv">{selectedCustomer.is_active ? 'Active' : 'Inactive'}</span></div>
              <div className="detail-row"><span className="dl">Joined</span><span className="dv">{new Date(selectedCustomer.created_at).toLocaleDateString()}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
