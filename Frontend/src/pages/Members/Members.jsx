import { useState, useEffect, useMemo } from 'react';
import { Copy, Link2, Trash2, UserMinus, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import './Members.css';

const Members = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('User');
  const [createdInviteLink, setCreatedInviteLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const users = await userService.getUsers();
      setMembers(users);
    } catch (error) {
      console.error('Failed to fetch members', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const data = await userService.getInvitations();
      setInvitations(data);
    } catch (error) {
      console.error('Failed to fetch invitations', error);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'Admin') return;
    fetchMembers();
    fetchInvitations();
  }, [user]);

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'Active'),
    [members]
  );

  const pendingInvitations = useMemo(
    () => invitations.filter((invite) => invite.status === 'Pending'),
    [invitations]
  );

  const invitationLink = (token) => `${window.location.origin}/signup?token=${token}`;

  const handleCopyLink = async (token) => {
    try {
      await navigator.clipboard.writeText(invitationLink(token));
      toast.success('Invitation link copied');
    } catch (error) {
      toast.error('Copy failed');
    }
  };

  const handleCopyCreatedLink = async () => {
    if (!createdInviteLink) return;
    try {
      await navigator.clipboard.writeText(createdInviteLink);
      toast.success('Invitation link copied');
    } catch (error) {
      toast.error('Copy failed');
    }
  };

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Enter an email address');
      return;
    }
    setSubmitting(true);
    setCreatedInviteLink('');
    try {
      const invite = await userService.createInvitation({
        email: inviteEmail.trim(),
        role: inviteRole
      });
      setCreatedInviteLink(invitationLink(invite.token));
      toast.success('Invitation created successfully');
      setInviteEmail('');
      setInviteRole('User');
      fetchInvitations();
    } catch (error) {
      console.error('Invitation error', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (invitationId) => {
    try {
      await userService.revokeInvitation(invitationId);
      toast.success('Invitation revoked');
      fetchInvitations();
    } catch (error) {
      console.error('Revoke failed', error);
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      await userService.deactivateUser(userId);
      toast.success('User deactivated');
      fetchMembers();
    } catch (error) {
      console.error('Deactivate failed', error);
    }
  };

  return (
    <div className="members-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Invitations & Members</h1>
          <p className="page-subtitle">Manage company members, pending invites, and admin invitations from one place.</p>
        </div>
      </div>

      <div className="members-grid">
        <section className="panel invite-panel">
          <div className="panel-header">
            <div>
              <h2>Invite a Team Member</h2>
              <p>Send a new invitation link to add someone to your company.</p>
            </div>
            <div className="panel-badge">Admin</div>
          </div>

          <form className="invite-form" onSubmit={handleInviteSubmit}>
            <div className="invite-input-row">
              <div className="invite-field">
                <label>Email address</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="invite-field invite-role-field">
                <label>Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  required
                >
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" disabled={submitting}>
                <UserPlus size={16} /> {submitting ? 'Creating...' : 'Create Invite'}
              </button>
            </div>
          </form>

          {createdInviteLink && (
            <div className="generated-link-display">
              <div className="generated-link-label">
                <Link2 size={16} />
                <span>Generated invite link</span>
              </div>
              <input type="text" value={createdInviteLink} readOnly aria-label="Generated invite link" />
              <button type="button" className="icon-button" onClick={handleCopyCreatedLink}>
                <Copy size={16} /> Copy Link
              </button>
            </div>
          )}

          <div className="panel-stats">
            <div>
              <span className="stat-label">Active members</span>
              <strong>{loading ? '...' : activeMembers.length}</strong>
            </div>
            <div>
              <span className="stat-label">Pending invitations</span>
              <strong>{pendingInvitations.length}</strong>
            </div>
          </div>
        </section>

        <section className="panel members-panel">
          <h2>Active Members</h2>
          <p className="panel-subtitle">Review all active members in the company.</p>

          <div className="table-wrapper">
            <table className="members-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="empty-state">Loading members…</td>
                  </tr>
                ) : activeMembers.length ? (
                  activeMembers.map((member) => (
                    <tr key={member.id}>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>{member.role}</td>
                      <td>{member.status}</td>
                      <td>
                        <button
                          className="btn-outline"
                          onClick={() => handleDeactivate(member.id)}
                        >
                          <UserMinus size={16} /> Deactivate
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-state">No active members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel invitations-panel">
        <div className="panel-header">
          <h2>Pending Invitations</h2>
          <span className="panel-label">Manage open invite links</span>
        </div>

        <div className="table-wrapper">
          <table className="invites-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvitations.length ? (
                pendingInvitations.map((invite) => (
                  <tr key={invite.id}>
                    <td>{invite.email}</td>
                    <td>{invite.role}</td>
                    <td>{invite.status}</td>
                    <td>{new Date(invite.expires_at).toLocaleDateString()}</td>
                    <td>
                      <button className="icon-button" onClick={() => handleCopyLink(invite.token)}>
                        <Copy size={16} /> Copy link
                      </button>
                    </td>
                    <td>
                      <button className="btn-danger" onClick={() => handleRevoke(invite.id)}>
                        <Trash2 size={16} /> Revoke
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">No pending invitations.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Members;
