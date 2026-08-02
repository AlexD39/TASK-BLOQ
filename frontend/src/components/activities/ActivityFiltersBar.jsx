import {
  Filter,
  RotateCcw,
  User,
  UserCheck,
} from 'lucide-react';

export const INITIAL_ACTIVITY_FILTERS = {
  creadorId: '',
  responsableId: '',
  estatus: '',
  prioridad: '',
  fechaLimite: '',
  soloCreadasPorMi: false,
  soloAsignadasAMi: false,
};

export function hasActiveFilters(filters) {
  return (
    Boolean(filters.creadorId) ||
    Boolean(filters.responsableId) ||
    Boolean(filters.estatus) ||
    Boolean(filters.prioridad) ||
    Boolean(filters.fechaLimite) ||
    filters.soloCreadasPorMi ||
    filters.soloAsignadasAMi
  );
}

export function applyActivityFilters(
  activities,
  filters,
  currentUserId,
) {
  return activities.filter((activity) => {
    if (
      filters.creadorId &&
      String(activity.idCreador) !==
        String(filters.creadorId)
    ) {
      return false;
    }

    if (
      filters.responsableId &&
      String(activity.idResponsable) !==
        String(filters.responsableId)
    ) {
      return false;
    }

    if (
      filters.estatus &&
      activity.estatus !== filters.estatus
    ) {
      return false;
    }

    if (
      filters.prioridad &&
      activity.prioridad !== filters.prioridad
    ) {
      return false;
    }

    if (filters.fechaLimite) {
      const activityDate =
        typeof activity.fechaLimite === 'string'
          ? activity.fechaLimite.slice(0, 10)
          : '';

      if (activityDate !== filters.fechaLimite) {
        return false;
      }
    }

    if (
      filters.soloCreadasPorMi &&
      String(activity.idCreador) !==
        String(currentUserId)
    ) {
      return false;
    }

    if (
      filters.soloAsignadasAMi &&
      String(activity.idResponsable) !==
        String(currentUserId)
    ) {
      return false;
    }

    return true;
  });
}

export default function ActivityFiltersBar({
  filters,
  onChange,
  onReset,
  users = [],
  resultCount = 0,
  totalCount = 0,
}) {
  function handleFieldChange(event) {
    const { name, value } = event.target;

    onChange(name, value);
  }

  function handleToggleChange(event) {
    const { name, checked } = event.target;

    onChange(name, checked);
  }

  const filtersAreActive = hasActiveFilters(filters);

  return (
    <section
      className="activity-filters"
      aria-label="Filtros de actividades"
    >
      <div className="activity-filters__header">
        <div className="activity-filters__title">
          <Filter size={18} strokeWidth={1.9} />
          <span>Filtros</span>
        </div>

        <span className="activity-filters__count">
          Mostrando {resultCount} de {totalCount}{' '}
          actividades
        </span>
      </div>

      <div className="activity-filters__row">
        <div className="activity-filters__field">
          <label htmlFor="filter-creadorId">
            Creador
          </label>

          <select
            id="filter-creadorId"
            name="creadorId"
            value={filters.creadorId}
            onChange={handleFieldChange}
          >
            <option value="">Todos</option>

            {users.map((availableUser) => (
              <option
                key={availableUser.id}
                value={availableUser.id}
              >
                {availableUser.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="activity-filters__field">
          <label htmlFor="filter-responsableId">
            Responsable
          </label>

          <select
            id="filter-responsableId"
            name="responsableId"
            value={filters.responsableId}
            onChange={handleFieldChange}
          >
            <option value="">Todos</option>

            {users.map((availableUser) => (
              <option
                key={availableUser.id}
                value={availableUser.id}
              >
                {availableUser.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="activity-filters__field">
          <label htmlFor="filter-estatus">
            Estatus
          </label>

          <select
            id="filter-estatus"
            name="estatus"
            value={filters.estatus}
            onChange={handleFieldChange}
          >
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">
              En proceso
            </option>
            <option value="EN_REVISION">
              En revisión
            </option>
            <option value="COMPLETADA">
              Completada
            </option>
          </select>
        </div>

        <div className="activity-filters__field">
          <label htmlFor="filter-prioridad">
            Prioridad
          </label>

          <select
            id="filter-prioridad"
            name="prioridad"
            value={filters.prioridad}
            onChange={handleFieldChange}
          >
            <option value="">Todas</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
        </div>

        <div className="activity-filters__field">
          <label htmlFor="filter-fechaLimite">
            Fecha límite
          </label>

          <input
            id="filter-fechaLimite"
            name="fechaLimite"
            type="date"
            value={filters.fechaLimite}
            onChange={handleFieldChange}
          />
        </div>

        <button
          type="button"
          className="activity-filters__reset"
          onClick={onReset}
          disabled={!filtersAreActive}
        >
          <RotateCcw size={16} strokeWidth={1.9} />
          Limpiar filtros
        </button>
      </div>

      <div className="activity-filters__row activity-filters__row--toggles">
        <label className="activity-filters__toggle">
          <input
            type="checkbox"
            name="soloCreadasPorMi"
            checked={filters.soloCreadasPorMi}
            onChange={handleToggleChange}
          />

          <User size={16} strokeWidth={1.9} />
          Creadas por mí
        </label>

        <label className="activity-filters__toggle">
          <input
            type="checkbox"
            name="soloAsignadasAMi"
            checked={filters.soloAsignadasAMi}
            onChange={handleToggleChange}
          />

          <UserCheck size={16} strokeWidth={1.9} />
          Asignadas a mí
        </label>
      </div>
    </section>
  );
}