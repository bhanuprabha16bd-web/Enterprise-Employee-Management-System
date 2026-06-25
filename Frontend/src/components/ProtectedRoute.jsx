import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component.
 * Acts as a wrapper for routes that require authentication and specific user roles or statuses.
 * Redirects unauthenticated or unauthorized users to appropriate fallback pages.
 * 
 * @param {Object} props - Component props
 * @param {Array<string>} [props.allowedRoles] - Array of roles permitted to access the route
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.status === 'Inactive' || user?.status === 'Deactivated') {
    return <Navigate to="/deactivated" replace />;
  }

  if (user?.status === 'Suspended') {
    return <Navigate to="/suspended" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
