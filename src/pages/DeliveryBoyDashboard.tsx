import { useState } from 'react';
import { supabase } from '../supabaseClient';

const DeliveryBoyDashboard = () => {
  // ---------- States ----------
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [boyId, setBoyId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, orders, earnings, profile
  
  // Bottom Sheet State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // ---------- OTP Login Logic ----------
  const sendOtp = async () => {
    if (mobile.length !== 10) return setError('Sahi 10-digit mobile number daalo!');
    setLoading(true); setError('');
    const { data, error } = await supabase.functions.invoke('send-otp', { body: { mobile } });
    if (error) setError('OTP error: ' + (data?.error || error.message));
    else { setStep(2); alert('OTP bhej diya gaya hai!'); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true); setError('');
    const { data, error } = await supabase.functions.invoke('verify-otp', { body: { mobile, code: otp } });
    if (error || !data?.success) {
      setError('Galat OTP!');
    } else if (data.role !== 'delivery_boy') {
      setError('Yeh number Delivery Boy ke liye register nahi hai!');
    } else {
      const { data: boyData } = await supabase.from('delivery_boys').select('*').eq('mobile', mobile).single();
      if (boyData) {
        setBoyId(boyData.id);
        setIsLoggedIn(true);
        fetchOrders(boyData.id);
      }
    }
    setLoading(false);
  };

  // ---------- Fetch Orders ----------
  const fetchOrders = async (id: string) => {
    const { data } = await supabase.from('orders').select('*').eq('delivery_boy_id', id).order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    if (boyId) fetchOrders(boyId);
    setSelectedOrder(null);
    alert('Status Updated!');
  };

  // ---------- CSS (Colors exactly same as reference) ----------
  const styles = `
    :root{
      --green-900:#0b2e22; --green-800:#0f3d2c; --green-700:#155e3e; --green-600:#1a7a4c;
      --green-500:#22a35f; --green-400:#34c777; --green-100:#e7f6ec;
      --orange:#f59e0b; --blue:#3b82f6;
      --ink:#14251d; --sub:#6b7c74; --line:#e7ede9;
      --card:#ffffff; --bg:#f4f8f5;
    }
    .db-wrap { font-family:'Inter',sans-serif; color:var(--ink); background:#eef1ee; min-height:100vh; display:flex; justify-content:center; }
    .db-phone { width:100%; max-width:430px; background:var(--bg); height:100vh; position:relative; overflow-y:auto; box-shadow:0 0 20px rgba(0,0,0,0.1); }
    .db-header { background:linear-gradient(160deg, var(--green-700), var(--green-900) 75%); padding:16px 18px 46px; color:#fff; }
    .db-hdr-top { display:flex; align-items:center; gap:11px; margin-bottom:20px; }
    .db-logo { width:46px;height:46px;border-radius:50%; border:2px solid rgba(255,255,255,.5); display:flex; align-items:center; justify-content:center; font-size:20px; background:rgba(255,255,255,.08); }
    .db-brand .n { font-size:19px; font-weight:800; line-height:1; }
    .db-brand .s { font-size:10px; font-weight:700; letter-spacing:3px; color:var(--green-400); }
    .db-bell { margin-left:auto; font-size:22px; }
    .db-profile { display:flex; align-items:center; gap:14px; }
    .db-avatar { width:70px;height:70px;border-radius:50%; background:#fdf1e0; display:flex; align-items:center; justify-content:center; font-size:34px; border:3px solid rgba(255,255,255,.7); }
    .db-prof-name { font-size:19px; font-weight:700; }
    .db-prof-sub { font-size:12.5px; color:#dff5e6; margin-top:4px; }
    .db-status { margin-left:auto; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.35); border-radius:20px; padding:8px 14px; font-size:12.5px; font-weight:700; color:#fff; display:flex; align-items:center; gap:7px; }
    .db-dot { width:8px;height:8px;border-radius:50%; background:var(--green-400); }
    
    .db-body { padding:0 16px 100px; margin-top:-30px; }
    .db-card { background:var(--card); border-radius:18px; padding:16px; box-shadow:0 12px 30px -14px rgba(20,60,40,.18); margin-bottom:16px; }
    .db-card-title { font-size:15px; font-weight:700; margin-bottom:14px; }
    .db-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; text-align:center; }
    .db-stat-val { font-family:'Poppins',sans-serif; font-size:19px; font-weight:700; }
    .db-stat-lbl { font-size:10px; color:var(--sub); margin-top:3px; }
    .db-stat-divider { border-left:1px solid var(--line); }

    .db-order-card { background:var(--green-100); border-radius:16px; padding:16px; margin-bottom:16px; }
    .db-o-title { color:var(--green-700); font-size:14.5px; font-weight:700; margin-bottom:12px; }
    .db-o-id { font-size:16px; font-weight:800; color:var(--green-700); margin-bottom:10px; }
    .db-o-row { font-size:12.5px; color:#3a4c43; margin-bottom:9px; }
    .db-o-amount { font-size:19px; font-weight:800; }
    .db-btn { background:linear-gradient(135deg, var(--green-500), var(--green-700)); color:#fff; border:none; border-radius:12px; padding:13px; width:100%; font-size:14px; font-weight:700; cursor:pointer; margin-top:10px; }
    .db-btn:active { transform:scale(.98); }

    .db-tabbar { position:absolute; bottom:0; left:0; right:0; background:#fff; border-top:1px solid var(--line); display:flex; padding:10px 6px; }
    .db-tab { flex:1; text-align:center; font-size:11px; font-weight:700; color:#9aa79f; cursor:pointer; }
    .db-tab.active { color:var(--green-600); }
    .db-tab-ic { font-size:20px; margin-bottom:4px; }

    .sheet-overlay { position:absolute; inset:0; background:rgba(10,25,18,.55); display:flex; align-items:flex-end; z-index:70; }
    .sheet { width:100%; background:#fff; border-radius:22px 22px 0 0; padding:20px; }
    .sheet-close { float:right; cursor:pointer; font-size:18px; color:var(--sub); }
    .sheet-btn-row { display:flex; gap:10px; margin-top:16px; }
    .sf-accept { flex:1; background:linear-gradient(135deg, var(--green-500), var(--green-700)); color:#fff; border:none; border-radius:12px; padding:12px; font-weight:700; cursor:pointer; }
    .sf-decline { flex:1; background:#fdecec; color:#dc2626; border:none; border-radius:12px; padding:12px; font-weight:700; cursor:pointer; }

    .login-wrap { max-width:400px; margin:50px auto; text-align:center; padding:20px; background:#fff; border-radius:16px; }
    .login-input { width:100%; padding:12px; margin-bottom:10px; border:1px solid var(--line); border-radius:8px; }
    .login-btn { width:100%; padding:15px; background:var(--green-600); color:#fff; border:none; border-radius:8px; font-weight:700; cursor:pointer; }
  `;

  // ---------- Render Login ----------
  if (!isLoggedIn) {
    return (
      <div style={{ background: '#0b2e22', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <style>{styles}</style>
        <div className="login-wrap">
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛵</div>
          <h2 style={{ color: 'var(--green-700)' }}>Delivery Boy Login</h2>
          {step === 1 ? (
            <>
              <p style={{ color: 'var(--sub)' }}>Registered mobile number daalo</p>
              <input className="login-input" type="text" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              {error && <p style={{ color: 'red' }}>{error}</p>}
              <button className="login-btn" onClick={sendOtp} disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
            </>
          ) : (
            <>
              <p style={{ color: 'var(--sub)' }}>OTP daalo</p>
              <input className="login-input" type="text" placeholder="4-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} />
              {error && <p style={{ color: 'red' }}>{error}</p>}
              <button className="login-btn" onClick={verifyOtp} disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--sub)', marginTop: '10px', cursor: 'pointer' }}>Change Number</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------- Render Main App ----------
  const newOrders = orders.filter(o => o.status === 'pending' || o.status === 'accepted');
  const inProgress = orders.filter(o => o.status === 'out_for_delivery');
  const completed = orders.filter(o => o.status === 'delivered');
  const totalEarnings = completed.length * 50; // Mock earning per order

  return (
    <div className="db-wrap">
      <style>{styles}</style>
      <div className="db-phone">
        
        {/* Header */}
        <div className="db-header">
          <div className="db-hdr-top">
            <div className="db-logo">🛵</div>
            <div className="db-brand">
              <div className="n">FYNTAS</div>
              <div className="s">DELIVERY BOY</div>
            </div>
            <div className="db-bell">🔔</div>
          </div>
          <div className="db-profile">
            <div className="db-avatar">🧑‍✈️</div>
            <div style={{ flex: 1 }}>
              <div className="db-prof-name">{mobile}</div>
              <div className="db-prof-sub">Online • Delivering Happiness</div>
            </div>
            <div className="db-status"><div className="db-dot"></div>Online</div>
          </div>
        </div>

        {/* Body Content */}
        <div className="db-body">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              <div className="db-card">
                <div className="db-card-title">Today's Overview</div>
                <div className="db-stat-grid">
                  <div><div style={{ fontSize: '20px' }}>📋</div><div className="db-stat-val">{orders.length}</div><div className="db-stat-lbl">Total Orders</div></div>
                  <div className="db-stat-divider"><div style={{ fontSize: '20px' }}>✅</div><div className="db-stat-val">{completed.length}</div><div className="db-stat-lbl">Completed</div></div>
                  <div className="db-stat-divider"><div style={{ fontSize: '20px' }}>🛵</div><div className="db-stat-val">{inProgress.length}</div><div className="db-stat-lbl">In Progress</div></div>
                  <div className="db-stat-divider"><div style={{ fontSize: '20px' }}>💰</div><div className="db-stat-val">₹{totalEarnings}</div><div className="db-stat-lbl">Earnings</div></div>
                </div>
              </div>

              <div className="db-order-card">
                <div className="db-o-title">Current Order</div>
                {inProgress.length > 0 ? (
                  <>
                    <div className="db-o-id">{inProgress[0].id.slice(0, 8)}</div>
                    <div className="db-o-row">📍 {inProgress[0].address}</div>
                    <div className="db-o-row">👤 {inProgress[0].customer_name}</div>
                    <div className="db-o-row">💰 <span className="db-o-amount">₹{inProgress[0].total_amount}</span></div>
                    <button className="db-btn" onClick={() => updateStatus(inProgress[0].id, 'delivered')}>Mark as Delivered</button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--sub)', padding: '20px 0' }}>No active delivery right now</div>
                )}
              </div>

              <div className="db-card">
                <div className="db-card-title">New Orders</div>
                {newOrders.length === 0 ? <p style={{ color: 'var(--sub)', fontSize: '13px' }}>No new orders yet.</p> : (
                  newOrders.map(o => (
                    <div key={o.id} onClick={() => setSelectedOrder(o)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
                      <div style={{ fontSize: '20px' }}>📦</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--green-700)' }}>{o.id.slice(0, 8)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--sub)' }}>{o.address}</div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--green-600)', background: 'var(--green-100)', padding: '2px 9px', borderRadius: '20px' }}>New</span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="db-card">
              <div className="db-card-title">All Orders</div>
              {orders.length === 0 ? <p style={{ color: 'var(--sub)' }}>Koi order nahi hai.</p> : (
                orders.map(o => (
                  <div key={o.id} onClick={() => setSelectedOrder(o)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
                    <div style={{ fontSize: '20px' }}>{o.status === 'delivered' ? '✅' : '📦'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--green-700)' }}>{o.id.slice(0, 8)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--sub)' }}>{o.address}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700' }}>₹{o.total_amount}</div>
                      <div style={{ fontSize: '10px', color: 'var(--green-600)' }}>{o.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div className="db-card">
              <div className="db-card-title">My Earnings</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', marginBottom: '15px' }}>
                <div><div style={{ fontSize: '22px' }}>👛</div><div className="db-stat-val">₹{totalEarnings}</div><div className="db-stat-lbl">Total</div></div>
                <div><div style={{ fontSize: '22px' }}>📶</div><div className="db-stat-val">{completed.length}</div><div className="db-stat-lbl">Orders</div></div>
                <div><div style={{ fontSize: '22px' }}>🏅</div><div className="db-stat-val">4.8</div><div className="db-stat-lbl">Rating</div></div>
              </div>
              <div className="db-card-title" style={{ marginTop: '20px' }}>Recent Payouts</div>
              {completed.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '20px' }}>💵</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700' }}>{o.id.slice(0, 8)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--sub)' }}>{o.customer_name}</div>
                  </div>
                  <div style={{ fontWeight: '800', color: 'var(--green-600)' }}>+₹{o.total_amount}</div>
                </div>
              ))}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="db-card">
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div className="db-avatar" style={{ margin: '0 auto 12px' }}>🧑‍✈️</div>
                <div style={{ fontSize: '18px', fontWeight: '800' }}>Delivery Boy</div>
                <div style={{ fontSize: '12.5px', color: 'var(--sub)' }}>+91 {mobile}</div>
                <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '1px solid var(--line)', paddingTop: '15px' }}>
                  <div><div style={{ fontWeight: '800', color: 'var(--green-700)' }}>{completed.length}</div><div style={{ fontSize: '10px', color: 'var(--sub)' }}>Deliveries</div></div>
                  <div><div style={{ fontWeight: '800', color: 'var(--green-700)' }}>96%</div><div style={{ fontSize: '10px', color: 'var(--sub)' }}>On-time</div></div>
                  <div><div style={{ fontWeight: '800', color: 'var(--green-700)' }}>8 mo</div><div style={{ fontSize: '10px', color: 'var(--sub)' }}>With FYNTAS</div></div>
                </div>
              </div>
              <button onClick={() => { setIsLoggedIn(false); setBoyId(null); setOrders([]); }} style={{ width: '100%', background: '#fdecec', color: '#dc2626', border: 'none', borderRadius: '13px', padding: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '20px' }}>⏻ Logout</button>
            </div>
          )}
        </div>

        {/* Bottom Tabbar */}
        <div className="db-tabbar">
          <div className={`db-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><div className="db-tab-ic">🏠</div>Dashboard</div>
          <div className={`db-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}><div className="db-tab-ic">📦</div>Orders</div>
          <div className={`db-tab ${activeTab === 'earnings' ? 'active' : ''}`} onClick={() => setActiveTab('earnings')}><div className="db-tab-ic">💰</div>Earnings</div>
          <div className={`db-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><div className="db-tab-ic">👤</div>Profile</div>
        </div>

        {/* Order Detail Bottom Sheet */}
        {selectedOrder && (
          <div className="sheet-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-close" onClick={() => setSelectedOrder(null)}>✕</div>
              <h3 style={{ color: 'var(--green-700)', margin: '0 0 10px' }}>Order #{selectedOrder.id.slice(0, 6)}</h3>
              <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Address:</strong> {selectedOrder.address}</p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Customer:</strong> {selectedOrder.customer_name}</p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Amount:</strong> ₹{selectedOrder.total_amount}</p>
              
              <div className="sheet-btn-row">
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'accepted') && (
                  <button className="sf-accept" onClick={() => updateStatus(selectedOrder.id, 'out_for_delivery')}>Start Delivery</button>
                )}
                {selectedOrder.status === 'out_for_delivery' && (
                  <button className="sf-accept" onClick={() => updateStatus(selectedOrder.id, 'delivered')}>Mark Delivered</button>
                )}
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'accepted') && (
                  <button className="sf-decline" onClick={() => setSelectedOrder(null)}>Close</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryBoyDashboard;
