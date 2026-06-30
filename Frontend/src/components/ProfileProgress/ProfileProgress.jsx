import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import './ProfileProgress.css';

/**
 * ProfileProgress Component
 * Displays a visual indicator of profile completion and lists missing fields.
 */
const ProfileProgress = ({ score, missingFields }) => {
  const isComplete = score === 100;

  // Calculate circular stroke dash offset
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="profile-progress-container">
      <div className="progress-header">
        <h3>Profile Readiness</h3>
      </div>
      
      <div className="progress-body">
        <div className="progress-chart">
          <svg className="circular-chart" viewBox="0 0 100 100">
            <path
              className="circle-bg"
              d="M50 10
                 a 40 40 0 0 1 0 80
                 a 40 40 0 0 1 0 -80"
            />
            <path
              className={`circle ${score < 50 ? 'danger' : score < 80 ? 'warning' : 'success'}`}
              strokeDasharray={`${circumference}, ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              d="M50 10
                 a 40 40 0 0 1 0 80
                 a 40 40 0 0 1 0 -80"
            />
            <text x="50" y="50" className="percentage-text" dominantBaseline="central" textAnchor="middle">
              {score}%
            </text>
          </svg>
        </div>

        <div className="progress-details">
          {isComplete ? (
            <div className="status-complete">
              <CheckCircle2 size={24} color="var(--color-success)" />
              <p>Your profile is 100% complete! Awesome job.</p>
            </div>
          ) : (
            <div className="status-incomplete">
              <p className="recommendation">
                Complete your profile to improve account readiness.
              </p>
              <div className="missing-fields">
                <h4>Missing Information:</h4>
                <ul>
                  {missingFields.map((field, idx) => (
                    <li key={idx}>
                      <AlertCircle size={14} className="alert-icon" /> {field}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileProgress;
