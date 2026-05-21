import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login';
import MainLayout from '../components/layout/MainLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import Employees from '../pages/Employees/Employees';
import Departments from '../pages/Departments/Departments';
import Attendance from '../pages/Attendance/Attendance';
import Settings from '../pages/Settings/Settings';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirect root to login for demonstration purposes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="departments" element={<Departments />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
