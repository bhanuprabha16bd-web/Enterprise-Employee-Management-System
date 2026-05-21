import { useNavigate, Link } from 'react-router-dom';
import { CircleUserRound, Mail, Lock, Eye } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/app');
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
              <input type="email" id="email" placeholder="Enter your email" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" color="#94A3B8" />
              <input type="password" id="password" placeholder="Enter your password" />
              <button type="button" className="password-toggle">
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

          <button type="submit" className="login-btn">Login</button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <a href="#" className="contact-admin">Contact Admin</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
