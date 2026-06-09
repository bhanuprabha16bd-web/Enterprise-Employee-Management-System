import { Routes, Route, Navigate } from 'react-router-dom';
import Welcome from '../pages/Welcome/Welcome';
import Login from '../pages/Login/Login';
import ForgotPassword from '../pages/Login/ForgotPassword';
import MainLayout from '../components/layout/MainLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import Users from '../pages/Users/Users';
import Departments from '../pages/Departments/Departments';
import Attendance from '../pages/Attendance/Attendance';
import Settings from '../pages/Settings/Settings';
import CompanyDetails from '../pages/Company/CompanyDetails';
import AuditLogs from '../pages/AuditLogs/AuditLogs';
import Members from '../pages/Members/Members';
import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Users />} />
          <Route path="departments" element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route index element={<Departments />} />
          </Route>
          <Route path="attendance" element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route index element={<Attendance />} />
          </Route>
          <Route path="audit-logs" element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route index element={<AuditLogs />} />
          </Route>
          <Route path="members" element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route index element={<Members />} />
          </Route>
          <Route path="company" element={<ProtectedRoute />}>
            <Route index element={<CompanyDetails />} />
          </Route>
          <Route path="settings" element={<ProtectedRoute />}>
            <Route index element={<Settings />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
