import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Eye,
  LogOut,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  TrendingUp,
  X,
} from 'lucide-react';

import ActivityFormModal from '../../components/activities/ActivityFormModal.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { createActivity } from '../../services/activities.service.js';
import '../../styles/dashboard.css';

const STATUS_COLUMNS = [
  {
    value: 'PENDIENTE',
    label: 'Pendiente',
    className: 'pending',
  },
  {
    value: 'EN_PROCESO',
    label: 'En proceso',
    className: 'in-progress',
  },
  {
    value: 'EN_REVISION',
    label: 'En revisión',
    className: 'in-review',
  },
  {
    value: 'COMPLETADA',
    label: 'Completada',
    className: 'completed',
  },
];

const INITIAL_ACTIVITIES = [];

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('') || 'U';
}

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Sin fecha';
  }

  const normalizedDate =
    typeof dateValue === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ? `${dateValue}T00:00:00`
      : dateValue;

  const parsedDate = new Date(normalizedDate);

  if (Number.isNaN(parsedDate.getTime())) {
    console.error(
      'Fecha inválida recibida:',
      dateValue,
    );

    return 'Fecha inválida';
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
}

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const [isActivityModalOpen, setIsActivityModalOpen] =
    useState(false);

  // Estado para el modal de ver detalles
  const [selectedActivity, setSelectedActivity] = useState(null);

  const [activities, setActivities] =
    useState(INITIAL_ACTIVITIES);

  const [notification, setNotification] =
    useState(null);

  const indicators = useMemo(() => {
    const total = activities.length;

    const pending = activities.filter(
      (activity) =>
        activity.estatus === 'PENDIENTE',
    ).length;

    const inProgress = activities.filter(
      (activity) =>
        activity.estatus === 'EN_PROCESO',
    ).length;

    const inReview = activities.filter(
      (activity) =>
        activity.estatus === 'EN_REVISION',
    ).length;

    const completed = activities.filter(
      (activity) =>
        activity.estatus === 'COMPLETADA',
    ).length;

    const progress =
      total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    return {
      total,
      pending,
      inProgress,
      inReview,
      completed,
      progress,
    };
  }, [activities]);

  async function handleCreateActivity(
    activityData,
  ) {
    setNotification(null);

    try {
      // Pasamos la data del formulario
      const result = await createActivity({
        titulo: activityData.titulo,
        descripcion: activityData.descripcion,
        idResponsable: activityData.idResponsable || null,
        fechaLimite: activityData.fechaLimite,
        prioridad: activityData.prioridad,
        estatus: activityData.estatus,
        evidencia_url: activityData.evidencia_url || '', // Tu nuevo campo de evidencia
      });

      const savedActivity = result.actividad;

      // 🛠️ Mapeo corregido para soportar tanto la respuesta de simulación como la real
      const newActivity = {
        id: savedActivity.id || savedActivity.id_actividad || Math.floor(Math.random() * 1000),
        titulo: savedActivity.titulo,
        descripcion: savedActivity.descripcion || '',
        // Si hay un objeto responsable lo lee, de lo contrario busca el string directamente o asigna tu usuario logueado
        responsable:
          savedActivity.responsable?.nombre ||
          activityData.responsable ||
          user?.name ||
          'Sin responsable',
        // Asegura leer fecha_limite o fechaLimite según sea el caso
        fechaLimite:
          savedActivity.fechaLimite ||
          savedActivity.fecha_limite ||
          activityData.fechaLimite,
        prioridad: savedActivity.prioridad,
        estatus: savedActivity.estatus,
        comentarios: 0,
        // Si tiene evidencia (evidencia_url), le marca 1 para que aparezca el icono de clip en la tarjeta
        evidencias: (savedActivity.evidencia_url || activityData.evidencia_url) ? 1 : 0,
        evidencia_url: savedActivity.evidencia_url || activityData.evidencia_url || '',
      };

      setActivities((currentActivities) => [
        newActivity,
        ...currentActivities,
      ]);

      setIsActivityModalOpen(false);

      setNotification({
        type: 'success',
        message:
          result.message ||
          'Actividad registrada correctamente.',
      });

      window.setTimeout(() => {
        setNotification(null);
      }, 4000);
    } catch (error) {
      console.error(
        'Error registrando actividad:',
        error,
      );

      setNotification({
        type: 'error',
        message:
          error.message ||
          'No fue posible registrar la actividad.',
      });
    }
  }

  function getActivitiesByStatus(status) {
    return activities.filter(
      (activity) => activity.estatus === status,
    );
  }

  return (
    <div className="taskboard-page">
      <header className="taskboard-navbar">
        <div className="taskboard-brand">
          <div
            className="taskboard-brand__logo"
            aria-hidden="true"
          >
            TB
          </div>

          <strong>TASK BLOQ</strong>

          <span>Tablero Académico</span>
        </div>

        <div className="taskboard-session">
          <div className="taskboard-user">
            <span className="taskboard-avatar">
              {getInitials(user?.name)}
            </span>

            <span>
              {user?.name || 'Usuario'}
            </span>
          </div>

          <button
            type="button"
            className="taskboard-logout"
            onClick={logout}
          >
            <LogOut
              size={19}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="taskboard-content">
        <section className="taskboard-heading">
          <div>
            <h1>Tablero de actividades</h1>

            <p>
              Proyecto: Investigación Educativa —
              Semestre 2026
            </p>
          </div>

          <button
            type="button"
            className="new-activity-button"
            onClick={() =>
              setIsActivityModalOpen(true)
            }
          >
            <Plus
              size={21}
              strokeWidth={2}
              aria-hidden="true"
            />

            Nueva actividad
          </button>
        </section>

        {notification && (
          <div
            className={`dashboard-alert dashboard-alert--${notification.type}`}
            role="alert"
          >
            {notification.message}
          </div>
        )}

        <section
          className="taskboard-indicators"
          aria-label="Indicadores de actividades"
        >
          <article className="indicator-card indicator-card--total">
            <div className="indicator-card__label">
              <ClipboardList size={18} />
              <span>Total</span>
            </div>

            <strong>{indicators.total}</strong>
            <p>actividades</p>
          </article>

          <article className="indicator-card indicator-card--pending">
            <div className="indicator-card__label">
              <Clock3 size={18} />
              <span>Pendientes</span>
            </div>

            <strong>{indicators.pending}</strong>

            <div className="indicator-progress">
              <span
                style={{
                  width: `${
                    indicators.total
                      ? (
                          indicators.pending /
                          indicators.total
                        ) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </article>

          <article className="indicator-card indicator-card--progress">
            <div className="indicator-card__label">
              <RefreshCw size={18} />
              <span>En proceso</span>
            </div>

            <strong>{indicators.inProgress}</strong>

            <div className="indicator-progress">
              <span
                style={{
                  width: `${
                    indicators.total
                      ? (
                          indicators.inProgress /
                          indicators.total
                        ) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </article>

          <article className="indicator-card indicator-card--review">
            <div className="indicator-card__label">
              <Eye size={18} />
              <span>En revisión</span>
            </div>

            <strong>{indicators.inReview}</strong>

            <div className="indicator-progress">
              <span
                style={{
                  width: `${
                    indicators.total
                      ? (
                          indicators.inReview /
                          indicators.total
                        ) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </article>

          <article className="indicator-card indicator-card--completed">
            <div className="indicator-card__label">
              <CheckCircle2 size={18} />
              <span>Completadas</span>
            </div>

            <strong>{indicators.completed}</strong>

            <div className="indicator-progress">
              <span
                style={{
                  width: `${
                    indicators.total
                      ? (
                          indicators.completed /
                          indicators.total
                        ) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </article>

          <article className="indicator-card indicator-card--advance">
            <div className="indicator-card__label">
              <TrendingUp size={18} />
              <span>Avance</span>
            </div>

            <strong>{indicators.progress}%</strong>

            <div className="indicator-progress">
              <span
                style={{
                  width: `${indicators.progress}%`,
                }}
              />
            </div>

            <p>
              {indicators.completed} de{' '}
              {indicators.total} completadas
            </p>
          </article>
        </section>

        <section
          className="taskboard-columns"
          aria-label="Tablero de actividades"
        >
          {STATUS_COLUMNS.map((column) => {
            const columnActivities =
              getActivitiesByStatus(column.value);

            return (
              <article
                key={column.value}
                className={`board-column board-column--${column.className}`}
              >
                <header className="board-column__header">
                  <div>
                    <span className="board-column__dot" />

                    <h2>{column.label}</h2>
                  </div>

                  <span className="board-column__count">
                    {columnActivities.length}
                  </span>
                </header>

                <div className="board-column__content">
                  {columnActivities.length === 0 ? (
                    <div className="board-column__empty">
                      No hay actividades
                    </div>
                  ) : (
                    columnActivities.map(
                      (activity) => (
                        <article
                          key={activity.id}
                          className="activity-card"
                        >
                          <div className="activity-card__top">
                            <span
                              className={`priority-badge priority-badge--${activity.prioridad.toLowerCase()}`}
                            >
                              <span />
                              {activity.prioridad
                                .charAt(0)
                                .toUpperCase() +
                                activity.prioridad
                                  .slice(1)
                                  .toLowerCase()}
                            </span>

                            {activity.comentarios > 0 && (
                              <span className="activity-card__comments">
                                <MessageSquare
                                  size={16}
                                />
                                {activity.comentarios}
                              </span>
                            )}
                          </div>

                          <h3>{activity.titulo}</h3>

                          <div className="activity-card__person">
                            <span className="activity-avatar">
                              {getInitials(
                                activity.responsable,
                              )}
                            </span>

                            <span>
                              {activity.responsable}
                            </span>
                          </div>

                          <div className="activity-card__date">
                            <CalendarDays size={16} />

                            <span>
                              {formatDate(
                                activity.fechaLimite,
                              )}
                            </span>
                          </div>

                          {activity.evidencias > 0 && (
                            <div className="activity-card__evidence">
                              <Paperclip size={16} />

                              <span>
                                {activity.evidencias}{' '}
                                evidencia(s)
                              </span>
                            </div>
                          )}

                          <footer className="activity-card__footer">
                            {/* 🛠️ ASIGNAMOS EVENTO ONCLICK PARA ABRIR DETALLE */}
                            <button 
                              type="button"
                              onClick={() => setSelectedActivity(activity)}
                            >
                              Ver detalle

                              <ChevronRight
                                size={17}
                              />
                            </button>
                          </footer>
                        </article>
                      ),
                    )
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <ActivityFormModal
        isOpen={isActivityModalOpen}
        onClose={() =>
          setIsActivityModalOpen(false)
        }
        onSubmit={handleCreateActivity}
      />

      {/* 🛠️ MODAL DE DETALLE INTERACTIVO LOCAL */}
      {selectedActivity && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="modal-content" style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setSelectedActivity(null)}
              style={{
                position: 'absolute',
                top: '16px', right: '16px',
                background: 'none', border: 'none',
                cursor: 'pointer', color: '#666'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ marginTop: 0, marginBottom: '8px', color: '#1a1a1a' }}>
              {selectedActivity.titulo}
            </h2>
            
            <span style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: selectedActivity.prioridad === 'ALTA' ? '#fee2e2' : '#fef3c7',
              color: selectedActivity.prioridad === 'ALTA' ? '#991b1b' : '#92400e',
              marginBottom: '16px'
            }}>
              Prioridad: {selectedActivity.prioridad}
            </span>

            <div style={{ marginBottom: '16px' }}>
              <strong style={{ display: 'block', marginBottom: '4px', color: '#555' }}>Descripción:</strong>
              <p style={{ margin: 0, color: '#333', fontSize: '14px', lineHeight: '1.5' }}>
                {selectedActivity.descripcion || 'Sin descripción.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '13px', color: '#555' }}>Responsable:</strong>
                <span style={{ fontSize: '14px', color: '#111' }}>{selectedActivity.responsable}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '13px', color: '#555' }}>Fecha límite:</strong>
                <span style={{ fontSize: '14px', color: '#111' }}>{formatDate(selectedActivity.fechaLimite)}</span>
              </div>
            </div>

            {/* MOSTRAR TU NUEVO CAMPO DE EVIDENCIA SI EXISTE */}
            {selectedActivity.evidencia_url && (
              <div style={{
                padding: '12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <Paperclip size={18} style={{ color: '#16a34a' }} />
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                  <strong style={{ display: 'block', fontSize: '12px', color: '#15803d' }}>Enlace de Evidencia:</strong>
                  <a 
                    href={selectedActivity.evidencia_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: '13px', color: '#16a34a', textDecoration: 'underline' }}
                  >
                    {selectedActivity.evidencia_url}
                  </a>
                </div>
              </div>
            )}

            <button 
              onClick={() => setSelectedActivity(null)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}