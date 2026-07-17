import {
  useEffect,
  useState,
} from 'react';

import {
  CalendarDays,
  Link,
  MessageSquare,
  Plus,
  Save,
  Send,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';

import {
  validateActivityField,
  validateActivityForm,
} from '../../utils/activityValidation.js';

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

const INITIAL_TOUCHED = {
  titulo: false,
  descripcion: false,
  fechaLimite: false,
  prioridad: false,
  estatus: false,
};

function normalizeDate(dateValue) {
  if (
    typeof dateValue !== 'string'
  ) {
    return '';
  }

  return dateValue.slice(0, 10);
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
  estatus: '',
  evidencias: [''],
});

  const [errors, setErrors] =
    useState({});

  const [touched, setTouched] =
    useState(INITIAL_TOUCHED);

  const [saving, setSaving] =
    useState(false);

  const [submitError, setSubmitError] =
    useState('');

  const [comments, setComments] =
  useState([]);

const [newComment, setNewComment] =
  useState('');

const [sendingComment, setSendingComment] =
  useState(false);


  useEffect(() => {
    if (!isOpen || !activity) {
      return;
    }

    setForm({
  titulo: activity.titulo || '',
  descripcion: activity.descripcion || '',
  fechaLimite: normalizeDate(
    activity.fechaLimite,
  ),
  prioridad: activity.prioridad || '',
  estatus: activity.estatus || '',

  evidencias:
  Array.isArray(activity.evidencias) &&
  activity.evidencias.length > 0
    ? activity.evidencias.map(
        (evidencia) =>
          typeof evidencia === 'string'
            ? evidencia
            : evidencia.enlace || '',
      )
    : [''],
    
});

setComments(
  Array.isArray(activity.comentariosDetalle)
    ? activity.comentariosDetalle
    : [],
);

setNewComment('');

    setErrors({});
    setTouched(INITIAL_TOUCHED);
    setSubmitError('');
    setSaving(false);
  }, [isOpen, activity]);

  useEffect(() => {
    if (!isOpen || !activity) {
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
  }, [
    isOpen,
    activity,
    saving,
    onClose,
  ]);

  if (!isOpen || !activity) {
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

  function handleEvidenceChange(
  evidenceIndex,
  value,
) {
  setForm((currentForm) => ({
    ...currentForm,

    evidencias:
      currentForm.evidencias.map(
        (evidencia, index) =>
          index === evidenceIndex
            ? value
            : evidencia,
      ),
  }));

  setSubmitError('');
}

function handleAddEvidence() {
  setForm((currentForm) => ({
    ...currentForm,

    evidencias: [
      ...currentForm.evidencias,
      '',
    ],
  }));
}

function handleRemoveEvidence(
  evidenceIndex,
) {
  setForm((currentForm) => {
    const updatedEvidences =
      currentForm.evidencias.filter(
        (_, index) =>
          index !== evidenceIndex,
      );

    return {
      ...currentForm,

      evidencias:
        updatedEvidences.length > 0
          ? updatedEvidences
          : [''],
    };
  });
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

  function handleBackdropClick(event) {
    if (
      event.target ===
        event.currentTarget &&
      !saving
    ) {
      onClose();
    }
  }

  async function handleAddComment() {
  const cleanComment =
    newComment.trim();

  if (!cleanComment) {
    return;
  }

  try {
    setSendingComment(true);

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL ||
        'http://localhost:3001/api'
      }/activities/${activity.id}/comments`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${localStorage.getItem(
              'accessToken',
            )}`,
        },

        body: JSON.stringify({
          comentario: cleanComment,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(
        data.message ||
          'No fue posible agregar el comentario.',
      );
    }

    setComments((currentComments) => [
      ...currentComments,
      data.comentario,
    ]);

    setNewComment('');
  } catch (error) {
    setSubmitError(error.message);
  } finally {
    setSendingComment(false);
  }
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
      evidencias: form.evidencias
  .map((evidencia) =>
    evidencia.trim(),
  )
  .filter(Boolean),  
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

      await onSubmit(
        activity.id,
        cleanData,
      );
    } catch (error) {
      setSubmitError(
        error.message ||
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
              <label htmlFor="edit-titulo">
                Título <span>*</span>
              </label>

              <input
                id="edit-titulo"
                name="titulo"
                type="text"
                value={form.titulo}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={180}
                aria-invalid={
                  hasError('titulo')
                }
                autoFocus
              />

              {hasError('titulo') && (
                <p className="activity-field__error">
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
              <label htmlFor="edit-descripcion">
                Descripción
              </label>

              <textarea
                id="edit-descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
                maxLength={1000}
                placeholder="Descripción de la actividad"
                aria-invalid={
                  hasError('descripcion')
                }
              />

              <div className="activity-field__meta">
                <span>
                  {form.descripcion.length}/1000
                </span>
              </div>

              {hasError('descripcion') && (
                <p className="activity-field__error">
                  {errors.descripcion}
                </p>
              )}
            </div>

<div className="activity-comments">
  <div className="activity-comments__header">
    <div className="activity-comments__title">
      <MessageSquare
        size={20}
        strokeWidth={1.8}
      />

      <strong>Comentarios</strong>

      <span className="activity-comments__count">
        {comments.length}
      </span>
    </div>
  </div>

  <div className="activity-comments__list">
    {comments.length === 0 ? (
      <div className="activity-comments__empty">
        <MessageSquare
          size={26}
          strokeWidth={1.5}
        />

        <span>
          Sin comentarios registrados
        </span>
      </div>
    ) : (
      comments.map((comment) => (
        <article
          className="activity-comment"
          key={comment.id}
        >
          <div className="activity-comment__avatar">
            {comment.usuario
              ?.split(' ')
              .map((word) => word[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'U'}
          </div>

          <div className="activity-comment__content">
            <div className="activity-comment__top">
              <strong>
                {comment.usuario || 'Usuario'}
              </strong>

              <span>
                {comment.creadoEn
                  ? new Date(
                      comment.creadoEn,
                    ).toLocaleDateString(
                      'es-MX',
                      {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      },
                    )
                  : ''}
              </span>
            </div>

            <p>{comment.comentario}</p>
          </div>
        </article>
      ))
    )}
  </div>

  <div className="activity-comments__form">
    <input
      type="text"
      value={newComment}
      onChange={(event) =>
        setNewComment(event.target.value)
      }
      placeholder="Escribe un comentario..."
      maxLength={1000}
      disabled={sendingComment}
      onKeyDown={(event) => {
        if (
          event.key === 'Enter' &&
          !event.shiftKey
        ) {
          event.preventDefault();
          handleAddComment();
        }
      }}
    />

    <button
      type="button"
      onClick={handleAddComment}
      disabled={
        sendingComment ||
        !newComment.trim()
      }
      aria-label="Enviar comentario"
    >
      <Send size={20} />
    </button>
  </div>
</div>

            <div className="activity-field">
  <div className="activity-evidence-header">
    <label>
      Evidencias
    </label>

    <button
      type="button"
      className="activity-evidence-add"
      onClick={handleAddEvidence}
      disabled={saving}
    >
      <Plus size={17} />
      Agregar evidencia
    </button>
  </div>

  <div className="activity-evidence-list">
    {form.evidencias.map(
      (evidencia, index) => (
        <div
          className="activity-evidence-item"
          key={index}
        >
          <div className="activity-input-icon">
            <Link
              size={20}
              strokeWidth={1.7}
            />

            <input
              type="url"
              value={evidencia}
              onChange={(event) =>
                handleEvidenceChange(
                  index,
                  event.target.value,
                )
              }
              placeholder="https://ejemplo.com/evidencia"
              disabled={saving}
            />
          </div>

          <button
            type="button"
            className="activity-evidence-remove"
            onClick={() =>
              handleRemoveEvidence(index)
            }
            disabled={saving}
            aria-label="Eliminar evidencia"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    )}
  </div>

  <small className="activity-field__help">
    Puedes agregar enlaces a documentos,
    imágenes o archivos de evidencia.
  </small>
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
              <div
                className={`activity-field ${
                  hasError('fechaLimite')
                    ? 'activity-field--error'
                    : ''
                }`}
              >
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
                    onBlur={handleBlur}
                    aria-invalid={
                      hasError(
                        'fechaLimite',
                      )
                    }
                  />
                </div>

                {hasError(
                  'fechaLimite',
                ) && (
                  <p className="activity-field__error">
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
                <label htmlFor="edit-prioridad">
                  Prioridad <span>*</span>
                </label>

                <select
                  id="edit-prioridad"
                  name="prioridad"
                  value={form.prioridad}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={
                    hasError('prioridad')
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
                  <p className="activity-field__error">
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