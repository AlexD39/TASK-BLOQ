// src/pages/user/DashboardPage.jsx
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  // Simulación de tareas para que el "TaskBoard Académico" no se vea vacío
  const tasks = [
    { id: 1, title: 'HU-04.02 — Validar campos y credenciales', status: 'In Progress', label: 'Feature', color: '#a371f7' },
    { id: 2, title: 'HU-04.04 — Proteger rutas privadas', status: 'Done', label: 'Security', color: '#38bdf8' },
    { id: 3, title: 'HU-04.06 — Configurar roles ADMIN y USER', status: 'To Do', label: 'Enhancement', color: '#535f80' },
  ];

  return (
    <div style={styles.container}>
      {/* Barra de Navegación Superior */}
      <header style={styles.navbar}>
        <div style={styles.navLeft}>
          <span style={styles.logo}>TASK BLOQ</span>
          <span style={styles.breadcrumb}>/ TaskBoard Académico</span>
        </div>
        <div style={styles.navRight}>
          <span style={styles.userBadge}>{user?.name} ({user?.role})</span>
          <button onClick={logout} style={styles.logoutBtn}>Cerrar Sesión</button>
        </div>
      </header>

      {/* Contenido Principal */}
      <div style={styles.layout}>
        {/* Sección del Tablero (Izquierda) */}
        <main style={styles.mainContent}>
          <div style={styles.boardHeader}>
            <span style={styles.openBadge}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '6px' }}>
                <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM2 8a6 6 0 1112 0A6 6 0 012 8z"></path>
              </svg>
              Tablero Activo
            </span>
            <h2 style={styles.boardTitle}>Sprint 1 - Gestión de Tareas Académicas</h2>
          </div>

          <div style={styles.taskList}>
            {tasks.map((task) => (
              <div key={task.id} style={styles.taskCard}>
                <div style={styles.taskHeader}>
                  <span style={{ ...styles.taskLabel, border: `1px solid ${task.color}`, color: task.color }}>
                    {task.label}
                  </span>
                  <span style={styles.taskStatus}>{task.status}</span>
                </div>
                <p style={styles.taskTitleText}>{task.title}</p>
              </div>
            ))}
          </div>
        </main>

        {/* Barra Lateral Derecha (Fiel al estilo "Metadatos" de la captura de pantalla) */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarSection}>
            <span style={styles.sidebarTitle}>Assignees</span>
            <div style={styles.sidebarContent}>
              <div style={styles.avatarRow}>
                <div style={styles.avatar}>{user?.name?.charAt(0) || 'U'}</div>
                <span>{user?.name} (Tú)</span>
              </div>
            </div>
          </div>

          <div style={styles.sidebarSection}>
            <span style={styles.sidebarTitle}>Labels</span>
            <div style={styles.sidebarContent}>
              <span style={{ ...styles.miniBadge, backgroundColor: '#23863622', color: '#2ea043', border: '1px solid #238636' }}>
                Active Session
              </span>
              <span style={{ ...styles.miniBadge, backgroundColor: '#1f6feb22', color: '#38bdf8', border: '1px solid #1f6feb', marginLeft: '5px' }}>
                {user?.role}
              </span>
            </div>
          </div>

          <div style={styles.sidebarSection}>
            <span style={styles.sidebarTitle}>Projects</span>
            <div style={styles.sidebarContent}>
              <span style={styles.sidebarText}>TASK-BLOQ- Board</span>
            </div>
          </div>

          <div style={styles.sidebarSection}>
            <span style={styles.sidebarTitle}>Milestone</span>
            <div style={styles.sidebarContent}>
              <span style={styles.sidebarText}>Fase 1: Autenticación</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0d1117', // Fondo exacto de GitHub Dark
    color: '#c9d1d9',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#161b22',
    borderBottom: '1px solid #30363d',
  },
  logo: {
    fontWeight: 'bold',
    color: '#f0f6fc',
    fontSize: '1.1rem',
  },
  breadcrumb: {
    color: '#8b949e',
    marginLeft: '5px',
    fontSize: '0.95rem',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userBadge: {
    fontSize: '0.85rem',
    color: '#8b949e',
  },
  logoutBtn: {
    padding: '4px 12px',
    backgroundColor: '#21262d',
    color: '#c9d1d9',
    border: '1px solid #30363d',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  layout: {
    display: 'flex',
    flex: 1,
  },
  mainContent: {
    flex: 1,
    padding: '2rem',
    borderRight: '1px solid #30363d',
  },
  boardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '2rem',
    borderBottom: '1px solid #21262d',
    paddingBottom: '1rem',
  },
  openBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    backgroundColor: '#238636',
    color: '#ffffff',
    borderRadius: '2em',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  boardTitle: {
    fontSize: '1.25rem',
    color: '#f0f6fc',
    margin: 0,
    fontWeight: '400',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxWidth: '800px',
  },
  taskCard: {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '1rem',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  taskLabel: {
    fontSize: '0.75rem',
    padding: '2px 8px',
    borderRadius: '2em',
    fontWeight: '600',
  },
  taskStatus: {
    fontSize: '0.75rem',
    color: '#8b949e',
  },
  taskTitleText: {
    margin: 0,
    color: '#f0f6fc',
    fontSize: '0.95rem',
    fontWeight: '600',
  },
  /* Estilos de la Barra Lateral Derecha */
  sidebar: {
    width: '280px',
    padding: '2rem 1.5rem',
    backgroundColor: '#0d1117',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sidebarSection: {
    borderBottom: '1px solid #21262d',
    paddingBottom: '1rem',
  },
  sidebarTitle: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#8b949e',
    marginBottom: '0.5rem',
  },
  sidebarContent: {
    fontSize: '0.85rem',
    color: '#c9d1d9',
  },
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  avatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#1f6feb',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.75rem',
  },
  miniBadge: {
    fontSize: '0.75rem',
    padding: '2px 6px',
    borderRadius: '2em',
    fontWeight: '600',
  },
  sidebarText: {
    fontSize: '0.85rem',
    color: '#8b949e',
  },
};