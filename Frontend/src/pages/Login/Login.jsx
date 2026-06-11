import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState('User');
  const [companyName, setCompanyName] = useState('');
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const [isInvite, setIsInvite] = useState(false);
  const [hasCheckedToken, setHasCheckedToken] = useState(false);

  useEffect(() => {
    if (location.pathname === '/signup' || token) {
      setIsLoginMode(false);
    }
    
    if (token && !hasCheckedToken) {
      const verifyToken = async () => {
        try {
          const invite = await userService.verifyInvitation(token);
          setEmail(invite.email);
          setRole(invite.role);
          setIsInvite(true);
        } catch (error) {
          toast.error('Invalid or expired invitation link');
        } finally {
          setHasCheckedToken(true);
        }
      };
      verifyToken();
    } else if (!token) {
      setHasCheckedToken(true);
    }
  }, [location.pathname, token, hasCheckedToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (isLoginMode) {
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
        login(data.access_token, {
          email: payload.sub,
          role: payload.role,
          name: payload.name,
          status: payload.status ?? 'Active',
          company_id: payload.company_id ?? null,
        });
        toast.success('Logged in successfully!');
        navigate(payload.status === 'Inactive' ? '/deactivated' : '/app');
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
    } else {
      try {
        const response = await fetch('http://localhost:8000/users/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name, role, company_name: companyName }),
        });

        if (response.ok) {
          toast.success('Account created successfully! Please login.');
          setIsLoginMode(true);
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.detail || 'Signup failed');
        }
      } catch (error) {
        console.error(error);
        toast.error('An error occurred during signup');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-right-panel">
        <div className="login-card">
          <div className="login-header">
            <h2>{isLoginMode ? 'Login' : 'Sign Up'}</h2>
            <p>{isLoginMode ? 'Enter your credentials to access your account' : 'Create a new account'}</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {!isLoginMode && (
              <>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      id="name" 
                      placeholder="John Doe" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <div className="input-wrapper">
                    <select 
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                      disabled={isInvite}
                      style={{ width: '100%', padding: '0.75rem', border: 'none', background: 'transparent', outline: 'none', color: 'inherit', font: 'inherit', opacity: isInvite ? 0.7 : 1 }}
                    >
                      <option value="User" style={{ color: '#000' }}>User</option>
                      <option value="Admin" style={{ color: '#000' }}>Admin</option>
                      </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="companyName">Company Name</label>
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      id="companyName" 
                      placeholder="Company Inc, Corp, or Global Tech" 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)} 
                    />
                  </div>
                  <small style={{ color: '#94a3b8', marginTop: '6px', display: 'block' }}>
                    Optional. Leave blank to use Company Inc, or enter Corp / Global Tech.
                  </small>
                </div>
              </>
            )}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  id="email" 
                  placeholder="email@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={isInvite && !isLoginMode}
                  style={{ opacity: isInvite && !isLoginMode ? 0.7 : 1 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="password" 
                  placeholder="Enter your password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
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
              <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? (isLoginMode ? 'Logging in...' : 'Signing up...') : (isLoginMode ? 'Login' : 'Sign Up')}
            </button>
          </form>

          <div className="login-footer">
            <p>
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                className="signup-link" 
                onClick={() => setIsLoginMode(!isLoginMode)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
              >
                {isLoginMode ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
