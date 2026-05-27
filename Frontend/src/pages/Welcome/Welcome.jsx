import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Users, ArrowRight, UserPlus } from 'lucide-react';
import './Welcome.css';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-page-container">
      <div className="welcome-background">
        <div className="welcome-blob blob-1"></div>
        <div className="welcome-blob blob-2"></div>
      </div>
      
      <div className="welcome-content">
        <div className="welcome-card">
          <div className="welcome-icon-container">
            <Shield size={80} className="shield-icon" strokeWidth={1.5} />
          </div>
          
          <h1 className="welcome-title">Welcome Back!</h1>
          <p className="welcome-subtitle">Sign in to your account</p>
          
          <div className="welcome-features">
            <div className="feature-item">
              <Lock size={20} className="feature-icon" /> 
              <span>Secure Authentication</span>
            </div>
            <div className="feature-item">
              <Users size={20} className="feature-icon" /> 
              <span>Role Based Access</span>
            </div>
          </div>

          <div className="welcome-actions">
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/login')}
            >
              <span>Sign In</span>
              <ArrowRight size={20} />
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/signup')}
            >
              <span>Sign Up</span>
              <UserPlus size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
