import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/**
 * AccountDeactivated Component
 * Renders a page for users whose accounts have been deactivated.
 * Allows them to view their status and submit reactivation requests.
 */
const AccountDeactivated = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the user's past reactivation requests from the server.
   */
  const fetchRequests = async () => {
    try {
      const response = await api.get('/users/reactivation-requests');
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to fetch reactivation requests', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  /**
   * Handles the logout process and redirects to the login page.
   */
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  /**
   * Submits a new reactivation request to the server.
   * @param {Event} event - The form submission event.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users/reactivation-requests', { reason });
      toast.success('Reactivation request submitted');
      setReason('');
      await fetchRequests();
    } catch (error) {
      console.error('Reactivation request failed', error);
      toast.error('Could not submit your request right now');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)', color: '#e5eefb' }}>
      <div style={{ maxWidth: '720px', width: '100%', display: 'grid', gap: '18px' }}>
        <section style={{ borderRadius: '24px', padding: '28px', background: 'rgba(15, 23, 42, 0.92)', border: '1px solid rgba(148, 163, 184, 0.18)', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.45)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <ShieldAlert size={28} color="#f59e0b" />
            <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Account Deactivated</h1>
          </div>
          <p style={{ lineHeight: 1.6, color: '#cbd5e1', marginBottom: '8px' }}>
            Your account has been deactivated by an administrator, but you can still sign in and submit a reactivation request.
          </p>
          <p style={{ lineHeight: 1.6, color: '#cbd5e1', marginBottom: '12px' }}>
            Current status: <strong style={{ color: '#f8fafc' }}>{user?.status || 'Inactive'}</strong>
          </p>
          <button
            type="button"
            onClick={handleLogout}
            style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #38bdf8', background: '#0ea5e9', color: '#082f49', fontWeight: 700, cursor: 'pointer' }}
          >
            Back to login
          </button>
        </section>

        <section style={{ borderRadius: '24px', padding: '28px', background: 'rgba(15, 23, 42, 0.92)', border: '1px solid rgba(148, 163, 184, 0.18)', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.45)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.15rem' }}>Reactivation Request</h2>
          <p style={{ color: '#cbd5e1', marginTop: 0, marginBottom: '14px' }}>Explain why you need access restored and submit the request for review.</p>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
            <label htmlFor="reactivation-reason" style={{ color: '#e5eefb', fontWeight: 600 }}>Reason</label>
            <textarea
              id="reactivation-reason"
              rows="4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="I need my account reactivated because..."
              style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(15, 23, 42, 0.88)', color: '#f8fafc', padding: '0.9rem 1rem' }}
            />
            <button type="submit" disabled={submitting} style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #38bdf8', background: '#0ea5e9', color: '#082f49', fontWeight: 700, cursor: 'pointer' }}>
              <Send size={16} /> {submitting ? 'Submitting...' : 'Submit reactivation request'}
            </button>
          </form>
        </section>

        <section style={{ borderRadius: '24px', padding: '28px', background: 'rgba(15, 23, 42, 0.92)', border: '1px solid rgba(148, 163, 184, 0.18)', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.45)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.15rem' }}>Request Status</h2>
          <p style={{ color: '#cbd5e1', marginTop: 0, marginBottom: '14px' }}>Track the status of your reactivation request here.</p>
          {loading ? (
            <div style={{ color: '#cbd5e1' }}>Loading requests...</div>
          ) : requests.length === 0 ? (
            <div style={{ color: '#cbd5e1', background: 'rgba(15, 23, 42, 0.76)', borderRadius: '14px', padding: '12px 14px', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
              No reactivation requests found yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {requests.map((request) => (
                <article key={request.id} style={{ borderRadius: '14px', border: '1px solid rgba(148, 163, 184, 0.18)', background: 'rgba(15, 23, 42, 0.88)', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#f8fafc' }}>{request.status}</strong>
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

export default AccountDeactivated;
