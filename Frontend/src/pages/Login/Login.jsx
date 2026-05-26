import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleUserRound, Mail, Lock, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('http://localhost:8000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));
        login(data.access_token, { email: payload.sub, role: payload.role, name: payload.name });
        toast.success('Logged in successfully!');
        navigate('/app');
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Login failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <CircleUserRound size={32} color="var(--color-primary)" />
          </div>
          <h1>Welcome Back!</h1>
          <p>Login to your account</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" color="#94A3B8" />
              <input type="email" id="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" color="#94A3B8" />
              <input type={showPassword ? 'text' : 'password'} id="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                <Eye size={18} color="#94A3B8" />
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <a href="#" className="contact-admin">Contact Admin</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
