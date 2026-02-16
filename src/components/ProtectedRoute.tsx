import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (requiredRole && !hasRole(requiredRole)) {
    // Teamleiter and Office have admin-level access
    if (requiredRole === 'admin' && (hasRole('teamleiter') || hasRole('office'))) {
      // Allow through
    } else {
      return <Navigate to={(hasRole('admin') || hasRole('teamleiter') || hasRole('office')) ? '/admin' : '/vehicles'} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
