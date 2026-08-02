import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  RefreshCw,
  TrendingUp,
  UserCheck,
  UserPlus,
} from 'lucide-react';

function computeGeneralIndicators(activities) {
  const total = activities.length;

  const pending = activities.filter(
    (activity) => activity.estatus === 'PENDIENTE',
  ).length;

  const inProgress = activities.filter(
    (activity) => activity.estatus === 'EN_PROCESO',
  ).length;

  const inReview = activities.filter(
    (activity) => activity.estatus === 'EN_REVISION',
  ).length;

  const completed = activities.filter(
    (activity) => activity.estatus === 'COMPLETADA',
  ).length;

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, pending, inProgress, inReview, completed, progress };
}

function computePersonalIndicators(activities, currentUserId) {
  const total = activities.length;

  if (!currentUserId || total === 0) {
    return { createdByUser: 0, assignedToUser: 0, pctCreated: 0, pctAssigned: 0 };
  }

  const createdByUser = activities.filter(
    (activity) => String(activity.idCreador) === String(currentUserId),
  ).length;

  const assignedToUser = activities.filter(
    (activity) => String(activity.idResponsable) === String(currentUserId),
  ).length;

  return {
    createdByUser,
    assignedToUser,
    pctCreated: Math.round((createdByUser / total) * 100),
    pctAssigned: Math.round((assignedToUser / total) * 100),
  };
}

export default function IndicatorsPanel({ activities, currentUser }) {
  const general = computeGeneralIndicators(activities || []);
  const personal = computePersonalIndicators(activities || [], currentUser?.id);

  return (
    <section className="indicators-panel" aria-label="Indicadores de avance">
      <div className="indicators-panel__block">
        <h2 className="indicators-panel__title">
          Avance general del proyecto
        </h2>

        <div className="taskboard-indicators">
          <article className="indicator-card indicator-card--total">
            <div className="indicator-card__label">
              <ClipboardList size={18} />
              <span>Total</span>
            </div>
            <strong>{general.total}</strong>
            <p>actividades</p>
          </article>

          <article className="indicator-card indicator-card--pending">
            <div className="indicator-card__label">
              <Clock3 size={18} />
              <span>Pendientes</span>
            </div>
            <strong>{general.pending}</strong>
            <div className="indicator-progress">
              <span
                style={{
                  width: `${
                    general.total ? (general.pending / general.total) * 100 : 0
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
            <strong>{general.inProgress}</strong>
            <div className="indicator-progress">
              <span
                style={{
                  width: `${
                    general.total
                      ? (general.inProgress / general.total) * 100
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
            <strong>{general.inReview}</strong>
            <div className="indicator-progress">
              <span
                style={{
                  width: `${
                    general.total ? (general.inReview / general.total) * 100 : 0
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
            <strong>{general.completed}</strong>
            <div className="indicator-progress">
              <span
                style={{
                  width: `${
                    general.total ? (general.completed / general.total) * 100 : 0
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
            <strong>{general.progress}%</strong>
            <div className="indicator-progress">
              <span style={{ width: `${general.progress}%` }} />
            </div>
            <p>
              {general.completed} de {general.total} completadas
            </p>
          </article>
        </div>
      </div>

      <div className="indicators-panel__block">
        <h2 className="indicators-panel__title">
          Tu actividad ({currentUser?.name || 'Usuario'})
        </h2>

        <div className="taskboard-indicators taskboard-indicators--personal">
          <article className="indicator-card indicator-card--total">
            <div className="indicator-card__label">
              <UserPlus size={18} />
              <span>Actividades creadas por ti</span>
            </div>
            <strong>{personal.pctCreated}%</strong>
            <div className="indicator-progress">
              <span style={{ width: `${personal.pctCreated}%` }} />
            </div>
            <p>
              {personal.createdByUser} de {general.total} actividades
            </p>
          </article>

          <article className="indicator-card indicator-card--total">
            <div className="indicator-card__label">
              <UserCheck size={18} />
              <span>Actividades asignadas a ti</span>
            </div>
            <strong>{personal.pctAssigned}%</strong>
            <div className="indicator-progress">
              <span style={{ width: `${personal.pctAssigned}%` }} />
            </div>
            <p>
              {personal.assignedToUser} de {general.total} actividades
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
