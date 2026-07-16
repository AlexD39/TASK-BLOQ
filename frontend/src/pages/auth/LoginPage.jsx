import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

// Icono de sobre (correo electrónico)
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

// Icono de candado (contraseña)
const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    // El login del contexto que valida las credenciales de demostración
    const result = login(email, password);

    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Línea decorativa superior con degradado */}
        <div style={styles.topGradientBar}></div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Logo "TB" */}
          <div style={styles.logoContainer}>
            <div style={styles.logoBox}>TB</div>
          </div>

          {/* Títulos */}
          <h1 style={styles.brandTitle}>TASK BLOQ</h1>
          <p style={styles.brandSubtitle}>Tablero Académico en Equipo</p>

          {/* Alerta de Error si falla el login */}
          {error && <div style={styles.errorAlert}>{error}</div>}

          {/* Campo Correo */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo electrónico</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}><MailIcon /></span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@taskbloq.edu"
                style={styles.input}
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}><LockIcon /></span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
              />
            </div>
          </div>

          {/* Botón de Iniciar Sesión con degradado */}
          <button type="submit" style={styles.button}>
            Iniciar sesión
          </button>

          {/* Caja de Credenciales de demostración */}
          <div style={styles.demoBox}>
            <p style={styles.demoTitle}>Credenciales de de demostración</p>
            <div style={styles.demoPill}>admin@taskbloq.edu</div>
            <div style={styles.demoPill}>TaskBloq2026</div>
          </div>
        </form>
      </div>

      {/* Footer fuera de la tarjeta */}
      <footer style={styles.footer}>
        © 2026 TASK BLOQ · Gestión Académica
      </footer>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    // Fondo azul con degradado profundo
    background: 'radial-gradient(circle, #1a365d 0%, #0f172a 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '20px',
    boxSizing: 'border-box',
    width: '100%',
  },
  card: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '420px',
    borderRadius: '24px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    marginBottom: '15px',
  },
  topGradientBar: {
    height: '6px',
    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
    width: '100%',
  },
  form: {
    padding: '40px 30px',
    display: 'flex',
    flexDirection: 'column',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  logoBox: {
    width: '72px',
    height: '72px',
    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    borderRadius: '18px',
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)',
  },
  brandTitle: {
    color: '#0f172a',
    fontSize: '26px',
    fontWeight: '800',
    textAlign: 'center',
    margin: '0 0 4px 0',
    letterSpacing: '-0.5px',
  },
  brandSubtitle: {
    color: '#94a3b8',
    fontSize: '14px',
    textAlign: 'center',
    margin: '0 0 32px 0',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    border: '1px solid #fca5a5',
    padding: '10px 14px',
    borderRadius: '12px',
    marginBottom: '16px',
    fontSize: '13px',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    textAlign: 'left',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 46px',
    borderRadius: '14px',
    border: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(to right, #3551e7, #4f46e5)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '10px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
  },
  demoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  demoTitle: {
    color: '#64748b',
    fontSize: '12px',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  demoPill: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#64748b',
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    width: '100%',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  footer: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '12px',
    textAlign: 'center',
    marginTop: '10px',
  },
};