import { useState, useEffect } from 'react';
import { DownloadCloud, Users, CalendarCheck, FileText, ListChecks, Bell, PieChart, FileDown, Table, FileSpreadsheet, Activity } from 'lucide-react';
import { exportService } from '../../services/exportService';
import toast from 'react-hot-toast';
import './DataExport.css';

const exportEntities = [
  { id: 'employees', title: 'Employees', description: 'Export employee profiles, positions, and joining details.', icon: <Users size={24} /> },
  { id: 'attendance', title: 'Attendance', description: 'Export daily check-in/out records and attendance status.', icon: <CalendarCheck size={24} /> },
  { id: 'leave_requests', title: 'Leave Requests', description: 'Export leave applications and their approval status.', icon: <FileText size={24} /> },
  { id: 'audit_logs', title: 'Audit Logs', description: 'Export system activity and audit trail records.', icon: <ListChecks size={24} /> },
  { id: 'notifications', title: 'Notifications', description: 'Export system notifications and alerts.', icon: <Bell size={24} /> },
  { id: 'analytics', title: 'Analytics', description: 'Export high-level summary statistics and metrics.', icon: <PieChart size={24} /> },
  { id: 'activity_tracking', title: 'Activity Tracking', description: 'Export user session history, IP addresses, and device usage alerts.', icon: <Activity size={24} /> },
];

/**
 * DataExport Component.
 * Provides an interface to export system data (employees, attendance, etc.) to CSV, Excel, or PDF.
 * Also displays the history of previous exports.
 */
const DataExport = () => {
  const [activeTab, setActiveTab] = useState('export');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [downloading, setDownloading] = useState({ entity: null, format: null });

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  /**
   * Fetches export history logs from the server.
   */
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await exportService.getExportHistory();
      setHistory(data);
    } catch (error) {
      console.error("Failed to load export history", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  /**
   * Triggers an export for a specific entity in the desired format.
   * Initiates a file download on success.
   * 
   * @param {string} entity - The data entity to export (e.g., 'employees')
   * @param {string} format - The file format (e.g., 'csv', 'excel', 'pdf')
   */
  const handleExport = async (entity, format) => {
    setDownloading({ entity, format });
    try {
      const response = await exportService.downloadExport(entity, format);
      
      // Create a blob from the response
      const blob = new Blob([response.data]);
      
      // Get filename from headers if possible, else generate one
      let filename = `${entity}_export.${format === 'excel' ? 'xlsx' : format}`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Create a link to download the file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${entity} exported as ${format.toUpperCase()} successfully.`);
    } catch (error) {
      console.error("Export failed", error);
      toast.error(`Failed to export ${entity} as ${format.toUpperCase()}`);
    } finally {
      setDownloading({ entity: null, format: null });
    }
  };

  const isDownloading = (entity, format) => {
    return downloading.entity === entity && downloading.format === format;
  };

  return (
    <div className="data-export-container">
      <div className="export-header">
        <h1><DownloadCloud size={28} /> Data Export Center</h1>
        <p>Export company data to various formats or review past exports.</p>
      </div>

      <div className="export-tabs">
        <button 
          className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Export Data
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Export History
        </button>
      </div>

      {activeTab === 'export' && (
        <div className="export-grid">
          {exportEntities.map((entity) => (
            <div className="export-card" key={entity.id}>
              <div className="export-card-icon">
                {entity.icon}
              </div>
              <h3>{entity.title}</h3>
              <p>{entity.description}</p>
              
              <div className="export-actions">
                <button 
                  className={`export-btn ${isDownloading(entity.id, 'csv') ? 'downloading' : ''}`}
                  onClick={() => handleExport(entity.id, 'csv')}
                  disabled={downloading.entity !== null}
                  title="Export as CSV"
                >
                  {!isDownloading(entity.id, 'csv') && <Table size={16} />} CSV
                </button>
                <button 
                  className={`export-btn ${isDownloading(entity.id, 'excel') ? 'downloading' : ''}`}
                  onClick={() => handleExport(entity.id, 'excel')}
                  disabled={downloading.entity !== null}
                  title="Export as Excel"
                >
                  {!isDownloading(entity.id, 'excel') && <FileSpreadsheet size={16} />} Excel
                </button>
                <button 
                  className={`export-btn ${isDownloading(entity.id, 'pdf') ? 'downloading' : ''}`}
                  onClick={() => handleExport(entity.id, 'pdf')}
                  disabled={downloading.entity !== null}
                  title="Export as PDF"
                >
                  {!isDownloading(entity.id, 'pdf') && <FileDown size={16} />} PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-container">
          {loadingHistory ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              No export history found.
            </div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Who Exported</th>
                  <th>Data Entity</th>
                  <th>Format</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                    <td>
                      <div>{log.user_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{log.user_email}</div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {log.entity_type.replace('_', ' ')}
                    </td>
                    <td>
                      <span className={`badge badge-${log.export_format}`}>
                        {log.export_format.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default DataExport;
