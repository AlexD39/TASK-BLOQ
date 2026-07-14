import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, TriangleAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx'; // <--- Importamos tu contexto
import '../../styles/login.css';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); // <--- Consumimos la función login del contexto

  const [mensajeError, setMensajeError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setMensajeError('');

    const correoLimpio = correo.trim();

    if (!correoLimpio || !contrasena) {
      setMensajeError('El correo y la contraseña son obligatorios.');
      return;
    }

    try {
      setEnviando(true);

      // Ejecutamos el login simulado del AuthContext
      const resultado = login(correoLimpio, contrasena);

      if (resultado.success) {
        // Si es correcto, redirigimos al dashboard
        navigate('/dashboard');
      } else {
        // Si falla (credenciales incorrectas), mostramos el mensaje del contexto
        setMensajeError(resultado.message);
      }
    } catch (error) {
      setMensajeError('Ocurrió un error inesperado al intentar iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <div className="login-logo" aria-hidden="true">
            TB
          </div>
          <h1 id="login-title">TASK BLOQ</h1>
          <p>Tablero Académico en Equipo</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="correo">Correo electrónico</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Mail size={21} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <input
                id="correo"
                name="correo"
                type="email"
                placeholder="usuario@taskbloq.edu"
                autoComplete="username"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="contrasena">Contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <LockKeyhole size={21} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={contrasena}
                onChange={(event) => setContrasena(event.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-button" disabled={enviando}>
            {enviando ? 'Validando...' : 'Iniciar sesión'}
          </button>
        </form>

        {mensajeError && (
          <div className="login-alert" role="alert" aria-live="assertive">
            <TriangleAlert className="login-alert__icon" size={22} strokeWidth={2} aria-hidden="true" />
            <p>{mensajeError}</p>
          </div>
        )}

        <div className="login-note">
          Acceso exclusivo para usuarios registrados
        </div>
      </section>

      <footer className="login-footer">
        © 2026 TASK BLOQ · Gestión Académica
      </footer>
    </main>
  );
}

export default LoginPage;