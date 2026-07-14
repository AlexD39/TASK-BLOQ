import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getDashboard,
  logout,
} from '../../services/auth.service.js';

import '../../styles/dashboard.css';

function DashboardPage() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response =
          await getDashboard();

        setData(response);
      } catch {
        sessionStorage.clear();

        navigate('/login', {
          replace: true,
        });
      }
    }

    loadDashboard();
  }, [navigate]);

  async function handleLogout() {
    await logout();

    navigate('/login', {
      replace: true,
    });
  }

  if (!data) {
    return (
      <main className="dashboard-loading">
        Cargando dashboard...
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-brand">
            TASK BLOQ
          </span>

          <h1>Dashboard general</h1>

          <p>
            Bienvenido, {data.usuario.nombre}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </header>

      {error && <p>{error}</p>}

      <section className="user-card">
        <h2>Información de la sesión</h2>

        <p>
          <strong>Correo:</strong>{' '}
          {data.usuario.correo}
        </p>

        <p>
          <strong>Rol:</strong>{' '}
          {data.usuario.rol}
        </p>
      </section>

      <section className="dashboard-grid">
        <article>
          <strong>
            {data.indicadores.actividadesTotales}
          </strong>
          <span>Actividades</span>
        </article>

        <article>
          <strong>
            {data.indicadores.pendientes}
          </strong>
          <span>Pendientes</span>
        </article>

        <article>
          <strong>
            {data.indicadores.enProceso}
          </strong>
          <span>En proceso</span>
        </article>

        <article>
          <strong>
            {data.indicadores.completadas}
          </strong>
          <span>Completadas</span>
        </article>
      </section>
    </main>
  );
}

export default DashboardPage;