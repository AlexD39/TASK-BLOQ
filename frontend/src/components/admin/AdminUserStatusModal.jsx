import {
  useEffect,
  useState,
} from 'react';

import {
  Power,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';

export default function AdminUserStatusModal({
  isOpen,
  user,
  currentUserId,
  onClose,
  onConfirm,
}) {
  const [saving, setSaving] =
    useState(false);

  const [submitError, setSubmitError] =
    useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSaving(false);
    setSubmitError('');
  }, [
    isOpen,
    user,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

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
      document.body.style.overflow = '';

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

  if (!isOpen || !user) {
    return null;
  }

  const nextStatus =
    user.estado === 'ACTIVO'
      ? 'INACTIVO'
      : 'ACTIVO';

  const isDeactivating =
    nextStatus === 'INACTIVO';

  const isSelfDeactivation =
    isDeactivating &&
    String(user.id) ===
      String(currentUserId);

  const StatusIcon =
    isDeactivating
      ? UserX
      : UserCheck;

  async function handleConfirm() {
    if (isSelfDeactivation) {
      return;
    }

    try {
      setSaving(true);
      setSubmitError('');

      await onConfirm(nextStatus);
    } catch (error) {
      setSubmitError(
        error.message ||
          'No fue posible cambiar el estado.',
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
      className="admin-user-modal-backdrop"
      onMouseDown={handleBackdropClick}
    >
      <section
        className="admin-user-modal admin-user-modal--small"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-status-title"
      >
        <header className="admin-user-modal__header">
          <div>
            <span
              className={`admin-user-modal__icon ${
                isDeactivating
                  ? 'admin-user-modal__icon--danger'
                  : 'admin-user-modal__icon--success'
              }`}
            >
              <StatusIcon size={22} />
            </span>

            <div>
              <h2 id="admin-status-title">
                {isDeactivating
                  ? 'Desactivar cuenta'
                  : 'Activar cuenta'}
              </h2>

              <p>
                Confirma el cambio de estado.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="admin-user-modal__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar modal"
          >
            <X size={21} />
          </button>
        </header>

        <div className="admin-user-modal__body">
          {submitError && (
            <div
              className="admin-users-alert admin-users-alert--error"
              role="alert"
            >
              {submitError}
            </div>
          )}

          <div className="admin-user-modal__summary">
            <span className="admin-user-modal__summary-avatar">
              {user.nombre
                ?.charAt(0)
                .toUpperCase() || 'U'}
            </span>

            <div>
              <strong>
                {user.nombre}
              </strong>

              <small>
                {user.correo}
              </small>
            </div>
          </div>

          {isDeactivating ? (
            <div className="admin-user-modal__warning">
              <Power size={20} />

              <p>
                La cuenta dejará de tener
                acceso a TASK BLOQ y sus
                sesiones activas serán
                revocadas.
              </p>
            </div>
          ) : (
            <div className="admin-user-modal__success">
              <UserCheck size={20} />

              <p>
                La cuenta podrá iniciar
                sesión nuevamente.
              </p>
            </div>
          )}

          {isSelfDeactivation && (
            <div
              className="admin-users-alert admin-users-alert--error"
              role="alert"
            >
              No puedes desactivar tu propia
              cuenta de administrador.
            </div>
          )}
        </div>

        <footer className="admin-user-modal__footer">
          <button
            type="button"
            className="admin-user-modal__cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={
              isDeactivating
                ? 'admin-user-modal__danger-button'
                : 'admin-users-primary-button'
            }
            onClick={handleConfirm}
            disabled={
              saving ||
              isSelfDeactivation
            }
          >
            <StatusIcon size={18} />

            {saving
              ? 'Procesando...'
              : isDeactivating
                ? 'Desactivar cuenta'
                : 'Activar cuenta'}
          </button>
        </footer>
      </section>
    </div>
  );
}