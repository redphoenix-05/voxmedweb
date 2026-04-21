import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/spinner';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (allowedRoles && !allowedRoles.includes(user.profile?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
