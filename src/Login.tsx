import { useState, useRef, useEffect } from 'react'
import { supabase } from './supabaseClient'

interface LoginProps {
  onLogin: (user: any) => void
}

const Login = ({ onLogin }: LoginProps) => {
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)

  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  // OTP inputs focus management
  useEffect(() => {
    if (step === 2) {
      inputsRef.current[0]?.focus()
    }
  }, [step])

  // Check if user is already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_remember') === 'true' || sessionStorage.getItem('admin_remember') === 'true'
    if (isLoggedIn) {
      onLogin({ mobile: 'saved' })
    }
  }, [])

  const sendOtp = async () => {
    setLoading(true)
    setError('')

    // Check if mobile is registered
    const { data: user, error: dbError } = await supabase
      .from('registered_users')
      .select('*')
      .eq('mobile', mobile)
      .single()

    if (dbError || !user) {
      setError('Yeh mobile number registered nahi hai!')
      setLoading(false)
      return
    }

    // Call Edge Function send-otp
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      }
    )

    const result = await response.json()
    if (result.success) {
      setStep(2)
    } else {
      setError(result.error || 'OTP send nahi hua. Try again!')
    }
    setLoading(false)
  }

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp]
    newOtp[index] = value.replace(/[^0-9]/g, '').slice(0, 1)
    setOtp(newOtp)

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus()
    }

    if (newOtp.every((digit) => digit !== '')) {
      verifyOtp(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const verifyOtp = async (code: string) => {
    setLoading(true)
    setError('')
    setIsSuccess(false)

    // Call Edge Function verify-otp
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-otp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, code })
      }
    )

    const result = await response.json()
    if (result.success) {
      // Save login state
      if (rememberMe) {
        localStorage.setItem('admin_remember', 'true')
      } else {
        sessionStorage.setItem('admin_remember', 'true')
      }
      setIsSuccess(true)
      setTimeout(() => {
        onLogin({ mobile })
      }, 1000)
    } else {
      setError(result.message || 'Galat OTP! Dobara try karo.')
      setOtp(['', '', '', ''])
      inputsRef.current[0]?.focus()
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      {step === 1 ? (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#4f46e5', marginBottom: '10px' }}>FYNTAS Login</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Apna registered mobile number daalein</p>
          
          <input 
            type="text" 
            placeholder="Mobile Number" 
            value={mobile} 
            onChange={(e) => setMobile(e.target.value)} 
            style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }} 
          />
          
          {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}
          
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer', justifyContent: 'center', fontSize: '14px' }}>
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <span style={{ marginLeft: '5px' }}>Save login (Jab tak logout nahi karenge)</span>
          </label>

          <button 
            onClick={sendOtp} 
            disabled={loading} 
            style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Sending OTP...' : 'Get OTP'}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#4f46e5', marginBottom: '10px' }}>OTP Verification</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            Enter the 4-digit code sent to <b>{mobile}</b>
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                inputMode="numeric"
                style={{
                  width: '50px',
                  height: '50px',
                  textAlign: 'center',
                  fontSize: '24px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  outline: 'none'
                }}
              />
            ))}
          </div>
          
          {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
          {isSuccess && <p style={{ color: 'green', fontSize: '16px', fontWeight: 'bold' }}>Verified successfully! Logging in...</p>}
          
          <button 
            onClick={() => setStep(1)} 
            style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px' }}
          >
            Change number
          </button>
        </div>
      )}
    </div>
  )
}

export default Login
