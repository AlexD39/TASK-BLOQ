import { AlertTriangle, CalendarClock, ChevronRight } from 'lucide-react';

const DAYS_TO_WARN = 3;

function getInitials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
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
  const normalizedPriority = priority.toUpperCase();

  return (
    normalizedPriority.charAt(0) +
    normalizedPriority.slice(1).toLowerCase()
  );
}

function getDaysDifference(dateValue) {
  const normalizedDate =
    typeof dateValue === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ? `${dateValue}T00:00:00`
      : dateValue;

  const dueDate = new Date(normalizedDate);

  if (Number.isNaN(dueDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;

  return Math.round((dueDate.getTime() - today.getTime()) / msPerDay);
}

/**
 * Clasifica las actividades en:
 * - vencidas: fecha límite ya pasó y no está completada
 * - proximas: fecha límite dentro de los próximos DAYS_TO_WARN días
 */
function splitActivitiesByDeadline(activities) {
  const overdue = [];
  const upcoming = [];

  activities.forEach((activity) => {
    if (!activity.fechaLimite) {
      return;
    }

    if (activity.estatus === 'COMPLETADA') {
      return;
    }

    const daysDiff = getDaysDifference(activity.fechaLimite);

    if (daysDiff === null) {
      return;
    }

    if (daysDiff < 0) {
      overdue.push({ ...activity, daysDiff });
    } else if (daysDiff <= DAYS_TO_WARN) {
      upcoming.push({ ...activity, daysDiff });
    }
  });

  overdue.sort((a, b) => a.daysDiff - b.daysDiff);
  upcoming.sort((a, b) => a.daysDiff - b.daysDiff);

  return { overdue, upcoming };
}

function DeadlineCard({ activity, onEditActivity, variant }) {
  const responsibleName = activity.responsable || 'Sin responsable';
  const priority = activity.prioridad || 'MEDIA';

  return (
    <article className={`deadline-card deadline-card--${variant}`}>
      <div className="deadline-card__top">
        <span
          className={`priority-badge priority-badge--${priority.toLowerCase()}`}
        >
          <span />
          {formatPriority(priority)}
        </span>

        <span className={`deadline-chip deadline-chip--${variant}`}>
          {variant === 'overdue'
            ? `Vencida hace ${Math.abs(activity.daysDiff)} día(s)`
            : activity.daysDiff === 0
            ? 'Vence hoy'
            : `Vence en ${activity.daysDiff} día(s)`}
        </span>
      </div>

      <h3>{activity.titulo}</h3>

      <div className="activity-card__person">
        <span className="activity-avatar">
          {getInitials(responsibleName)}
        </span>
        <span>{responsibleName}</span>
      </div>

      <div className="activity-card__date">
        <CalendarClock size={16} />
        <span>{formatDate(activity.fechaLimite)}</span>
      </div>

      <footer className="activity-card__footer">
        <button type="button" onClick={() => onEditActivity(activity)}>
          Ver detalle
          <ChevronRight size={17} />
        </button>
      </footer>
    </article>
  );
}

export default function DeadlinesPanel({ activities, onEditActivity }) {
  const { overdue, upcoming } = splitActivitiesByDeadline(activities || []);

  if (overdue.length === 0 && upcoming.length === 0) {
    return null;
  }

  return (
    <section className="deadlines-panel" aria-label="Actividades vencidas o próximas a vencer">
      <header className="deadlines-panel__header">
        <AlertTriangle size={20} />
        <h2>Vencidas o próximas a vencer</h2>
      </header>

      <div className="deadlines-panel__columns">
        <div className="deadlines-column">
          <h3 className="deadlines-column__title deadlines-column__title--overdue">
            Vencidas ({overdue.length})
          </h3>

          {overdue.length === 0 ? (
            <div className="board-column__empty">
              No hay actividades vencidas
            </div>
          ) : (
            <div className="deadlines-column__list">
              {overdue.map((activity) => (
                <DeadlineCard
                  key={activity.id}
                  activity={activity}
                  onEditActivity={onEditActivity}
                  variant="overdue"
                />
              ))}
            </div>
          )}
        </div>

        <div className="deadlines-column">
          <h3 className="deadlines-column__title deadlines-column__title--upcoming">
            Próximas a vencer ({upcoming.length})
          </h3>

          {upcoming.length === 0 ? (
            <div className="board-column__empty">
              No hay actividades próximas a vencer
            </div>
          ) : (
            <div className="deadlines-column__list">
              {upcoming.map((activity) => (
                <DeadlineCard
                  key={activity.id}
                  activity={activity}
                  onEditActivity={onEditActivity}
                  variant="upcoming"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
