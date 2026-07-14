import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Al cargar la app, revisamos si ya había una sesión guardada en el navegador
    useEffect(() => {
        const storedUser = localStorage.getItem('tb_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    // Función para iniciar sesión con las credenciales de demostración
    const login = (email, password) => {
        if (email === 'admin@taskbloq.edu' && password === 'TaskBloq2026') {
            const userData = { email, role: 'admin', loggedAt: new Date() };
            setUser(userData);
            localStorage.setItem('tb_user', JSON.stringify(userData));
            return { success: true };
        }
        return { success: false, message: 'Credenciales incorrectas. Verifique su correo o contraseña.' };
    };

    // Función para cerrar sesión
    const logout = () => {
        setUser(null);
        localStorage.removeItem('tb_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
