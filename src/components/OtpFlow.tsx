import { useState, useRef } from 'react'; // ✅ useEffect hata diya
import { supabase } from '../supabaseClient';

interface OtpFlowProps {
  theme: 'black' | 'green';
  requiresName?: boolean;
  onLogin: (user: { mobile: string; name?: string }) => void;
}

export default function OtpFlow({ theme, requiresName, onLogin }: OtpFlowProps) {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const isGreen = theme === 'green';
  const styles = {
    container: {
      background: isGreen ? '#0b2e22' : '#ffffff',
      color: isGreen ? '#ffffff' : '#111111',
      padding: '20px',
      borderRadius: '15px',
      maxWidth: '380px',
      margin: '0 auto',
      textAlign: 'center' as const,
      fontFamily: 'Inter, sans-serif',
    },
    input: {
      width: '100%',
      padding: '12px',
      marginBottom: '15px',
      borderRadius: '8px',
      border: isGreen ? '1px solid #34c777' : '1px solid #111',
      background: isGreen ? '#0f3d2c' : '#fff',
      color: 'inherit',
      fontSize: '16px',
    },
    otpBox: {
      width: '55px',
      height: '60px',
      border: isGreen ? '2px solid #34c777' : '2px solid #111',
      background: isGreen ? '#0f3d2c' : '#fff',
      color: 'inherit',
      fontSize: '24px',
      fontWeight: 'bold',
      textAlign: 'center' as const,
      borderRadius: '10px',
      outline: 'none',
    },
    btn: {
      width: '100%',
      padding: '14px',
      background: isGreen ? '#22a35f' : '#111111',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
    }
  };

  const sendOtp = async () => {
    if (mobile.length !== 10) return setError('Sahi 10-digit number daalo!');
    setLoading(true); setError('');
    
    const { error } = await supabase.functions.invoke('send-otp', { body: { mobile } });
    
    if (error) setError('OTP error: ' + error.message);
    else {
      setStep(2);
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 4) return setError('4 digit OTP daalo!');
    setLoading(true); setError('');

    const { data, error } = await supabase.functions.invoke('verify-otp', { body: { mobile, code } });
    
    if (error || !data?.success) {
      setError('Galat OTP! Dobara try karo.');
      setOtp(['', '', '', '']);
      inputsRef.current[0]?.focus();
    } else {
      setIsSuccess(true);
      setTimeout(() => {
        if (requiresName && data.role === 'customer') {
          setStep(3);
          setIsSuccess(false); // Name step ke liye success animation hatao
        } else {
          onLogin({ mobile });
        }
      }, 1500);
    }
    setLoading(false);
  };

  const submitName = () => {
    if (!name.trim()) return setError('Naam dalna zaroori hai!');
    onLogin({ mobile, name });
  };

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, '').slice(0, 1);
    setOtp(newOtp);
    if (value && index < 3) inputsRef.current[index + 1]?.focus();
    if (newOtp.every(d => d !== '')) verifyOtp();
  };

  return (
    <div style={styles.container}>
      {step === 1 && !isSuccess && (
        <>
          <h3 style={{ marginBottom: '10px' }}>Login / Verify</h3>
          <input type="text" style={styles.input} placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          {error && <p style={{ color: isGreen ? '#fca5a5' : 'red', margin: '0 0 10px', fontSize: '13px' }}>{error}</p>}
          <button style={styles.btn} onClick={sendOtp} disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </>
      )}

      {step === 2 && !isSuccess && (
        <>
          <h3 style={{ marginBottom: '5px' }}>Enter OTP</h3>
          <p style={{ fontSize: '14px', marginBottom: '15px', opacity: 0.8 }}>Mobile: {mobile}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputsRef.current[index] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                style={styles.otpBox}
              />
            ))}
          </div>
          {error && <p style={{ color: isGreen ? '#fca5a5' : 'red', margin: '0 0 10px', fontSize: '13px' }}>{error}</p>}
          <button style={styles.btn} onClick={verifyOtp} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <p style={{ fontSize: '12px', marginTop: '10px', cursor: 'pointer', opacity: 0.8 }} onClick={() => { setStep(1); setOtp(['', '', '', '']); }}>Change Number</p>
        </>
      )}

      {step === 3 && !isSuccess && (
        <>
          <h3 style={{ marginBottom: '5px' }}>Aapka Naam?</h3>
          <p style={{ fontSize: '14px', marginBottom: '15px', opacity: 0.8 }}>Naam dalna zaroori hai</p>
          <input type="text" style={styles.input} placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          {error && <p style={{ color: isGreen ? '#fca5a5' : 'red', margin: '0 0 10px', fontSize: '13px' }}>{error}</p>}
          <button style={styles.btn} onClick={submitName}>Continue</button>
        </>
      )}

      {isSuccess && (
        <div style={{ padding: '40px 10px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #34c777', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>✅</div>
          <h3>Verified successfully!</h3>
        </div>
      )}
    </div>
  );
}
