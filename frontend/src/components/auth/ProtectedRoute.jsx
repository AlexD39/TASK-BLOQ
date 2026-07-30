import {
  Navigate,
  useLocation,
} from 'react-router-dom';

import {
  useAuth,
} from '../../contexts/AuthContext.jsx';

export default function ProtectedRoute({
  children,
  allowedRoles,
}) {
  const {
    user,
    loading,
  } = useAuth();

  const location = useLocation();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
        }}
        replace
      />
    );
  }

  const roleIsAllowed =
    !allowedRoles ||
    allowedRoles.includes(user.role);

  if (!roleIsAllowed) {
    const destination =
      user.role === 'ADMIN'
        ? '/admin/usuarios'
        : '/dashboard';

    return (
      <Navigate
        to={destination}
        replace
      />
    );
  }

  return children;
}