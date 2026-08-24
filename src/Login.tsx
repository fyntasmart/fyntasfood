import OtpFlow from './components/OtpFlow';

interface LoginProps { onLogin: (user: any) => void; }

const Login = ({ onLogin }: LoginProps) => {
  return (
    <div style={{ padding: '40px 20px', background: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <OtpFlow 
        theme="black" 
        requiresName={false} // Admin ke liye name nahi chahiye
        onLogin={(user) => {
          localStorage.setItem('admin_remember', 'true');
          onLogin({ mobile: user.mobile });
        }} 
      />
    </div>
  );
};

export default Login;
