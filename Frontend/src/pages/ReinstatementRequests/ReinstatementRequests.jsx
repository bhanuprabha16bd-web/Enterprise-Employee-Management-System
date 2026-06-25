import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldAlert, Check, X as XIcon, Clock } from 'lucide-react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import './ReinstatementRequests.css';

/**
 * ReinstatementRequests Component
 * Admin view to list and manage reinstatement requests submitted by suspended users.
 */
const ReinstatementRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  /**
   * Fetches the list of reinstatement requests from the API.
   */
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/admin/reinstatement-requests');
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching reinstatement requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  /**
   * Handles approval or rejection of a specific reinstatement request.
   * @param {number} id - The ID of the request.
   * @param {string} status - The new status ('Approved' or 'Rejected').
   */
  const handleAction = async (id, status) => {
    try {
      await api.put(`/users/admin/reinstatement-requests/${id}`, { status });
      toast.success(`Request ${status.toLowerCase()} successfully`);
      addNotification(`Reinstatement request ${status.toLowerCase()}`);
      fetchRequests();
    } catch (error) {
      console.error(`Error updating request to ${status}:`, error);
      toast.error('Failed to update request');
    }
  };

  return (
    <div className="reinstatement-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reinstatement Requests</h1>
          <p className="page-subtitle">Review requests from suspended users</p>
        </div>
      </div>

      <div className="requests-content">
        {loading ? (
          <div className="loading-state">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <ShieldAlert size={48} color="var(--color-text-secondary)" />
            <h3>No Pending Requests</h3>
            <p>There are currently no reinstatement requests to review.</p>
          </div>
        ) : (
          <div className="requests-grid">
            {requests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="user-info">
                    <h4>{request.user_name}</h4>
                    <span className="user-email">{request.user_email}</span>
                  </div>
                  <div className="status-badge pending">
                    <Clock size={14} /> Pending
                  </div>
                </div>
                
                <div className="request-body">
                  <div className="reason-label">Reason for Request:</div>
                  <p className="reason-text">{request.reason || 'No reason provided.'}</p>
                  <div className="request-date">
                    Submitted: {new Date(request.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="request-actions">
                  <button 
                    className="btn-outline-primary reject-btn"
                    onClick={() => handleAction(request.id, 'Rejected')}
                  >
                    <XIcon size={16} /> Reject
                  </button>
                  <button 
                    className="btn-primary approve-btn"
                    onClick={() => handleAction(request.id, 'Approved')}
                  >
                    <Check size={16} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReinstatementRequests;
