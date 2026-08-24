import { useState } from 'react';
import { supabase } from '../supabaseClient';

const DeliveryBoyDashboard = () => {
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const sendOtp = async () => {
    if (mobile.length !== 10) return setError('Sahi 10-digit mobile number daalo!');
    setLoading(true); setError('');
    const { error } = await supabase.functions.invoke('send-otp', { body: { mobile } });
    if (error) setError('OTP send nahi hua!');
    else setStep(2);
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true); setError('');
    const { data, error } = await supabase.functions.invoke('verify-otp', { body: { mobile, code: otp } });

    if (error || !data?.success) {
      setError('Galat OTP! Dobara try karo.');
    } else if (data.role !== 'delivery_boy') {
      setError('Yeh mobile number Delivery Boy ke liye registered nahi hai!');
    } else {
      setIsLoggedIn(true);
    }
    setLoading(false);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center', padding: '20px' }}>
        <h2 style={{ color: '#111827' }}>Delivery Boy Login</h2>
        {step === 1 ? (
          <>
            <p style={{ color: '#666' }}>Registered mobile number daalo</p>
            <input type="text" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button onClick={sendOtp} disabled={loading} style={{ width: '100%', padding: '15px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>{loading ? 'Sending...' : 'Send OTP'}</button>
          </>
        ) : (
          <>
            <p style={{ color: '#666' }}>OTP daalo</p>
            <input type="text" placeholder="4-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', textAlign: 'center', fontSize: '20px' }} />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button onClick={verifyOtp} disabled={loading} style={{ width: '100%', padding: '15px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#666', marginTop: '10px', cursor: 'pointer' }}>Change Number</button>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f4f6f8', minHeight: '100vh' }}>
      <h2>Delivery Boy Dashboard</h2>
      <p>Mobile: {mobile}</p>
      <button onClick={() => setIsLoggedIn(false)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', marginBottom: '20px' }}>Logout</button>
      <h3>Assigned Orders</h3>
      <p style={{ color: '#666' }}>Abhi koi order assign nahi hua.</p>
      {/* (Aage yahan Orders ka pura logic add hoga) */}
    </div>
  );
};

export default DeliveryBoyDashboard;
