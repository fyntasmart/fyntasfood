import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { supabase } from './supabaseClient'

interface LoginProps {
  onLogin: (user: any) => void
}

const Login = ({ onLogin }: LoginProps) => {
  const [mobile, setMobile] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [step, setStep] = useState(1) // 1 = Mobile, 2 = OTP, 3 = Name
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)

  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (step === 2) inputsRef.current[0]?.focus()
  }, [step])

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_remember') === 'true' || sessionStorage.getItem('admin_remember') === 'true'
    if (isLoggedIn) onLogin({ mobile: 'saved', name: 'Saved User' })
  }, [])

  const sendOtp = async () => {
    setLoading(true); setError('')

    const { data: user, error: dbError } = await supabase
      .from('registered_users')
      .select('*')
      .eq('mobile', mobile)
      .maybeSingle()

    if (dbError || !user) {
      setError('Yeh mobile number registered nahi hai!'); setLoading(false); return
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      })
      const data = await res.json()
      
      if (data.status === 'success') {
        setStep(2)
      } else {
        setError(data.message || 'OTP send nahi hua.')
      }
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    }
    setLoading(false)
  }

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp]
    newOtp[index] = value.replace(/[^0-9]/g, '').slice(0, 1)
    setOtp(newOtp)
    if (value && index < 3) inputsRef.current[index + 1]?.focus()
    if (newOtp.every((digit) => digit !== '')) verifyOtp(newOtp.join(''))
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputsRef.current[index - 1]?.focus()
  }

  const verifyOtp = async (code: string) => {
    setLoading(true); setError(''); setIsSuccess(false)

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, code })
      })
      const data = await res.json()

      if (data.status === 'success') {
        // OTP sahi hai, ab Name poocho (Step 3)
        setOtp(['', '', '', ''])
        setStep(3) 
        // Name input focus karne ke liye
        setTimeout(() => {
          const nameInput = document.getElementById('name-input') as HTMLInputElement;
          if(nameInput) nameInput.focus();
        }, 100);
      } else {
        setError(data.message || 'Invalid OTP. Try again.')
        setOtp(['', '', '', ''])
        inputsRef.current[0]?.focus()
      }
    } catch (e) {
      setError('Verification error: ' + (e as Error).message)
    }
    setLoading(false)
  }

  const saveNameAndLogin = async () => {
    if (!name.trim()) {
      setError('Name dalna zaroori hai!'); return;
    }

    setLoading(true); setError('')

    // Naam ko Database mein save karo (registered_users table)
    const { error: updateError } = await supabase
      .from('registered_users')
      .update({ name: name.trim() })
      .eq('mobile', mobile)
      
    if(updateError) console.log('Name update error:', updateError)

    if (rememberMe) localStorage.setItem('admin_remember', 'true')
    else sessionStorage.setItem('admin_remember', 'true')

    setIsSuccess(true)
    setTimeout(() => onLogin({ mobile, name }), 1000)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      {/* STEP 1: Mobile */}
      {step === 1 && (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#4f46e5', marginBottom: '10px' }}>FYNTAS Login</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Apna registered mobile number daalein</p>
          <input type="text" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }} />
          {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer', justifyContent: 'center', fontSize: '14px' }}>
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <span style={{ marginLeft: '5px' }}>Save login (Jab tak logout nahi karenge)</span>
          </label>
          <button onClick={sendOtp} disabled={loading} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Sending OTP...' : 'Get OTP'}
          </button>
        </div>
      )}

      {/* STEP 2: OTP */}
      {step === 2 && (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#4f46e5', marginBottom: '10px' }}>OTP Verification</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Enter the 4-digit code sent to <b>{mobile}</b></p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            {otp.map((digit, index) => (
              <input key={index} ref={(el) => { inputsRef.current[index] = el; }} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleKeyDown(index, e)} inputMode="numeric" style={{ width: '50px', height: '50px', textAlign: 'center', fontSize: '24px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
            ))}
          </div>
          {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px' }}>
            Change number
          </button>
        </div>
      )}

      {/* STEP 3: Name (Must) */}
      {step === 3 && (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#4f46e5', marginBottom: '10px' }}>Aapka Naam Kya Hai?</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Profile ke liye Naam dalna zaroori hai</p>
          <input 
            id="name-input"
            type="text" 
            placeholder="Apna pura naam likhein" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }} 
          />
          {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}
          {isSuccess ? (
             <p style={{ color: 'green', fontSize: '16px', fontWeight: 'bold' }}>Verified successfully! Logging in...</p>
          ) : (
             <button onClick={saveNameAndLogin} disabled={loading} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Saving...' : 'Continue'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default Login
