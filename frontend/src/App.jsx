import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'; // <--- Importamos el contexto y el hook

import LoginPage from './pages/auth/LoginPage.jsx';
import DashboardPage from './pages/user/DashboardPage.jsx';

// Componente para proteger rutas privadas
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>; // Evita parpadeos mientras lee el localStorage

  if (!user) {
    // Si no está logueado, patitas a la calle (al login)
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Componente para proteger rutas públicas (ej. que un logueado no pueda volver al login)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (user) {
    // Si ya está logueado, lo mandamos directo al dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider> {/* <--- Envolvemos toda la app con el proveedor de autenticación */}
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
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
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;