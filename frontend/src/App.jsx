import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import {
  AuthProvider,
  useAuth,
} from './contexts/AuthContext.jsx';

import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

import LoginPage from './pages/auth/LoginPage.jsx';
import DashboardPage from './pages/user/DashboardPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';

function getHomeRoute(user) {
  if (user?.role === 'ADMIN') {
    return '/admin/usuarios';
  }

  return '/dashboard';
}

function HomeRedirect() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <Navigate
      to={getHomeRoute(user)}
      replace
    />
  );
}

function PublicRoute({
  children,
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (user) {
    return (
      <Navigate
        to={getHomeRoute(user)}
        replace
      />
    );
  }

  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<HomeRedirect />}
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[
                'USUARIO',
              ]}
            >
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute
              allowedRoles={[
                'ADMIN',
              ]}
            >
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<HomeRedirect />}
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;