import {
  CheckCircle2,
  Clock3,
  Eye,
  RefreshCw,
  UserCheck,
  UserPlus,
} from 'lucide-react';

function computeSummary(activities, currentUserId) {
  if (!currentUserId) {
    return {
      totalCreated: 0,
      totalAssigned: 0,
      pending: 0,
      inProgress: 0,
      inReview: 0,
      completed: 0,
    };
  }

  const totalCreated = activities.filter(
    (activity) => String(activity.idCreador) === String(currentUserId),
  ).length;

  const totalAssigned = activities.filter(
    (activity) => String(activity.idResponsable) === String(currentUserId),
  ).length;

  const relatedActivities = activities.filter(
    (activity) =>
      String(activity.idCreador) === String(currentUserId) ||
      String(activity.idResponsable) === String(currentUserId),
  );

  const pending = relatedActivities.filter(
    (activity) => activity.estatus === 'PENDIENTE',
  ).length;

  const inProgress = relatedActivities.filter(
    (activity) => activity.estatus === 'EN_PROCESO',
  ).length;

  const inReview = relatedActivities.filter(
    (activity) => activity.estatus === 'EN_REVISION',
  ).length;

  const completed = relatedActivities.filter(
    (activity) => activity.estatus === 'COMPLETADA',
  ).length;

  return {
    totalCreated,
    totalAssigned,
    pending,
    inProgress,
    inReview,
    completed,
  };
}

export default function MyActivitiesSummary({ activities, currentUser }) {
  const summary = computeSummary(activities || [], currentUser?.id);

  return (
    <section
      className="my-activities-summary"
      aria-label="Resumen de tus actividades"
    >
      <h2 className="my-activities-summary__title">
        Tus actividades ({currentUser?.name || 'Usuario'})
      </h2>

      <div className="taskboard-indicators my-activities-summary__totals">
        <article className="indicator-card indicator-card--total">
          <div className="indicator-card__label">
            <UserPlus size={18} />
            <span>Creadas por ti</span>
          </div>
          <strong>{summary.totalCreated}</strong>
          <p>actividades</p>
        </article>

        <article className="indicator-card indicator-card--total">
          <div className="indicator-card__label">
            <UserCheck size={18} />
            <span>Asignadas a ti</span>
          </div>
          <strong>{summary.totalAssigned}</strong>
          <p>actividades</p>
        </article>
      </div>

      <div className="taskboard-indicators my-activities-summary__status">
        <article className="indicator-card indicator-card--pending">
          <div className="indicator-card__label">
            <Clock3 size={18} />
            <span>Pendientes</span>
          </div>
          <strong>{summary.pending}</strong>
        </article>

        <article className="indicator-card indicator-card--progress">
          <div className="indicator-card__label">
            <RefreshCw size={18} />
            <span>En proceso</span>
          </div>
          <strong>{summary.inProgress}</strong>
        </article>

        <article className="indicator-card indicator-card--review">
          <div className="indicator-card__label">
            <Eye size={18} />
            <span>En revisión</span>
          </div>
          <strong>{summary.inReview}</strong>
        </article>

        <article className="indicator-card indicator-card--completed">
          <div className="indicator-card__label">
            <CheckCircle2 size={18} />
            <span>Completadas</span>
          </div>
          <strong>{summary.completed}</strong>
        </article>
      </div>
    </section>
  );
}
