import { useState } from 'react'
import { supabase } from './supabaseClient'

const Login = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true) // Default Checked

  const sendOtp = async () => {
    setLoading(true)
    setError('')

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

    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: mobile })
    
    if (otpError) {
      setError('OTP bhejne mein error aaya.')
    } else {
      setStep(2)
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.verifyOtp({ phone: mobile, token: otp, type: 'sms' })

    if (error) {
      setError('Galat OTP! Dobara try karo.')
    } else {
      // Save login state based on checkbox
      if (rememberMe) {
        // Persistent storage (tab tak rahega jab tak logout nahi karenge)
        localStorage.setItem('admin_remember', 'true')
      } else {
        // Session storage (Browser band hote hi clear ho jayega)
        sessionStorage.setItem('admin_remember', 'true')
      }
      onLogin({ mobile })
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ddd', borderRadius: '10px' }}>
      {step === 1 ? (
        <>
          <h2>Admin / Delivery Login</h2>
          <input type="text" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          {/* Remember Me Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer' }}>
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <span style={{ marginLeft: '5px' }}>Save login (Jab tak logout nahi karenge)</span>
          </label>

          <button onClick={sendOtp} disabled={loading} style={{ width: '100%', padding: '10px', background: '#4f46e5', color: 'white', border: 'none' }}>
            {loading ? 'Checking...' : 'Get OTP'}
          </button>
        </>
      ) : (
        <>
          <h2>Enter OTP</h2>
          <input type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button onClick={verifyOtp} disabled={loading} style={{ width: '100%', padding: '10px', background: '#4f46e5', color: 'white', border: 'none' }}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </>
      )}
    </div>
  )
}
export default Login
