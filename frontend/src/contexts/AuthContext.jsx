// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al cargar la app, verifica si hay una sesión guardada
    const savedUser = localStorage.getItem('task_bloq_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    // Simulador de login con credenciales válidas y asignación de roles
    // En el futuro, aquí harás tu petición fetch/axios a la API de TASK-BLOQ.
    if (email === 'admin@taskbloq.com' && password === 'admin123') {
      const userData = { email, role: 'ADMIN', name: 'Administrador TaskBloq' };
      localStorage.setItem('task_bloq_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } else if (email === 'user@taskbloq.com' && password === 'user123') {
      const userData = { email, role: 'USER', name: 'Estudiante Académico' };
      localStorage.setItem('task_bloq_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    }

    return { success: false, message: 'El correo o la contraseña son incorrectos.' };
  };

  const logout = () => {
    localStorage.removeItem('task_bloq_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};