import {
  useEffect,
  useState,
  useRef,
} from 'react';
import {
  AlertCircle,
  CalendarDays,
  ExternalLink,
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
} from '../../utils/activityValidation.js';

import '../../styles/activity-modal.css';

function getAllowedStatuses() {
  return [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'EN_PROCESO', label: 'En proceso' },
    { value: 'EN_REVISION', label: 'En revisión' },
    { value: 'COMPLETADA', label: 'Completada' },
  ];
}

const INITIAL_TOUCHED = {
  titulo: false,
  descripcion: false,
  fechaLimite: false,
  prioridad: false,
  estatus: false,
};

function normalizeDate(dateValue) {
  if (typeof dateValue !== 'string') {
    return '';
  }
  return dateValue.slice(0, 10);
}

function formatCommentDate(dateValue) {
  if (!dateValue) {
    return 'Ahora';
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'Ahora';
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
  canAssignResponsible = true,
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

  const currentUserId = currentUser?.idUsuario || currentUser?.id;
  const isCreator =
    activity &&
    (Number(activity.idCreador) === currentUserId ||
      Number(activity.id_creador) === currentUserId);

  const isResponsible =
    activity &&
    (Number(activity.idResponsable) === currentUserId ||
      Number(activity.id_responsable) === currentUserId);

  const isAdmin = currentUser?.rol === 'ADMIN';

  const isUserAjeno = !isCreator && !isResponsible && !isAdmin;
  const canEditGeneralFields = (isCreator || isAdmin) && !isUserAjeno;
  const canEditStatus = (isCreator || isResponsible || isAdmin) && !isUserAjeno;
  const canEditEvidence = (isCreator || isResponsible || isAdmin) && !isUserAjeno;

  const allowedStatuses = getAllowedStatuses();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(INITIAL_TOUCHED);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Referencia para rastrear la última actividad cargada y evitar reseteos involuntarios
  const activeActivityIdRef = useRef(null);

  const currentActivityId = activity?.id || activity?.id_actividad;

  // EFECTO PRINCIPAL DE CARGA (Con la solución de persistencia de comentarios intacta)
  useEffect(() => {
    if (!isOpen || !activity) {
      return;
    }

    const isNewActivitySelected = activeActivityIdRef.current !== currentActivityId;

    setForm({
      titulo: activity.titulo || '',
      descripcion: activity.descripcion || '',
      idResponsable:
        activity.idResponsable != null
          ? String(activity.idResponsable)
          : activity.id_responsable != null
          ? String(activity.id_responsable)
          : '',
      fechaLimite: normalizeDate(
        activity.fechaLimite || activity.fecha_limite,
      ),
      prioridad: activity.prioridad || '',
      estatus: activity.estatus
        ? String(activity.estatus).toUpperCase().replace(/\s+/g, '_')
        : 'PENDIENTE',

      evidencias:
        Array.isArray(activity.evidencias) && activity.evidencias.length > 0
          ? activity.evidencias.map((evidencia) =>
              typeof evidencia === 'string'
                ? evidencia
                : evidencia.enlace || '',
            )
          : [''],
    });

    setErrors({});
    setSubmitError('');

    // Solo restablecemos los comentarios si abrimos una actividad DIFERENTE
    if (isNewActivitySelected) {
      activeActivityIdRef.current = currentActivityId;
      setNewComment('');
      setCommentError('');

      const rawComments = Array.isArray(activity.comentariosDetalle)
        ? activity.comentariosDetalle
        : Array.isArray(activity.comentarios)
        ? activity.comentarios
        : [];

      setComments(rawComments);
    }

    // CONSULTAR COMENTARIOS ACTUALIZADOS DESDE LA BASE DE DATOS
    async function fetchFreshComments() {
      if (!currentActivityId) return;

      try {
        setLoadingComments(true);
        const token =
          sessionStorage.getItem('task_bloq_access_token') ||
          localStorage.getItem('task_bloq_access_token') ||
          currentUser?.token ||
          currentUser?.accessToken;

        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
          }/activities/${currentActivityId}/comments`,
          { headers }
        );

        if (response.ok) {
          const data = await response.json();
          const fetchedComments =
            data.comentarios ||
            data.comments ||
            data.data ||
            (Array.isArray(data) ? data : []);

          if (Array.isArray(fetchedComments) && fetchedComments.length >= 0) {
            setComments(fetchedComments);
            if (onCommentCreated) {
              onCommentCreated(currentActivityId, fetchedComments);
            }
          }
        }
      } catch (err) {
        console.error('Error al sincronizar comentarios con el servidor:', err);
      } finally {
        setLoadingComments(false);
      }
    }

    fetchFreshComments();
  }, [isOpen, currentActivityId]);

  useEffect(() => {
    if (!isOpen || !activity) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !saving) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, activity, saving, onClose]);

  if (!isOpen || !activity) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;

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
      [name]: validateActivityField(name, value),
    }));

    setSubmitError('');
  }

  function handleEvidenceChange(evidenceIndex, value) {
    setForm((currentForm) => ({
      ...currentForm,
      evidencias: currentForm.evidencias.map((evidencia, index) =>
        index === evidenceIndex ? value : evidencia,
      ),
    }));
    setSubmitError('');
  }

  function handleAddEvidence() {
    setForm((currentForm) => ({
      ...currentForm,
      evidencias: [...currentForm.evidencias, ''],
    }));
  }

  function handleRemoveEvidence(evidenceIndex) {
    setForm((currentForm) => {
      const updatedEvidences = currentForm.evidencias.filter(
        (_, index) => index !== evidenceIndex,
      );

      return {
        ...currentForm,
        evidencias: updatedEvidences.length > 0 ? updatedEvidences : [''],
      };
    });
  }

  function handleBlur(event) {
    const { name, value } = event.target;

    setTouched((currentTouched) => ({
      ...currentTouched,
      [name]: true,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: validateActivityField(name, value),
    }));
  }

  function hasError(fieldName) {
    return Boolean(touched[fieldName] && errors[fieldName]);
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && !saving) {
      onClose();
    }
  }

  // AGREGAR COMENTARIO CON PERSISTENCIA INMEDIATA (Intacto)
  async function handleAddComment() {
    setCommentError('');
    const cleanComment = newComment.trim();

    if (!cleanComment) {
      setCommentError('El comentario no puede estar vacío.');
      return;
    }

    try {
      setSendingComment(true);
      const targetId = activity.id || activity.id_actividad;

      const token =
        sessionStorage.getItem('task_bloq_access_token') ||
        localStorage.getItem('task_bloq_access_token') ||
        currentUser?.token ||
        currentUser?.accessToken;

      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        }/activities/${targetId}/comments`,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            comentario: cleanComment,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'No fue posible agregar el comentario.',
        );
      }

      const returned = data.comentario || data.comment || data.data || data;

      const createdComment = {
        id: returned?.id || returned?.id_comentario || Date.now(),
        comentario:
          typeof returned === 'string'
            ? returned
            : returned?.comentario || returned?.contenido || cleanComment,
        usuario:
          returned?.usuario ||
          currentUser?.nombre ||
          currentUser?.name ||
          currentUser?.nombre_completo ||
          'Usuario',
        creadoEn:
          returned?.creadoEn ||
          returned?.creado_en ||
          returned?.fecha_creacion ||
          new Date().toISOString(),
      };

      const updatedCommentsList = [...comments, createdComment];
      
      setComments(updatedCommentsList);

      if (onCommentCreated) {
        onCommentCreated(targetId, updatedCommentsList);
      }

      setNewComment('');
      setCommentError('');
    } catch (error) {
      const msg = error.message || 'Error al enviar comentario.';
      setCommentError(msg);
    } finally {
      setSendingComment(false);
    }
  }

  // GUARDAR CAMBIOS GENERALES DE LA ACTIVIDAD
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');

    if (isUserAjeno) {
      const mensajeDenegado =
        'Acceso denegado: No puedes modificar esta actividad porque no eres el creador ni el responsable asignado.';
      setSubmitError(mensajeDenegado);
      alert(`⛔ ${mensajeDenegado}`);
      return;
    }

    const cleanEvidences = form.evidencias
      .map((evidencia) =>
        typeof evidencia === 'string' ? evidencia.trim() : '',
      )
      .filter(Boolean);

    const cleanEstatus = form.estatus
      ? String(form.estatus).toUpperCase().trim()
      : 'PENDIENTE';

    // 🔴 REGLA DE LA NUEVA HU (CA04): Exigir evidencia o comentario si se marca como COMPLETADA
    if (cleanEstatus === 'COMPLETADA') {
      const tieneEvidencia = cleanEvidences.length > 0;
      const tieneComentarios = comments.length > 0 || newComment.trim().length > 0;

      if (!tieneEvidencia && !tieneComentarios) {
        const mensajeRegla =
          'Para marcar la actividad como "Completada", debes registrar al menos un enlace de evidencia o escribir una nota/comentario de cierre.';
        setSubmitError(mensajeRegla);
        return;
      }
    }

    const targetResponsable = form.idResponsable
      ? Number(form.idResponsable)
      : null;

    const cleanData = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      idResponsable: targetResponsable,
      id_responsable: targetResponsable,
      fechaLimite: form.fechaLimite,
      fecha_limite: form.fechaLimite,
      prioridad: form.prioridad,
      estatus: cleanEstatus,
      evidencias: cleanEvidences,
      comentarios: comments,
      comentariosDetalle: comments,
    };

    try {
      setSaving(true);
      const targetId = activity.id || activity.id_actividad;

      if (onSubmit) {
        await onSubmit(targetId, cleanData);
      }
    } catch (error) {
      console.error('Error al actualizar la actividad:', error);
      const errorMsg =
        error.message ||
        'Acceso denegado o no fue posible actualizar la actividad.';
      setSubmitError(errorMsg);
      alert(`⛔ ${errorMsg}`);
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
          <h2 id="edit-activity-title">Editar actividad</h2>

          <button
            type="button"
            className="activity-modal__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar edición"
          >
            <X size={22} strokeWidth={1.8} />
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
                hasError('titulo') ? 'activity-field--error' : ''
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
                aria-invalid={hasError('titulo')}
                disabled={saving || !canEditGeneralFields}
                autoFocus
              />

              {hasError('titulo') && (
                <p className="activity-field__error">{errors.titulo}</p>
              )}
            </div>

            <div
              className={`activity-field ${
                hasError('descripcion') ? 'activity-field--error' : ''
              }`}
            >
              <label htmlFor="edit-descripcion">Descripción</label>

              <textarea
                id="edit-descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
                maxLength={1000}
                placeholder="Descripción de la actividad"
                aria-invalid={hasError('descripcion')}
                disabled={saving || !canEditGeneralFields}
              />

              <div className="activity-field__meta">
                <span>{form.descripcion.length}/1000</span>
              </div>

              {hasError('descripcion') && (
                <p className="activity-field__error">{errors.descripcion}</p>
              )}
            </div>

            {/* SECCIÓN DE COMENTARIOS INTACTA */}
            <div className="activity-comments">
              <div className="activity-comments__header">
                <div className="activity-comments__title">
                  <MessageSquare size={20} strokeWidth={1.8} />

                  <strong>Comentarios / Notas de seguimiento</strong>

                  <span className="activity-comments__count">
                    {comments.length}
                  </span>
                </div>
              </div>

              <div
                className="activity-comments__list"
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {loadingComments && comments.length === 0 ? (
                  <div className="activity-comments__empty">
                    <span>Cargando comentarios...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="activity-comments__empty">
                    <MessageSquare size={26} strokeWidth={1.5} />

                    <span>Sin notas o comentarios registrados</span>
                  </div>
                ) : (
                  comments.map((commentItem, index) => {
                    const textContent =
                      typeof commentItem === 'string'
                        ? commentItem
                        : commentItem?.comentario ||
                          commentItem?.contenido ||
                          commentItem?.texto ||
                          '';

                    const userName =
                      typeof commentItem === 'string'
                        ? currentUser?.nombre || 'Usuario'
                        : commentItem?.usuario ||
                          commentItem?.nombreUsuario ||
                          currentUser?.nombre ||
                          'Usuario';

                    const dateVal =
                      typeof commentItem === 'string'
                        ? new Date().toISOString()
                        : commentItem?.creadoEn ||
                          commentItem?.creado_en ||
                          commentItem?.fecha_creacion;

                    const userInitials = (userName || 'U')
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <article
                        className="activity-comment"
                        key={commentItem?.id || index}
                        style={{ marginBottom: '10px' }}
                      >
                        <div className="activity-comment__avatar">
                          {userInitials}
                        </div>

                        <div className="activity-comment__content">
                          <div className="activity-comment__top">
                            <strong>{userName}</strong>
                            <span>{formatCommentDate(dateVal)}</span>
                          </div>

                          <p>{textContent}</p>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              <div
                className="activity-comments__form-wrapper"
                style={{ marginTop: '12px' }}
              >
                <div className="activity-comments__form">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(event) => {
                      setNewComment(event.target.value);
                      if (commentError) setCommentError('');
                    }}
                    placeholder="Escribe una nota de seguimiento..."
                    maxLength={1000}
                    disabled={sendingComment}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={sendingComment}
                    aria-label="Enviar comentario"
                    title="Guardar comentario"
                  >
                    <Send size={20} />
                  </button>
                </div>

                {commentError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#ef4444',
                      fontSize: '0.8125rem',
                      marginTop: '6px',
                      fontWeight: 500,
                    }}
                    role="alert"
                  >
                    <AlertCircle size={14} />
                    <span>{commentError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* EVIDENCIAS (Manteniendo tu estructura original + botón para abrir el enlace CA03) */}
            <div className="activity-field">
              <div className="activity-evidence-header">
                <label>Evidencias</label>

                <button
                  type="button"
                  className="activity-evidence-add"
                  onClick={handleAddEvidence}
                  disabled={saving || !canEditEvidence}
                >
                  <Plus size={17} />
                  Agregar evidencia
                </button>
              </div>

              <div className="activity-evidence-list">
                {form.evidencias.map((evidencia, index) => {
                  const isValidUrl =
                    typeof evidencia === 'string' &&
                    (evidencia.startsWith('http://') || evidencia.startsWith('https://'));

                  return (
                    <div
                      className="activity-evidence-item"
                      key={index}
                    >
                      <div className="activity-input-icon">
                        <Link size={20} strokeWidth={1.7} />

                        <input
                          type="url"
                          value={evidencia}
                          onChange={(event) =>
                            handleEvidenceChange(index, event.target.value)
                          }
                          placeholder="https://ejemplo.com/evidencia"
                          disabled={saving || !canEditEvidence}
                        />
                      </div>

                      {/* Botón para abrir el enlace externamente si es válido (CA03) */}
                      {isValidUrl && (
                        <a
                          href={evidencia}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="activity-evidence-remove"
                          title="Abrir evidencia en pestaña nueva"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            color: '#2563eb',
                          }}
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}

                      <button
                        type="button"
                        className="activity-evidence-remove"
                        onClick={() => handleRemoveEvidence(index)}
                        disabled={saving || !canEditEvidence}
                        aria-label="Eliminar evidencia"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <small className="activity-field__help">
                Puedes agregar enlaces a documentos, imágenes o archivos de
                evidencia.
              </small>
            </div>

            <div className="activity-field">
              <label htmlFor="edit-idResponsable">Responsable</label>

              <div className="activity-input-icon">
                <UserRound size={20} strokeWidth={1.7} />

                {canAssignResponsible && canEditGeneralFields ? (
                  <select
                    id="edit-idResponsable"
                    name="idResponsable"
                    value={form.idResponsable}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={saving || !canEditGeneralFields}
                  >
                    <option value="">Sin asignar</option>

                    {users.map((availableUser) => (
                      <option
                        key={availableUser.id}
                        value={availableUser.id}
                      >
                        {availableUser.nombre || availableUser.nombre_completo}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={activity.responsable || 'Sin asignar'}
                    disabled
                  />
                )}
              </div>
            </div>

            <div className="activity-form__row">
              <div
                className={`activity-field ${
                  hasError('fechaLimite') ? 'activity-field--error' : ''
                }`}
              >
                <label htmlFor="edit-fecha">
                  Fecha límite <span>*</span>
                </label>

                <div className="activity-input-icon">
                  <CalendarDays size={20} strokeWidth={1.7} />

                  <input
                    id="edit-fecha"
                    name="fechaLimite"
                    type="date"
                    value={form.fechaLimite}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={hasError('fechaLimite')}
                    disabled={saving || !canEditGeneralFields}
                  />
                </div>

                {hasError('fechaLimite') && (
                  <p className="activity-field__error">
                    {errors.fechaLimite}
                  </p>
                )}
              </div>

              <div
                className={`activity-field ${
                  hasError('prioridad') ? 'activity-field--error' : ''
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
                  aria-invalid={hasError('prioridad')}
                  disabled={saving || !canEditGeneralFields}
                >
                  <option value="">Seleccionar...</option>

                  <option value="ALTA">Alta</option>

                  <option value="MEDIA">Media</option>

                  <option value="BAJA">Baja</option>
                </select>

                {hasError('prioridad') && (
                  <p className="activity-field__error">{errors.prioridad}</p>
                )}
              </div>
            </div>

            <fieldset
              className={`activity-status ${
                hasError('estatus') ? 'activity-status--error' : ''
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
                    } ${
                      !canEditStatus
                        ? 'activity-status__option--disabled'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="estatus"
                      value={status.value}
                      checked={form.estatus === status.value}
                      onChange={handleChange}
                      disabled={saving || !canEditStatus}
                    />

                    <span className="activity-status__radio" />

                    <span>{status.label}</span>
                  </label>
                ))}
              </div>

              {hasError('estatus') && (
                <p className="activity-field__error">{errors.estatus}</p>
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

              {saving ? 'Guardando...' : 'Guardar cambios'}
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