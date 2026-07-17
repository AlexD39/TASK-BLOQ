import {
  useEffect,
  useState,
} from 'react';

import {
  CalendarDays,
  Save,
  UserRound,
  X,
} from 'lucide-react';

import {
  validateActivityField,
  validateActivityForm,
} from '../../utils/activityValidation.js';

import '../../styles/activity-modal.css';

const INITIAL_FORM = {
  titulo: '',
  descripcion: '',
  fechaLimite: '',
  prioridad: '',
  estatus: 'PENDIENTE',
};

const INITIAL_TOUCHED = {
  titulo: false,
  descripcion: false,
  fechaLimite: false,
  prioridad: false,
  estatus: false,
};

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

function ActivityFormModal({
  isOpen,
  onClose,
  onSubmit,
}) {
  const [form, setForm] =
    useState(INITIAL_FORM);

  const [errors, setErrors] =
    useState({});

  const [touched, setTouched] =
    useState(INITIAL_TOUCHED);

  const [saving, setSaving] =
    useState(false);

  const [submitError, setSubmitError] =
    useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(INITIAL_FORM);
    setErrors({});
    setTouched(INITIAL_TOUCHED);
    setSubmitError('');
    setSaving(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

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
  }, [isOpen, onClose, saving]);

  if (!isOpen) {
    return null;
  }

  function handleChange(event) {
    const { name, value } =
      event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setTouched((currentTouched) => ({
      ...currentTouched,
      [name]: true,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: validateActivityField(
        name,
        value,
      ),
    }));

    setSubmitError('');
  }

  function handleBlur(event) {
    const { name, value } =
      event.target;

    setTouched((currentTouched) => ({
      ...currentTouched,
      [name]: true,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: validateActivityField(
        name,
        value,
      ),
    }));
  }

  function hasError(fieldName) {
    return Boolean(
      touched[fieldName] &&
      errors[fieldName],
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitError('');

    const cleanData = {
      titulo: form.titulo.trim(),
      descripcion:
        form.descripcion.trim(),
      fechaLimite:
        form.fechaLimite,
      prioridad:
        form.prioridad,
      estatus:
        form.estatus,
    };

    const formErrors =
      validateActivityForm(cleanData);

    setTouched({
      titulo: true,
      descripcion: true,
      fechaLimite: true,
      prioridad: true,
      estatus: true,
    });

    setErrors(formErrors);

    if (
      Object.keys(formErrors).length > 0
    ) {
      setSubmitError(
        'Revisa los campos marcados antes de guardar.',
      );

      const firstInvalidField =
        Object.keys(formErrors)[0];

      window.setTimeout(() => {
        document
          .querySelector(
            `[name="${firstInvalidField}"]`,
          )
          ?.focus();
      }, 0);

      return;
    }

    try {
      setSaving(true);

      await onSubmit?.(cleanData);
    } catch (error) {
      setSubmitError(
        error.message ||
          'No fue posible registrar la actividad.',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleBackdropClick(event) {
    if (
      event.target ===
        event.currentTarget &&
      !saving
    ) {
      onClose();
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
        aria-labelledby="activity-modal-title"
      >
        <header className="activity-modal__header">
          <h2 id="activity-modal-title">
            Nueva actividad
          </h2>

          <button
            type="button"
            className="activity-modal__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar formulario"
          >
            <X
              size={22}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>
        </header>

        <form
          className="activity-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="activity-form__body">
            {submitError && (
              <div
                className="activity-form-error"
                role="alert"
              >
                {submitError}
              </div>
            )}

            <div
              className={`activity-field ${
                hasError('titulo')
                  ? 'activity-field--error'
                  : ''
              }`}
            >
              <label htmlFor="titulo">
                Título <span>*</span>
              </label>

              <input
                id="titulo"
                name="titulo"
                type="text"
                value={form.titulo}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nombre de la actividad académica"
                maxLength={180}
                aria-invalid={
                  hasError('titulo')
                }
                aria-describedby={
                  hasError('titulo')
                    ? 'titulo-error'
                    : undefined
                }
                autoFocus
              />

              {hasError('titulo') && (
                <p
                  id="titulo-error"
                  className="activity-field__error"
                >
                  {errors.titulo}
                </p>
              )}
            </div>

            <div
              className={`activity-field ${
                hasError('descripcion')
                  ? 'activity-field--error'
                  : ''
              }`}
            >
              <label htmlFor="descripcion">
                Descripción
              </label>

              <textarea
                id="descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Describe el objetivo y alcance de esta actividad..."
                rows={4}
                maxLength={1000}
                aria-invalid={
                  hasError('descripcion')
                }
                aria-describedby={
                  hasError('descripcion')
                    ? 'descripcion-error'
                    : undefined
                }
              />

              <div className="activity-field__meta">
                <span>
                  {form.descripcion.length}/1000
                </span>
              </div>

              {hasError('descripcion') && (
                <p
                  id="descripcion-error"
                  className="activity-field__error"
                >
                  {errors.descripcion}
                </p>
              )}
            </div>

            <div className="activity-field">
              <label htmlFor="responsable">
                Responsable
              </label>

              <div className="activity-input-icon">
                <UserRound
                  size={20}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />

                <input
                  id="responsable"
                  type="text"
                  value="Sin asignar"
                  disabled
                  aria-label="Responsable sin asignar"
                />
              </div>
            </div>

            <div className="activity-form__row">
              <div
                className={`activity-field ${
                  hasError('fechaLimite')
                    ? 'activity-field--error'
                    : ''
                }`}
              >
                <label htmlFor="fechaLimite">
                  Fecha límite <span>*</span>
                </label>

                <div className="activity-input-icon">
                  <CalendarDays
                    size={20}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />

                  <input
                    id="fechaLimite"
                    name="fechaLimite"
                    type="date"
                    value={form.fechaLimite}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={
                      hasError(
                        'fechaLimite',
                      )
                    }
                    aria-describedby={
                      hasError(
                        'fechaLimite',
                      )
                        ? 'fecha-error'
                        : undefined
                    }
                  />
                </div>

                {hasError(
                  'fechaLimite',
                ) && (
                  <p
                    id="fecha-error"
                    className="activity-field__error"
                  >
                    {errors.fechaLimite}
                  </p>
                )}
              </div>

              <div
                className={`activity-field ${
                  hasError('prioridad')
                    ? 'activity-field--error'
                    : ''
                }`}
              >
                <label htmlFor="prioridad">
                  Prioridad <span>*</span>
                </label>

                <select
                  id="prioridad"
                  name="prioridad"
                  value={form.prioridad}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={
                    hasError('prioridad')
                  }
                  aria-describedby={
                    hasError('prioridad')
                      ? 'prioridad-error'
                      : undefined
                  }
                >
                  <option value="">
                    Seleccionar...
                  </option>

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

                {hasError('prioridad') && (
                  <p
                    id="prioridad-error"
                    className="activity-field__error"
                  >
                    {errors.prioridad}
                  </p>
                )}
              </div>
            </div>

            <fieldset
              className={`activity-status ${
                hasError('estatus')
                  ? 'activity-status--error'
                  : ''
              }`}
            >
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

              {hasError('estatus') && (
                <p className="activity-field__error">
                  {errors.estatus}
                </p>
              )}
            </fieldset>
          </div>

          <footer className="activity-form__footer">
            <button
              type="submit"
              className="activity-button activity-button--primary"
              disabled={saving}
            >
              <Save
                size={20}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              {saving
                ? 'Guardando...'
                : 'Guardar actividad'}
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

export default ActivityFormModal;