import { Routes, Route, Navigate } from 'react-router-dom';
import Welcome from '../pages/Welcome/Welcome';
import Login from '../pages/Login/Login';
import ForgotPassword from '../pages/Login/ForgotPassword';
import AccountDeactivated from '../pages/Login/AccountDeactivated';
import AccountSuspended from '../pages/Login/AccountSuspended';
import MainLayout from '../components/layout/MainLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import Users from '../pages/Users/Users';
import Departments from '../pages/Departments/Departments';
import AttendanceLeave from '../pages/AttendanceLeave/AttendanceLeave';
import Settings from '../pages/Settings/Settings';
import CompanyDetails from '../pages/Company/CompanyDetails';
import AuditLogs from '../pages/AuditLogs/AuditLogs';
import Members from '../pages/Members/Members';
import ActivityTracking from '../pages/ActivityTracking/ActivityTracking';
import DataExport from '../pages/DataExport/DataExport';
import ReinstatementRequests from '../pages/ReinstatementRequests/ReinstatementRequests';
import HolidayCalendar from '../pages/Holidays/HolidayCalendar';
import LoginDevices from '../pages/LoginDevices/LoginDevices';
import AdminDeviceMonitoring from '../pages/AdminDeviceMonitoring/AdminDeviceMonitoring';
import ProtectedRoute from '../components/ProtectedRoute';

/**
 * AppRoutes Component
 * Defines the main routing structure of the React application.
 * Manages public, protected, and role-restricted routes.
 */
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/deactivated" element={<AccountDeactivated />} />
      <Route path="/suspended" element={<AccountSuspended />} />
      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Users />} />
          <Route path="departments" element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route index element={<Departments />} />
          </Route>
          <Route path="attendance-leave" element={<ProtectedRoute />}>
            <Route index element={<AttendanceLeave />} />
          </Route>
          <Route path="audit-logs" element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route index element={<AuditLogs />} />
          </Route>
          <Route path="activity" element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route index element={<ActivityTracking />} />
          </Route>
          <Route path="members" element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route index element={<Members />} />
          </Route>
          <Route path="company" element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route index element={<CompanyDetails />} />
          </Route>
          <Route path="data-export" element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route index element={<DataExport />} />
          </Route>
          <Route path="reinstatement-requests" element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route index element={<ReinstatementRequests />} />
          </Route>
          <Route path="holidays" element={<ProtectedRoute />}>
            <Route index element={<HolidayCalendar />} />
          </Route>
          <Route path="settings" element={<ProtectedRoute />}>
            <Route index element={<Settings />} />
          </Route>
          <Route path="login-devices" element={<ProtectedRoute />}>
            <Route index element={<LoginDevices />} />
          </Route>
          <Route path="device-monitoring" element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route index element={<AdminDeviceMonitoring />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
