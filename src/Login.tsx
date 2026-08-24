import { useState } from 'react';
import { supabase } from './supabaseClient';

interface LoginProps { onLogin: (user: any) => void; }

const Login = ({ onLogin }: LoginProps) => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (mobile.length !== 10) return setError('Sahi 10-digit mobile number daalo!');
    setLoading(true); setError('');
    
    const { error } = await supabase.functions.invoke('send-otp', { body: { mobile } });
    if (error) setError('OTP send nahi hua!');
    else { setStep(2); alert('OTP bhej diya gaya hai!'); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true); setError('');
    const { data, error } = await supabase.functions.invoke('verify-otp', { body: { mobile, code: otp } });

    if (error || !data?.success) {
      setError('Galat OTP! Dobara try karo.');
    } else if (data.role !== 'admin') {
      // 🔥 Yahan role check ho raha hai
      setError('Yeh mobile number Admin ke liye registered nahi hai!');
    } else {
      localStorage.setItem('admin_remember', 'true');
      onLogin({ mobile });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      {step === 1 ? (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#4f46e5' }}>Admin Login</h2>
          <input type="text" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '8px' }} />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button onClick={sendOtp} disabled={loading} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>{loading ? 'Sending...' : 'Send OTP'}</button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#4f46e5' }}>Enter OTP</h2>
          <input type="text" placeholder="4-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center', fontSize: '20px' }} />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button onClick={verifyOtp} disabled={loading} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#666', marginTop: '10px', cursor: 'pointer' }}>Change Number</button>
        </div>
      )}
    </div>
  );
};

export default Login;
