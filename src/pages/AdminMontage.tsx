import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import MontageSubNav from '@/components/montage/MontageSubNav';

const AdminMontage = () => {
  const location = useLocation();

  // Redirect /admin/montage to /admin/montage/auftraege
  if (location.pathname === '/admin/montage') {
    return <Navigate to="/admin/montage/planung" replace />;
  }

  return (
    <AdminLayout>
      <MontageSubNav />
      <Outlet />
    </AdminLayout>
  );
};

export default AdminMontage;
