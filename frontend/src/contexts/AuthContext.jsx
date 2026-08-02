import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  API_URL,
} from '../config/env.js';


const AuthContext = createContext(null);

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
      await fetch(
        `${API_URL}/auth/logout`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );
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