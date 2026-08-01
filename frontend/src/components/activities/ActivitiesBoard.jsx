import {
  CalendarDays,
  ChevronRight,
  MessageSquare,
  Paperclip,
} from 'lucide-react';

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

function getInitials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) =>
        word.charAt(0).toUpperCase(),
      )
      .join('') || 'SR'
  );
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
    return 'Fecha inválida';
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
}

function formatPriority(priority = 'MEDIA') {
  const normalizedPriority =
    priority.toUpperCase();

  return (
    normalizedPriority.charAt(0) +
    normalizedPriority
      .slice(1)
      .toLowerCase()
  );
}

export default function ActivitiesBoard({
  activities,
  loading,
  error,
  onEditActivity,
}) {
  if (loading) {
    return (
      <div className="dashboard-board-state">
        Cargando actividades...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="dashboard-alert dashboard-alert--error"
        role="alert"
      >
        {error}
      </div>
    );
  }

  return (
    <section
      className="taskboard-columns"
      aria-label="Tablero de actividades"
    >
      {STATUS_COLUMNS.map((column) => {
        const columnActivities =
          activities.filter(
            (activity) =>
              activity.estatus === column.value,
          );

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
                  (activity) => {
                    const responsibleName =
                      activity.responsable ||
                      'Sin responsable';

                    const creatorName =
                      activity.creador ||
                      'Sin creador';

                    const priority =
                      activity.prioridad ||
                      'MEDIA';

                    return (
                      <article
                        key={activity.id}
                        className="activity-card"
                      >
                        <div className="activity-card__top">
                          <span
                            className={`priority-badge priority-badge--${priority.toLowerCase()}`}
                          >
                            <span />

                            {formatPriority(
                              priority,
                            )}
                          </span>

                          {activity.comentarios >
                            0 && (
                            <span className="activity-card__comments">
                              <MessageSquare
                                size={16}
                              />

                              {
                                activity.comentarios
                              }
                            </span>
                          )}
                        </div>

                        <h3>{activity.titulo}</h3>

                        <div className="activity-card__person activity-card__person--creator">
                          <span className="activity-card__person-label">
                            Creador:
                          </span>

                          <span className="activity-avatar activity-avatar--creator">
                            {getInitials(
                              creatorName,
                            )}
                          </span>

                          <span>
                            {creatorName}
                          </span>
                        </div>

                        <div className="activity-card__person">
                          <span className="activity-card__person-label">
                            Responsable:
                          </span>

                          <span className="activity-avatar">
                            {getInitials(
                              responsibleName,
                            )}
                          </span>

                          <span>
                            {responsibleName}
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
                              {
                                activity.evidencias
                              }{' '}
                              evidencia(s)
                            </span>
                          </div>
                        )}

                        <footer className="activity-card__footer">
                          <button
                            type="button"
                            onClick={() => onEditActivity(activity)}
                        >
                            Ver detalle
                            <ChevronRight size={17} />
                            </button>
                        </footer>
                      </article>
                    );
                  },
                )
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}