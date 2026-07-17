import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Save,
  UserRound,
  X,
} from 'lucide-react';

import '../../styles/activity-modal.css';

const STATUS_OPTIONS = [
  {
    value: 'PENDIENTE',
    label: 'Pendiente',
  },
  {
    value: 'EN_PROCESO',
    label: 'En proceso',
  },
  {
    value: 'EN_REVISION',
    label: 'En revisión',
  },
  {
    value: 'COMPLETADA',
    label: 'Completada',
  },
];

function normalizeDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  if (typeof dateValue === 'string') {
    return dateValue.slice(0, 10);
  }

  return '';
}

export default function ActivityEditModal({
  isOpen,
  activity,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    fechaLimite: '',
    prioridad: '',
    estatus: 'PENDIENTE',
  });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!isOpen || !activity) {
      return undefined;
    }

    setForm({
      titulo: activity.titulo || '',
      descripcion: activity.descripcion || '',
      fechaLimite: normalizeDate(
        activity.fechaLimite,
      ),
      prioridad:
        activity.prioridad || 'MEDIA',
      estatus:
        activity.estatus || 'PENDIENTE',
    });

    setError('');

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (
        event.key === 'Escape' &&
        !saving
      ) {
        onClose();
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [
    isOpen,
    activity,
    onClose,
    saving,
  ]);

  if (!isOpen || !activity) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleBackdropClick(event) {
    if (
      event.target === event.currentTarget &&
      !saving
    ) {
      onClose();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    const cleanData = {
      titulo: form.titulo.trim(),
      descripcion:
        form.descripcion.trim(),
      fechaLimite: form.fechaLimite,
      prioridad: form.prioridad,
      estatus: form.estatus,
    };

    if (
      !cleanData.titulo ||
      !cleanData.fechaLimite ||
      !cleanData.prioridad ||
      !cleanData.estatus
    ) {
      setError(
        'Completa todos los campos obligatorios.',
      );

      return;
    }

    try {
      setSaving(true);

      await onSubmit(
        activity.id,
        cleanData,
      );
    } catch (submitError) {
      setError(
        submitError.message ||
          'No fue posible actualizar la actividad.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="activity-modal-backdrop"
      onMouseDown={handleBackdropClick}
    >
      <section
        className="activity-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-activity-title"
      >
        <header className="activity-modal__header">
          <h2 id="edit-activity-title">
            Editar actividad
          </h2>

          <button
            type="button"
            className="activity-modal__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar edición"
          >
            <X
              size={22}
              strokeWidth={1.8}
            />
          </button>
        </header>

        <form
          className="activity-form"
          onSubmit={handleSubmit}
        >
          <div className="activity-form__body">
            {error && (
              <div
                className="activity-form-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="activity-field">
              <label htmlFor="edit-titulo">
                Título <span>*</span>
              </label>

              <input
                id="edit-titulo"
                name="titulo"
                type="text"
                value={form.titulo}
                onChange={handleChange}
                maxLength={180}
                required
                autoFocus
              />
            </div>

            <div className="activity-field">
              <label htmlFor="edit-descripcion">
                Descripción
              </label>

              <textarea
                id="edit-descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows={4}
                placeholder="Descripción de la actividad"
              />
            </div>

            <div className="activity-field">
              <label>
                Responsable
              </label>

              <div className="activity-input-icon">
                <UserRound
                  size={20}
                  strokeWidth={1.7}
                />

                <input
                  type="text"
                  value={
                    activity.responsable ||
                    'Sin asignar'
                  }
                  disabled
                />
              </div>
            </div>

            <div className="activity-form__row">
              <div className="activity-field">
                <label htmlFor="edit-fecha">
                  Fecha límite <span>*</span>
                </label>

                <div className="activity-input-icon">
                  <CalendarDays
                    size={20}
                    strokeWidth={1.7}
                  />

                  <input
                    id="edit-fecha"
                    name="fechaLimite"
                    type="date"
                    value={form.fechaLimite}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="activity-field">
                <label htmlFor="edit-prioridad">
                  Prioridad <span>*</span>
                </label>

                <select
                  id="edit-prioridad"
                  name="prioridad"
                  value={form.prioridad}
                  onChange={handleChange}
                  required
                >
                  <option value="ALTA">
                    Alta
                  </option>

                  <option value="MEDIA">
                    Media
                  </option>

                  <option value="BAJA">
                    Baja
                  </option>
                </select>
              </div>
            </div>

            <fieldset className="activity-status">
              <legend>
                Estatus <span>*</span>
              </legend>

              <div className="activity-status__grid">
                {STATUS_OPTIONS.map(
                  (status) => (
                    <label
                      key={status.value}
                      className={`activity-status__option ${
                        form.estatus ===
                        status.value
                          ? 'activity-status__option--selected'
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="estatus"
                        value={status.value}
                        checked={
                          form.estatus ===
                          status.value
                        }
                        onChange={handleChange}
                      />

                      <span className="activity-status__radio" />

                      <span>
                        {status.label}
                      </span>
                    </label>
                  ),
                )}
              </div>
            </fieldset>
          </div>

          <footer className="activity-form__footer">
            <button
              type="submit"
              className="activity-button activity-button--primary"
              disabled={saving}
            >
              <Save size={20} />

              {saving
                ? 'Guardando...'
                : 'Guardar cambios'}
            </button>

            <button
              type="button"
              className="activity-button activity-button--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}