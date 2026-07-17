import {useEffect, useMemo, useState, } from 'react';
import { CheckCircle2, ClipboardList, Clock3, Eye, LogOut, Plus,  RefreshCw, TrendingUp, } from 'lucide-react';
import ActivityFormModal from '../../components/activities/ActivityFormModal.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {createActivity, getActivities, updateActivity,} from '../../services/activities.service.js';
import ActivitiesBoard from '../../components/activities/ActivitiesBoard.jsx';
import ActivityEditModal from '../../components/activities/ActivityEditModal.jsx';

import '../../styles/dashboard.css';

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('') || 'U';
}

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const [isActivityModalOpen, setIsActivityModalOpen] =
    useState(false);

  const [activities, setActivities] =
  useState([]);

  const [activitiesLoading, setActivitiesLoading] =
    useState(true);

  const [activitiesError, setActivitiesError] =
  useState('');

  const [selectedActivity,setSelectedActivity,] = 
  useState(null);

 const [isEditModalOpen, setIsEditModalOpen,] = 
  useState(false);

  const [notification, setNotification] =
    useState(null);

    useEffect(() => {
    let componentIsMounted = true;

    async function loadActivities() {
      try {
        setActivitiesLoading(true);
        setActivitiesError('');

        const result = await getActivities();

        if (componentIsMounted) {
          setActivities(
            Array.isArray(result.actividades)
              ? result.actividades
              : [],
          );
        }
      } catch (error) {
        console.error(
          'Error cargando actividades:',
          error,
        );

        if (componentIsMounted) {
          setActivitiesError(
            error.message ||
              'No fue posible cargar el tablero.',
          );
        }
      } finally {
        if (componentIsMounted) {
          setActivitiesLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      componentIsMounted = false;
    };
  }, []);

  function handleOpenEditModal(activity) {
    setSelectedActivity(activity);
    setIsEditModalOpen(true);
  }

  function handleCloseEditModal() {
    setIsEditModalOpen(false);
    setSelectedActivity(null);
  }

  async function handleUpdateActivity(
    activityId,
    activityData,
  ) {
    setNotification(null);

    try {
      const result = await updateActivity(
        activityId,
        activityData,
      );

      const savedActivity =
        result.actividad;

      setActivities((currentActivities) =>
        currentActivities.map((activity) => {
          if (
            String(activity.id) !==
            String(
              savedActivity.id_actividad,
            )
          ) {
            return activity;
          }

          return {
            ...activity,
            id: savedActivity.id_actividad,
            titulo: savedActivity.titulo,
            descripcion:
              savedActivity.descripcion || '',
            responsable:
              savedActivity.responsable?.nombre ||
              activity.responsable ||
              'Sin responsable',
            fechaLimite:
              typeof savedActivity.fecha_limite ===
              'string'
                ? savedActivity.fecha_limite.slice(
                    0,
                    10,
                  )
                : savedActivity.fecha_limite,
            prioridad:
              savedActivity.prioridad,
            estatus:
              savedActivity.estatus,
          };
        }),
      );

      handleCloseEditModal();

      setNotification({
        type: 'success',
        message:
          result.message ||
          'Actividad actualizada correctamente.',
      });

      window.setTimeout(() => {
        setNotification(null);
      }, 4000);

      return result;
    } catch (error) {
      console.error(
        'Error actualizando actividad:',
        error,
      );

      setNotification({
        type: 'error',
        message:
          error.message ||
          'No fue posible actualizar la actividad.',
      });

      throw error;
    }
  }

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
    const result = await createActivity({
      titulo: activityData.titulo,
      descripcion: activityData.descripcion,
      idResponsable: null,
      fechaLimite: activityData.fechaLimite,
      prioridad: activityData.prioridad,
      estatus: activityData.estatus,
    });

    const savedActivity = result.actividad;

    const newActivity = {
      id: savedActivity.id_actividad,
      titulo: savedActivity.titulo,
      descripcion:
        savedActivity.descripcion || '',
      responsable:
        savedActivity.responsable?.nombre ||
        'Sin responsable',
      fechaLimite:
    typeof savedActivity.fecha_limite === 'string'
    ? savedActivity.fecha_limite.slice(0, 10)
    : savedActivity.fecha_limite,
      prioridad: savedActivity.prioridad,
      estatus: savedActivity.estatus,
      comentarios: 0,
      evidencias: 0,
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

       <ActivitiesBoard
          activities={activities}
          loading={activitiesLoading}
          error={activitiesError}
          onEditActivity={handleOpenEditModal}
        />

      </main>

      <ActivityFormModal
        isOpen={isActivityModalOpen}
        onClose={() =>
          setIsActivityModalOpen(false)
        }
        onSubmit={handleCreateActivity}
      />

<ActivityEditModal
  isOpen={isEditModalOpen}
  activity={selectedActivity}
  onClose={handleCloseEditModal}
  onSubmit={handleUpdateActivity}
/>

    </div>
  );
}