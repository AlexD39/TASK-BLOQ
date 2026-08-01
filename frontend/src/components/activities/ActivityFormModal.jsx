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
  idResponsable: '',
  fechaLimite: '',
  prioridad: '',
  estatus: 'PENDIENTE',
};

const INITIAL_TOUCHED = {
  titulo: false,
  descripcion: false,
  idResponsable: false,
  fechaLimite: false,
  prioridad: false,
};

function ActivityFormModal({
  isOpen,
  onClose,
  onSubmit,
  users = [],
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
      idResponsable:
        form.idResponsable || null,
      fechaLimite:
        form.fechaLimite,
      prioridad:
        form.prioridad,
      estatus: 'PENDIENTE',
    };

    const formErrors =
      validateActivityForm(cleanData);

    setTouched({
  titulo: true,
  descripcion: true,
  idResponsable: true,
  fechaLimite: true,
  prioridad: true,
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
              <label htmlFor="idResponsable">
                Responsable
              </label>

              <div className="activity-input-icon">
                <UserRound
                  size={20}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />

                <select
                  id="idResponsable"
                  name="idResponsable"
                  value={form.idResponsable}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="">
                    Sin asignar
                  </option>

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
            <div className="activity-field">
  <small className="activity-field__help">
    La actividad se registrará inicialmente
    con el estatus Pendiente.
  </small>
</div>
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