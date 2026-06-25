import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/**
 * AccountSuspended Component
 * Renders a page for users whose accounts have been suspended.
 * Displays suspension details and allows them to submit reinstatement requests.
 */
const AccountSuspended = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState([]);
  const [suspensionDetails, setSuspensionDetails] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches reinstatement requests and suspension details concurrently.
   */
  const fetchData = async () => {
    try {
      const [requestsRes, detailsRes] = await Promise.all([
        api.get('/users/reinstatement-requests'),
        api.get('/users/me/suspension-details')
      ]);
      setRequests(requestsRes.data || []);
      setSuspensionDetails(detailsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Handles the logout process and redirects to the login page.
   */
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  /**
   * Submits a new reinstatement request to the server.
   * @param {Event} event - The form submission event.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users/reinstatement-requests', { reason });
      toast.success('Reinstatement request submitted');
      setReason('');
      await fetchData();
    } catch (error) {
      console.error('Reinstatement request failed', error);
      toast.error('Could not submit your request right now');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)', color: '#e5eefb' }}>
      <div style={{ maxWidth: '720px', width: '100%', display: 'grid', gap: '18px' }}>
        <section style={{ borderRadius: '24px', padding: '28px', background: 'rgba(15, 23, 42, 0.92)', border: '1px solid rgba(220, 38, 38, 0.3)', boxShadow: '0 18px 40px rgba(220, 38, 38, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <ShieldAlert size={28} color="#ef4444" />
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#fca5a5' }}>Account Suspended</h1>
          </div>
          <p style={{ lineHeight: 1.6, color: '#cbd5e1', marginBottom: '16px' }}>
            Your account has been suspended. Access to application modules is blocked. You can submit a reinstatement request below.
          </p>
          
          {suspensionDetails && (
            <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ margin: '0 0 8px', color: '#cbd5e1' }}>
                <strong>Status:</strong> {suspensionDetails.status}
              </p>
              <p style={{ margin: '0 0 8px', color: '#cbd5e1' }}>
                <strong>Date:</strong> {suspensionDetails.suspended_at ? new Date(suspensionDetails.suspended_at).toLocaleString() : 'Not recorded'}
              </p>
              <p style={{ margin: '0 0 8px', color: '#cbd5e1' }}>
                <strong>Reason:</strong> {suspensionDetails.suspension_reason || 'No reason provided'}
              </p>
              <p style={{ margin: '0 0 8px', color: '#cbd5e1' }}>
                <strong>Suspended By:</strong> {suspensionDetails.suspended_by_name} ({suspensionDetails.suspended_by_email})
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}
          >
            Sign out
          </button>
        </section>

        <section style={{ borderRadius: '24px', padding: '28px', background: 'rgba(15, 23, 42, 0.92)', border: '1px solid rgba(148, 163, 184, 0.18)', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.45)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.15rem' }}>Reinstatement Request</h2>
          <p style={{ color: '#cbd5e1', marginTop: 0, marginBottom: '14px' }}>Submit a request to have your account access restored.</p>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
            <label htmlFor="reinstatement-reason" style={{ color: '#e5eefb', fontWeight: 600 }}>Reason / Comments</label>
            <textarea
              id="reinstatement-reason"
              rows="4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="I have resolved the issue because..."
              style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(15, 23, 42, 0.88)', color: '#f8fafc', padding: '0.9rem 1rem' }}
            />
            <button type="submit" disabled={submitting} style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #38bdf8', background: '#0ea5e9', color: '#082f49', fontWeight: 700, cursor: 'pointer' }}>
              <Send size={16} /> {submitting ? 'Submitting...' : 'Submit reinstatement request'}
            </button>
          </form>
        </section>

        <section style={{ borderRadius: '24px', padding: '28px', background: 'rgba(15, 23, 42, 0.92)', border: '1px solid rgba(148, 163, 184, 0.18)', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.45)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.15rem' }}>Request Status</h2>
          <p style={{ color: '#cbd5e1', marginTop: 0, marginBottom: '14px' }}>Track the status of your reinstatement requests here.</p>
          {loading ? (
            <div style={{ color: '#cbd5e1' }}>Loading requests...</div>
          ) : requests.length === 0 ? (
            <div style={{ color: '#cbd5e1', background: 'rgba(15, 23, 42, 0.76)', borderRadius: '14px', padding: '12px 14px', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
              No reinstatement requests found yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {requests.map((request) => (
                <article key={request.id} style={{ borderRadius: '14px', border: '1px solid rgba(148, 163, 184, 0.18)', background: 'rgba(15, 23, 42, 0.88)', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong style={{ color: request.status === 'Approved' ? '#22c55e' : request.status === 'Rejected' ? '#ef4444' : '#eab308' }}>
                      {request.status}
                    </strong>
                    <span style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>{new Date(request.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ color: '#e2e8f0', margin: '8px 0 0' }}>{request.reason || 'No details provided.'}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AccountSuspended;
