import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

const AuthContext = createContext(null);

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser =
        localStorage.getItem('task_bloq_user');

      const accessToken =
        sessionStorage.getItem(
          'task_bloq_access_token',
        );

      if (savedUser && accessToken) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error(
        'Error recuperando la sesión:',
        error,
      );

      localStorage.removeItem(
        'task_bloq_user',
      );

      sessionStorage.removeItem(
        'task_bloq_access_token',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    // 🔑 EL TRUCO: Bypass local de desarrollo para cuando el backend no esté corriendo
    if (email.trim() === 'admin@taskbloq.edu' && password === 'TaskBloq2026') {
      console.log('⚡ Acceso concedido mediante bypass en AuthContext.');
      
      const userData = {
        id: 999,
        name: 'Administrador Demo',
        email: 'admin@taskbloq.edu',
        role: 'ADMIN',
      };

      localStorage.setItem(
        'task_bloq_user',
        JSON.stringify(userData),
      );

      sessionStorage.setItem(
        'task_bloq_access_token',
        'token_falso_bypass_desarrollo_2026',
      );

      setUser(userData);

      return {
        success: true,
        user: userData,
      };
    }

    // Petición real al backend por si en el futuro está encendido
    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          credentials: 'include',

          body: JSON.stringify({
            correo: email.trim(),
            contrasena: password,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data.ok) {
        return {
          success: false,
          message:
            data.message ||
            'El correo o la contraseña son incorrectos.',
        };
      }

      const userData = {
        id: data.usuario.id,
        name: data.usuario.nombre,
        email: data.usuario.correo,
        role: data.usuario.rol,
      };

      localStorage.setItem(
        'task_bloq_user',
        JSON.stringify(userData),
      );

      sessionStorage.setItem(
        'task_bloq_access_token',
        data.accessToken,
      );

      setUser(userData);

      return {
        success: true,
        user: userData,
      };
    } catch (error) {
      console.error(
        'Error conectando con la API:',
        error,
      );

      return {
        success: false,
        message:
          'No fue posible conectar con el servidor.',
      };
    }
  }

  async function logout() {
    try {
      // Si es el token falso, no gastamos tiempo llamando al servidor apagado
      if (sessionStorage.getItem('task_bloq_access_token') !== 'token_falso_bypass_desarrollo_2026') {
        await fetch(
          `${API_URL}/auth/logout`,
          {
            method: 'POST',
            credentials: 'include',
          },
        );
      }
    } catch (error) {
      console.error(
        'Error cerrando sesión:',
        error,
      );
    } finally {
      localStorage.removeItem(
        'task_bloq_user',
      );

      sessionStorage.removeItem(
        'task_bloq_access_token',
      );

      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider.',
    );
  }

  return context;
}