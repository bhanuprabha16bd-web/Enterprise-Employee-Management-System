import React, { useEffect, useState } from 'react';
import { Search, Clock4, ListChecks } from 'lucide-react';
import { auditService } from '../../services/auditService';
import './AuditLogs.css';

/**
 * AuditLogs Component.
 * Fetches and displays a list of system audit events, allowing admins
 * to track activities like role changes, logins, and entity updates.
 */
const AuditLogs = () => {
  // --- AUDIT LOGS STATE ---
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // --- AUDIT LOGS EFFECTS & FUNCTIONS ---
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await auditService.getAuditLogs();
        setLogs(data);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    return (
      log.event_type.toLowerCase().includes(search) ||
      log.description.toLowerCase().includes(search) ||
      log.actor_name?.toLowerCase().includes(search)
    );
  });

  /**
   * Derives a related entity name from the event description.
   * Helps categorize logs for better readability.
   * @param {Object} log - Audit log entry
   * @returns {string} Categorized entity string
   */
  const getRelatedEntity = (log) => {
    const entityHints = ['employee', 'department', 'company', 'user', 'role request', 'attendance', 'audit log'];
    const text = `${log.event_type} ${log.description}`.toLowerCase();

    for (const hint of entityHints) {
      if (text.includes(hint)) {
        return hint.charAt(0).toUpperCase() + hint.slice(1);
      }
    }

    return 'General';
  };

  return (
    <div className="auditlogs-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Review activity history for your company.</p>
        </div>
        <div className="auditlogs-actions">
          <div className="search-field">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search audit events"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="auditlogs-table-container">
        {loading ? (
          <div className="auditlogs-loading">Loading activity history...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="auditlogs-empty">No audit log entries found.</div>
        ) : (
          <table className="auditlogs-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Related Entity</th>
                <th>Details</th>
                <th>Time / Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.actor_name || 'Unknown'}</td>
                  <td>{log.event_type}</td>
                  <td>{getRelatedEntity(log)}</td>
                  <td>{log.description}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
