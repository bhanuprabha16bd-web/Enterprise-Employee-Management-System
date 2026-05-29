import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import './Login.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, new_password: newPassword }),
      });

      if (response.ok) {
        toast.success('Password reset successfully! Please login.');
        navigate('/login');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Password reset failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred during password reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-right-panel">
        <div className="login-card">
          <div className="login-header">
            <h2>Reset Password</h2>
            <p>Enter your email and a new password</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
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
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="newPassword" 
                  placeholder="Enter your new password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  <Eye size={18} color="#94A3B8" />
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Remember your password?{' '}
              <Link to="/login" className="signup-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
