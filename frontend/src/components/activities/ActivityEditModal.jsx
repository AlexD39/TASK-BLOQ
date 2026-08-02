import {
  useEffect,
  useState,
} from 'react';

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Link,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  Send,
  UserRound,
  X,
  XCircle,
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
import EvidenceRejectModal from './EvidenceRejectModal.jsx';
import EvidenceResubmitModal from './EvidenceResubmitModal.jsx';

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
  onCommentCreated = null,
  onCreateEvidence = null,
  onReviewEvidence = null,
  onResubmitEvidence = null,
  users = [],
  canAssignResponsible = true,
}) {
  
const [form, setForm] = useState({
  titulo: '',
  descripcion: '',
  idResponsable: '',
  fechaLimite: '',
  prioridad: '',
  estatus: '',
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

const canManageResponsible =
  isCreator &&
  canAssignResponsible;

const canAddEvidence =
  isResponsible &&
  activity?.estatus === 'EN_PROCESO';

const canReviewEvidence =
  isCreator &&
  activity?.estatus === 'EN_REVISION';

const evidences =
  Array.isArray(activity?.evidencias)
    ? activity.evidencias
    : [];

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

const [sendingComment, setSendingComment] =
  useState(false);

const [
  newEvidence,
  setNewEvidence,
] = useState({
  enlace: '',
  descripcion: '',
});

const [
  evidenceSaving,
  setEvidenceSaving,
] = useState(false);

const [
  evidenceError,
  setEvidenceError,
] = useState('');

const [
  reviewingEvidenceId,
  setReviewingEvidenceId,
] = useState(null);

const [
  evidenceToReject,
  setEvidenceToReject,
] = useState(null);

const [
  evidenceToResubmit,
  setEvidenceToResubmit,
] = useState(null);

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

  if (
    !isOpen ||
    !activity?.id ||
    !canViewComments
  ) {
    return undefined;
  }

  setComments([]);
  setNewComment('');

  async function loadComments() {
    try {
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
        setSubmitError(
          error.message ||
            'No fue posible cargar los comentarios.',
        );
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
  if (!isOpen || !activity?.id) {
    return;
  }

  setForm({
    titulo:
      activity.titulo || '',

    descripcion:
      activity.descripcion || '',

    idResponsable:
      activity.idResponsable != null
        ? String(
            activity.idResponsable,
          )
        : '',

    fechaLimite:
      normalizeDate(
        activity.fechaLimite,
      ),

    prioridad:
      activity.prioridad || '',

    estatus:
      activity.estatus || '',
  });

  setNewEvidence({
    enlace: '',
    descripcion: '',
  });

  setEvidenceError('');
  setEvidenceToReject(null);
  setEvidenceToResubmit(null);

  setErrors({});
  setTouched(INITIAL_TOUCHED);
  setSubmitError('');
  setSaving(false);
}, [
  isOpen,
  activity?.id,
  activity?.estatus,
]);

useEffect(() => {
  if (!isOpen) {
    return undefined;
  }

  const previousOverflow =
    document.body.style.overflow;

  function handleKeyDown(event) {
    if (
      event.key === 'Escape' &&
      !saving
    ) {
      onClose();
    }
  }

  document.body.style.overflow =
    'hidden';

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
  saving,
  onClose,
]);

if (
  !isOpen ||
  !activity?.id
) {
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

function handleStatusChange(event) {
  const nextStatus =
    event.target.value;

  setForm((currentForm) => ({
    ...currentForm,
    estatus: nextStatus,
  }));

  setTouched((currentTouched) => ({
    ...currentTouched,
    estatus: true,
  }));

  setErrors((currentErrors) => ({
    ...currentErrors,
    estatus: '',
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

  setCommentsError('');
  setSubmitError('');

  if (!cleanComment) {
    return;
  }

  if (cleanComment.length > 1000) {
    setCommentsError(
      'El comentario no puede superar 1000 caracteres.',
    );

    return;
  }

  try {
    setSendingComment(true);

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
        result.totalComentarios ??
          comments.length + 1,
      );
    }
  } catch (error) {
    setCommentsError(
      error.message ||
        'No fue posible agregar el comentario.',
    );
  } finally {
    setSendingComment(false);
  }
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);

    return [
      'http:',
      'https:',
    ].includes(url.protocol);
  } catch {
    return false;
  }
}

async function handleCreateEvidence() {
  const cleanEvidence = {
    enlace:
      newEvidence.enlace.trim(),

    descripcion:
      newEvidence.descripcion.trim(),
  };

  setEvidenceError('');

  if (
    !cleanEvidence.enlace ||
    !isValidHttpUrl(
      cleanEvidence.enlace,
    )
  ) {
    setEvidenceError(
      'Ingresa un enlace HTTP o HTTPS válido.',
    );

    return;
  }

  if (
    cleanEvidence.descripcion.length >
    1000
  ) {
    setEvidenceError(
      'La descripción no puede superar 1000 caracteres.',
    );

    return;
  }

  if (
    typeof onCreateEvidence !==
    'function'
  ) {
    setEvidenceError(
      'La función para registrar evidencias no está conectada.',
    );

    return;
  }

  try {
    setEvidenceSaving(true);

    await onCreateEvidence(
      activity.id,
      cleanEvidence,
    );

    setNewEvidence({
      enlace: '',
      descripcion: '',
    });
  } catch (error) {
    setEvidenceError(
      error.message ||
        'No fue posible registrar la evidencia.',
    );
  } finally {
    setEvidenceSaving(false);
  }
}

async function handleApproveEvidence(
  evidence,
) {
  setEvidenceError('');

  if (
    typeof onReviewEvidence !==
    'function'
  ) {
    setEvidenceError(
      'La función para revisar evidencias no está conectada.',
    );

    return;
  }

  try {
    setReviewingEvidenceId(
      evidence.id,
    );

    await onReviewEvidence(
      evidence.id,
      {
        estado: 'APROBADA',
        observacion: '',
      },
    );
  } catch (error) {
    setEvidenceError(
      error.message ||
        'No fue posible aprobar la evidencia.',
    );
  } finally {
    setReviewingEvidenceId(null);
  }
}

function formatEvidenceDate(value) {
  return formatCommentDate(value);
}

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitError('');

const cleanData = {
  titulo: form.titulo.trim(),
  descripcion:
    form.descripcion.trim(),

    ...(canManageResponsible
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
};

const isSendingToReview =
  activity.estatus === 'EN_PROCESO' &&
  cleanData.estatus === 'EN_REVISION';

if (
  isSendingToReview &&
  evidences.length === 0
) {
  setSubmitError(
    'Agrega al menos una evidencia antes de enviar la actividad a revisión.',
  );

  return;
}

if (
  isSendingToReview &&
  evidences.some(
    (evidence) =>
      evidence.estado === 'RECHAZADA',
  )
) {
  setSubmitError(
    'Corrige y reenvía todas las evidencias rechazadas.',
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
  <>
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

{canViewComments && (
  <section className="activity-comments">
    <header className="activity-comments__header">
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
    </header>

    {commentsError && (
      <div
        className="activity-comments__error"
        role="alert"
      >
        {commentsError}
      </div>
    )}

    <div className="activity-comments__list">
      {commentsLoading ? (
        <div className="activity-comments__empty">
          <MessageSquare
            size={26}
            strokeWidth={1.5}
          />

          <span>
            Cargando comentarios...
          </span>
        </div>
      ) : comments.length === 0 ? (
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

                <time>
                  {formatCommentDate(
                    comment.creadoEn,
                  )}
                </time>
              </div>

              <p>
                {comment.comentario}
              </p>
            </div>
          </article>
        ))
      )}
    </div>

    {canComment ? (
      <div className="activity-comments__form">
        <input
          type="text"
          value={newComment}
          onChange={(event) => {
            setNewComment(
              event.target.value,
            );

            setCommentsError('');
          }}
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
    ) : (
      <div className="activity-comments__notice">
        Solo el creador o el responsable pueden
        agregar comentarios.
      </div>
    )}
  </section>
)}

<section className="activity-evidence-section">
  <header className="activity-evidence-section__header">
    <div>
      <h3>
        Evidencias
      </h3>

      <p>
        Archivos y enlaces entregados por
        el responsable.
      </p>
    </div>

    <span className="activity-evidence-count">
      {evidences.length}
    </span>
  </header>

  {evidenceError && (
    <div
      className="activity-form-error"
      role="alert"
    >
      {evidenceError}
    </div>
  )}

  <div className="activity-evidence-cards">
    {evidences.length === 0 ? (
      <div className="activity-evidence-empty">
        Todavía no se han registrado
        evidencias.
      </div>
    ) : (
      evidences.map((evidence) => (
        <article
          className="activity-evidence-card"
          key={evidence.id}
        >
          <header>
            <div>
              <strong>
                Evidencia #{evidence.id}
              </strong>

              <span
                className={`activity-evidence-status activity-evidence-status--${String(
                  evidence.estado ||
                    'PENDIENTE',
                ).toLowerCase()}`}
              >
                {evidence.estado ===
                'APROBADA'
                  ? 'Aprobada'
                  : evidence.estado ===
                      'RECHAZADA'
                    ? 'Rechazada'
                    : 'Pendiente'}
              </span>
            </div>

            <a
              href={evidence.enlace}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={17} />
              Abrir
            </a>
          </header>

          {evidence.descripcion && (
            <p className="activity-evidence-description">
              {evidence.descripcion}
            </p>
          )}

          <div className="activity-evidence-meta">
            <span>
              Enviada por{' '}
              <strong>
                {evidence.enviadoPor ||
                  'Usuario'}
              </strong>
            </span>

            <time>
              {formatEvidenceDate(
                evidence.creadoEn,
              )}
            </time>
          </div>

          {evidence.revisor && (
            <div className="activity-evidence-review">
              <div>
                {evidence.estado ===
                'APROBADA' ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <XCircle size={18} />
                )}

                <span>
                  Revisada por{' '}
                  <strong>
                    {evidence.revisor}
                  </strong>
                </span>
              </div>

              <time>
                {formatEvidenceDate(
                  evidence.revisadoEn,
                )}
              </time>
            </div>
          )}

          {evidence.observacionRevision && (
            <div className="evidence-rejection-observation">
              <strong>
                Observación del creador
              </strong>

              <p>
                {
                  evidence
                    .observacionRevision
                }
              </p>
            </div>
          )}

          {canReviewEvidence &&
            evidence.estado ===
              'PENDIENTE' && (
              <footer className="activity-evidence-actions">
                <button
                  type="button"
                  className="activity-evidence-approve"
                  onClick={() =>
                    handleApproveEvidence(
                      evidence,
                    )
                  }
                  disabled={
                    reviewingEvidenceId ===
                    evidence.id
                  }
                >
                  <CheckCircle2 size={17} />

                  {reviewingEvidenceId ===
                  evidence.id
                    ? 'Aprobando...'
                    : 'Aprobar'}
                </button>

                <button
                  type="button"
                  className="activity-evidence-reject"
                  onClick={() =>
                    setEvidenceToReject(
                      evidence,
                    )
                  }
                >
                  <XCircle size={17} />
                  Rechazar
                </button>
              </footer>
            )}

          {isResponsible &&
            activity.estatus ===
              'EN_PROCESO' &&
            evidence.estado ===
              'RECHAZADA' && (
              <footer className="activity-evidence-actions">
                <button
                  type="button"
                  className="activity-evidence-resubmit"
                  onClick={() =>
                    setEvidenceToResubmit(
                      evidence,
                    )
                  }
                >
                  <RotateCcw size={17} />
                  Corregir y reenviar
                </button>
              </footer>
            )}
        </article>
      ))
    )}
  </div>

  {canAddEvidence && (
    <div className="activity-evidence-create">
      <div>
        <Plus size={19} />

        <strong>
          Agregar evidencia
        </strong>
      </div>

      <label>
        <span>
          Enlace *
        </span>

        <div className="activity-input-icon">
          <Link size={19} />

          <input
            type="url"
            value={newEvidence.enlace}
            onChange={(event) =>
              setNewEvidence(
                (currentEvidence) => ({
                  ...currentEvidence,
                  enlace:
                    event.target.value,
                }),
              )
            }
            disabled={evidenceSaving}
            placeholder="https://..."
          />
        </div>
      </label>

      <label>
        <span>
          Descripción
        </span>

        <textarea
          value={
            newEvidence.descripcion
          }
          onChange={(event) =>
            setNewEvidence(
              (currentEvidence) => ({
                ...currentEvidence,
                descripcion:
                  event.target.value,
              }),
            )
          }
          rows={3}
          maxLength={1000}
          disabled={evidenceSaving}
          placeholder="Describe brevemente la evidencia"
        />
      </label>

      <button
        type="button"
        className="activity-evidence-create__button"
        onClick={handleCreateEvidence}
        disabled={evidenceSaving}
      >
        <Plus size={18} />

        {evidenceSaving
          ? 'Registrando...'
          : 'Registrar evidencia'}
      </button>
    </div>
  )}

  {!canAddEvidence &&
    isResponsible &&
    activity.estatus !==
      'EN_PROCESO' && (
      <div className="activity-evidence-info">
        <Clock3 size={18} />

        Las evidencias se registran cuando
        la actividad está En proceso.
      </div>
    )}
</section>



            <div className="activity-field">
              <label htmlFor="edit-idResponsable">
                Responsable
              </label>

              <div className="activity-input-icon">
                <UserRound
                  size={20}
                  strokeWidth={1.7}
                />

                {canManageResponsible ? (
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

              {!canManageResponsible && (
  <small className="activity-field__help">
    {isCreator
      ? 'No tienes permiso para cambiar al responsable.'
      : 'Solo el creador puede cambiar al responsable.'}
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
  onChange={handleStatusChange}
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

    <EvidenceRejectModal
      isOpen={Boolean(
        evidenceToReject,
      )}
      evidence={evidenceToReject}
      onClose={() =>
        setEvidenceToReject(null)
      }
      onSubmit={async (
        observation,
      ) => {
if (
  !evidenceToReject ||
  typeof onReviewEvidence !==
    'function'
) {
  setEvidenceError(
    'La función para revisar evidencias no está conectada.',
  );

  return;
}

        await onReviewEvidence(
          evidenceToReject.id,
          {
            estado: 'RECHAZADA',
            observacion: observation,
          },
        );

        setEvidenceToReject(null);
      }}
    />

    <EvidenceResubmitModal
      isOpen={Boolean(
        evidenceToResubmit,
      )}
      evidence={evidenceToResubmit}
      onClose={() =>
        setEvidenceToResubmit(null)
      }
      onSubmit={async (
        evidenceData,
      ) => {
if (
  !evidenceToResubmit ||
  typeof onResubmitEvidence !==
    'function'
) {
  setEvidenceError(
    'La función para reenviar evidencias no está conectada.',
  );

  return;
}

        await onResubmitEvidence(
          evidenceToResubmit.id,
          evidenceData,
        );

        setEvidenceToResubmit(null);
      }}
    />
  </>
);
}