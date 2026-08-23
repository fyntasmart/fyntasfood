import { useState, useRef, useEffect } from 'react';
// ✅ Path fix kiya: '../supabaseClient' (Bahut important!)
import { supabase } from '../supabaseClient';

interface OtpProps {
  mobile: string;
  onSuccess: () => void;
  onBack?: () => void;
}

const OtpVerification = ({ mobile, onSuccess, onBack }: OtpProps) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const [isArranged, setIsArranged] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, '').slice(0, 1);
    setOtp(newOtp);
    setError('');

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit !== '')) {
      verifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (code: string) => {
    setIsVerifying(true);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-otp', {
        body: { mobile, code }
      });

      if (fnError) {
        setError(fnError.message || 'Verification error');
        setOtp(['', '', '', '']);
        inputsRef.current[0]?.focus();
        return;
      }

      if (data?.status === 'success') {
        setIsArranged(true);
        setIsSpinning(true);
        
        setTimeout(() => {
          setIsSuccess(true);
        }, 2000);

        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        setError(data?.message || 'Galat OTP! Dobara try karo.');
        setOtp(['', '', '', '']);
        inputsRef.current[0]?.focus();
      }
    } catch (e) {
      setError('Server error. Try again.');
      setOtp(['', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: '"Helvetica Neue", Arial, sans-serif', background: '#020203', color: '#f7f3e8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        :root{--bg:#050507;--text:#f7f3e8;--muted:#8f8a7c;--gold:#d9ad52;--gold2:#f6d98a;--teal:#53e6d3}
        .phone{width:390px;min-height:740px;background:radial-gradient(100% 80% at 50% 0%,#171711 0%,#0a0a0d 42%,#050507 100%);border:1px solid rgba(246,217,138,.38);border-radius:38px;padding:25px 24px;position:relative;overflow:hidden;box-shadow:0 35px 100px rgba(0,0,0,.8),0 0 55px rgba(218,174,82,.08);display:flex;flex-direction:column}
        .status{display:flex;justify-content:space-between;font-size:12px;color:#8f8a7c;margin-bottom:18px}
        .brand-top{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:18px}
        .brand-top:before,.brand-top:after{content:"";height:1px;width:58px;background:linear-gradient(90deg,transparent,var(--gold))}
        .brand-top:after{background:linear-gradient(90deg,var(--gold),transparent)}
        .brand-top span{font-size:15px;letter-spacing:3px;font-weight:800;color:var(--gold2);white-space:nowrap;text-shadow:0 0 18px rgba(246,217,138,.25)}
        h1{text-align:center;font-size:25px;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase}h1 b{color:var(--teal)}
        .subtitle{text-align:center;font-size:15px;font-weight:600;margin-bottom:7px}
        .stage{position:relative;height:300px;margin-top:20px;flex:none}
        .otp-row{display:flex;gap:10px;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);transition:all 1s cubic-bezier(.6,.05,.25,1)}
        .box{width:62px;height:70px;border-radius:16px;border:1px solid rgba(246,217,138,.28);background:linear-gradient(145deg,#18181d,#0b0b0f);display:flex;align-items:center;justify-content:center;font-size:25px;font-weight:700;position:relative;transition:all 1s cubic-bezier(.6,.05,.25,1);box-shadow:inset 0 1px rgba(255,255,255,.04),0 12px 30px rgba(0,0,0,.25)}
        .box input{width:100%;height:100%;background:transparent;border:0;outline:0;color:#fff;font-size:25px;font-weight:700;text-align:center;caret-color:var(--teal)}
        .otp-row.arranged{position:absolute;left:0;top:0;width:100%;height:100%;gap:0;transform:none}
        .otp-row.arranged .box{position:absolute;transform:translate(-50%,-50%)}
        .otp-row.arranged .box:nth-child(1){left:34%;top:32%;}
        .otp-row.arranged .box:nth-child(2){left:66%;top:32%;}
        .otp-row.arranged .box:nth-child(3){left:66%;top:68%;}
        .otp-row.arranged .box:nth-child(4){left:34%;top:68%;}
        .otp-row.arranged .box{box-shadow:0 0 26px rgba(83,230,211,.35);border-color:var(--teal)}
        .box.dimmed input{opacity:.12}
        .spin-wrap.spinning{animation:spinConverge 1.9s cubic-bezier(.5,0,.4,1) forwards;transform-origin:50% 50%}
        @keyframes spinConverge{0%{transform:rotate(0) scale(1)}65%{transform:rotate(620deg) scale(1)}100%{transform:rotate(680deg) scale(.05);opacity:0}}
        .success{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .5s;text-align:center;padding:0 30px}
        .success.show{opacity:1}
        .check{width:78px;height:78px;border-radius:50%;border:1px solid var(--teal);display:flex;align-items:center;justify-content:center;margin-bottom:18px;box-shadow:0 0 42px rgba(83,230,211,.28);transform:scale(.6);opacity:0;transition:.45s}
        .success.show .check{transform:scale(1);opacity:1}
        .check svg{width:31px;height:31px}.check path{fill:none;stroke:var(--teal);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:40;stroke-dashoffset:40}
        .success.show .check path{animation:draw .5s ease .35s forwards}
        @keyframes draw{to{stroke-dashoffset:0}}
        .success h2{font-size:20px;letter-spacing:1px;margin:0 0 12px}
        .error-text{color:#ff6575;font-size:13px;font-weight:600;text-align:center;margin-top:15px}
      `}</style>

      <div className="phone">
        <div className="status"><span>9:41</span><span>●●●  ◉  66%</span></div>
        <div className="brand-top"><span>FYNTAS</span></div>
        <h1><b>OTP</b> VERIFICATION</h1>
        <div className="subtitle">Verify your number</div>
        <div style={{textAlign: 'center', fontSize: '12px', color: '#8f8a7c', marginBottom: '5px'}}>Enter the 4-digit code sent to <b style={{color: '#f6d98a'}}>{mobile}</b></div>

        <div className="stage">
          <div className={`spin-wrap ${isSpinning ? 'spinning' : ''}`}>
            <div className={`otp-row ${isArranged ? 'arranged' : ''}`}>
              {otp.map((digit, index) => (
                <div className={`box ${digit ? 'filled' : ''} ${isArranged ? 'dimmed' : ''}`} key={index}>
                  <input 
                    ref={(el) => { inputsRef.current[index] = el; }}
                    type="text" 
                    maxLength={1} 
                    value={digit} 
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    inputMode="numeric"
                    disabled={isVerifying}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={`success ${isSuccess ? 'show' : ''}`}>
            <div className="check"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg></div>
            <h2>Verified successfully</h2>
            <div style={{color: '#9affef', fontSize: '12px'}}>Logging in securely...</div>
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}

        <button 
          onClick={onBack} 
          style={{marginTop: 'auto', background: 'none', border: 'none', color: '#666256', fontSize: '11px', cursor: 'pointer', textAlign: 'center', width: '100%'}}
        >Change number</button>
      </div>
    </div>
  );
};

export default OtpVerification;
