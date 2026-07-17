import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Save,
  UserRound,
  X,
} from 'lucide-react';

import '../../styles/activity-modal.css';

const INITIAL_FORM = {
  titulo: '',
  descripcion: '',
  responsable: '',
  fechaLimite: '',
  prioridad: '',
  estatus: 'PENDIENTE',
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
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit?.({
      ...form,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      responsable: form.responsable.trim(),
    });
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
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
        >
          <div className="activity-form__body">
            <div className="activity-field">
              <label htmlFor="titulo">
                Título <span>*</span>
              </label>

              <input
                id="titulo"
                name="titulo"
                type="text"
                value={form.titulo}
                onChange={handleChange}
                placeholder="Nombre de la actividad académica"
                autoFocus
                required
              />
            </div>

            <div className="activity-field">
              <label htmlFor="descripcion">
                Descripción
              </label>

              <textarea
                id="descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Describe el objetivo y alcance de esta actividad..."
                rows={4}
              />
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
  name="responsable"
  type="text"
  value="Sin asignar"
  disabled
  aria-label="Responsable sin asignar"
/>
              </div>
            </div>

            <div className="activity-form__row">
              <div className="activity-field">
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
                    required
                  />
                </div>
              </div>

              <div className="activity-field">
                <label htmlFor="prioridad">
                  Prioridad <span>*</span>
                </label>

                <select
                  id="prioridad"
                  name="prioridad"
                  value={form.prioridad}
                  onChange={handleChange}
                  required
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
              </div>
            </div>

            <fieldset className="activity-status">
              <legend>
                Estatus <span>*</span>
              </legend>

              <div className="activity-status__grid">
                {STATUS_OPTIONS.map((status) => (
                  <label
                    key={status.value}
                    className={`activity-status__option ${
                      form.estatus === status.value
                        ? 'activity-status__option--selected'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="estatus"
                      value={status.value}
                      checked={
                        form.estatus === status.value
                      }
                      onChange={handleChange}
                    />

                    <span className="activity-status__radio" />

                    <span>{status.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <footer className="activity-form__footer">
            <button
              type="submit"
              className="activity-button activity-button--primary"
            >
              <Save
                size={20}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              Guardar actividad
            </button>

            <button
              type="button"
              className="activity-button activity-button--secondary"
              onClick={onClose}
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