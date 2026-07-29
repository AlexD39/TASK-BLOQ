import {
  useEffect,
  useState,
} from 'react';
import {
  CalendarDays,
  Link,
  MessageCircle,
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

import {
  createActivityComment,
  getActivityComments,
} from '../../services/activities.service.js';

import '../../styles/activity-modal.css';


function getAllowedStatuses({
  currentStatus,
  isCreator,
  isResponsible,
}) {
  const options = [
    {
      value: currentStatus,
      label: {
        PENDIENTE: 'Pendiente',
        EN_PROCESO: 'En proceso',
        EN_REVISION: 'En revisión',
        COMPLETADA: 'Completada',
      }[currentStatus] || currentStatus,
    },
  ];

  if (
    isResponsible &&
    currentStatus === 'PENDIENTE'
  ) {
    options.push({
      value: 'EN_PROCESO',
      label: 'Iniciar actividad',
    });
  }

  if (
    isResponsible &&
    currentStatus === 'EN_PROCESO'
  ) {
    options.push({
      value: 'EN_REVISION',
      label: 'Enviar a revisión',
    });
  }

  if (
    isCreator &&
    currentStatus === 'EN_REVISION'
  ) {
    options.push(
      {
        value: 'EN_PROCESO',
        label: 'Devolver a proceso',
      },
      {
        value: 'COMPLETADA',
        label: 'Completar actividad',
      },
    );
  }

  return options;
}

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

function formatCommentDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function ActivityEditModal({
  isOpen,
  activity,
  currentUser,
  onClose,
  onSubmit,
  onCommentCreated,
  users = [],
  canAssignResponsible = false,
}) {
  
const [form, setForm] = useState({
  titulo: '',
  descripcion: '',
  idResponsable: '',
  fechaLimite: '',
  prioridad: '',
  estatus: '',
  evidencias: [''],
});

const currentUserId =
  Number(currentUser?.id);

const isCreator =
  Number(activity?.idCreador) ===
  currentUserId;

const isResponsible =
  Number(activity?.idResponsable) ===
  currentUserId;

const canEditGeneralFields =
  isCreator;

const canEditEvidence =
  isCreator ||
  isResponsible;

const allowedStatuses =
  getAllowedStatuses({
    currentStatus:
      activity?.estatus || '',
    isCreator,
    isResponsible,
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

const [commentsLoading, setCommentsLoading] =
  useState(false);

const [commentsError, setCommentsError] =
  useState('');

const [newComment, setNewComment] =
  useState('');

const [commentSaving, setCommentSaving] =
  useState(false);

const isAdmin =
  currentUser?.role === 'ADMIN';

const canViewComments =
  isCreator ||
  isResponsible ||
  isAdmin;

const canComment =
  isCreator ||
  isResponsible;


useEffect(() => {
  let componentIsMounted = true;

  if (!isOpen || !activity?.id) {
    return undefined;
  }

  setComments([]);
  setNewComment('');
  setCommentsError('');

  if (!canViewComments) {
  return undefined;
}


  async function loadComments() {
    try {
      setCommentsLoading(true);

      const result =
        await getActivityComments(
          activity.id,
        );

      if (componentIsMounted) {
        setComments(
          Array.isArray(result.comentarios)
            ? result.comentarios
            : [],
        );
      }
    } catch (error) {
      if (componentIsMounted) {
        setCommentsError(
          error.message ||
            'No fue posible cargar los comentarios.',
        );
      }
    } finally {
      if (componentIsMounted) {
        setCommentsLoading(false);
      }
    }
  }

  loadComments();

  return () => {
    componentIsMounted = false;
  };
}, [
  isOpen,
  activity?.id,
  canViewComments,
]);

  useEffect(() => {
    if (!isOpen || !activity) {
      return;
    }

    setForm({
  titulo: activity.titulo || '',
  descripcion: activity.descripcion || '',
  idResponsable:
    activity.idResponsable != null
      ? String(activity.idResponsable)
      : '',
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

async function handleCreateComment() {
  const cleanComment =
    newComment.trim();

  setCommentsError('');

  if (!cleanComment) {
    setCommentsError(
      'Escribe un comentario antes de enviarlo.',
    );

    return;
  }

  if (cleanComment.length > 1000) {
    setCommentsError(
      'El comentario no puede superar 1000 caracteres.',
    );

    return;
  }

  try {
    setCommentSaving(true);

    const result =
      await createActivityComment(
        activity.id,
        {
          comentario: cleanComment,
        },
      );

    setComments((currentComments) => [
      ...currentComments,
      result.comentario,
    ]);

    setNewComment('');

    if (
      typeof onCommentCreated ===
      'function'
    ) {
      onCommentCreated(
        activity.id,
        result.totalComentarios,
      );
    }
  } catch (error) {
    setCommentsError(
      error.message ||
        'No fue posible registrar el comentario.',
    );
  } finally {
    setCommentSaving(false);
  }
}

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitError('');

const cleanData = {
  titulo: form.titulo.trim(),
  descripcion:
    form.descripcion.trim(),

  ...(canAssignResponsible
    ? {
        idResponsable:
          form.idResponsable || null,
      }
    : {}),

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

const isSendingToReview =
  activity.estatus === 'EN_PROCESO' &&
  cleanData.estatus === 'EN_REVISION';

if (
  isSendingToReview &&
  cleanData.evidencias.length === 0
) {
  setSubmitError(
    'Agrega al menos una evidencia antes de enviar la actividad a revisión.',
  );

  return;
}

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
  disabled={
    saving ||
    !canEditGeneralFields
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
  disabled={
    saving ||
    !canEditGeneralFields
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

<section className="activity-comments">
  <div className="activity-comments__header">
    <div>
      <h3>
        <MessageCircle size={19} />
        Comentarios
      </h3>

      <p>
        Seguimiento entre el creador y el
        responsable.
      </p>
    </div>

    <span className="activity-comments__count">
      {comments.length}
    </span>
  </div>

  {!canViewComments ? (
  <div className="activity-comments__empty">
    No tienes permiso para consultar los
    comentarios de esta actividad.
  </div>
) : (
    <>
      <div className="activity-comments__list">
        {commentsLoading && (
          <div className="activity-comments__empty">
            Cargando comentarios...
          </div>
        )}

        {!commentsLoading &&
          comments.length === 0 && (
            <div className="activity-comments__empty">
              Todavía no hay comentarios.
            </div>
          )}

        {!commentsLoading &&
          comments.map((comment) => (
            <article
              className="activity-comment"
              key={comment.id}
            >
              <div className="activity-comment__avatar">
                {String(
                  comment.autor || 'U',
                )
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="activity-comment__content">
                <div className="activity-comment__meta">
                  <strong>
                    {comment.autor ||
                      'Usuario'}
                  </strong>

                  <time>
                    {formatCommentDate(
                      comment.creadoEn,
                    )}
                  </time>
                </div>

                <p>{comment.comentario}</p>
              </div>
            </article>
          ))}
      </div>

      {commentsError && (
        <p
          className="activity-comments__error"
          role="alert"
        >
          {commentsError}
        </p>
      )}

      {canComment ? (
  <div className="activity-comments__composer">
    <textarea
      value={newComment}
      onChange={(event) => {
        setNewComment(
          event.target.value,
        );

        setCommentsError('');
      }}
      rows={3}
      maxLength={1000}
      placeholder="Escribe un comentario..."
      disabled={
        commentSaving || saving
      }
    />

    <div className="activity-comments__composer-footer">
      <span>
        {newComment.length}/1000
      </span>

      <button
        type="button"
        onClick={handleCreateComment}
        disabled={
          commentSaving ||
          saving ||
          !newComment.trim()
        }
      >
        <Send size={17} />

        {commentSaving
          ? 'Enviando...'
          : 'Comentar'}
      </button>
    </div>
  </div>
) : (
  <div className="activity-comments__readonly">
    Vista administrativa de solo lectura.
  </div>
)}

    </>
  )}
</section>

            <div className="activity-field">
  <div className="activity-evidence-header">
    <label>
      Evidencias
    </label>

    <button
      type="button"
      className="activity-evidence-add"
      onClick={handleAddEvidence}
      disabled={
  saving ||
  !canEditEvidence
}
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
              disabled={
  saving ||
  !canEditEvidence
}
            />
          </div>

          <button
            type="button"
            className="activity-evidence-remove"
            onClick={() =>
              handleRemoveEvidence(index)
            }
            disabled={
  saving ||
  !canEditEvidence
}
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
              <label htmlFor="edit-idResponsable">
                Responsable
              </label>

              <div className="activity-input-icon">
                <UserRound
                  size={20}
                  strokeWidth={1.7}
                />

                {canAssignResponsible ? (
                  <select
                    id="edit-idResponsable"
                    name="idResponsable"
                    value={form.idResponsable}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={saving}
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
                ) : (
                  <input
                    type="text"
                    value={
                      activity.responsable ||
                      'Sin asignar'
                    }
                    disabled
                  />
                )}
              </div>

              {canAssignResponsible && (
                <small className="activity-field__help">
                  Solo el creador puede cambiar 
                  al responsable.
                </small>
              )}
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
    hasError('fechaLimite')
  }
  disabled={
    saving ||
    !canEditGeneralFields
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
  disabled={
    saving ||
    !canEditGeneralFields
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
    {allowedStatuses.map((status) => (
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
          disabled={saving}
        />

        <span className="activity-status__radio" />

        <span>{status.label}</span>
      </label>
    ))}
  </div>

  {!isCreator && !isResponsible && (
    <small className="activity-field__help">
      No participas en esta actividad, por lo
      que no puedes cambiar su estatus.
    </small>
  )}

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