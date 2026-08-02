import {
  useEffect,
  useState,
} from 'react';

import {
  KeyRound,
  Save,
  X,
} from 'lucide-react';

const INITIAL_FORM = {
  contrasena: '',
  confirmarContrasena: '',
};

export default function AdminUserPasswordModal({
  isOpen,
  user,
  onClose,
  onSubmit,
}) {
  const [form, setForm] =
    useState(INITIAL_FORM);

  const [errors, setErrors] =
    useState({});

  const [submitError, setSubmitError] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitError('');
    setSaving(false);
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

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
    }));

    setSubmitError('');
  }

  function validateForm() {
    const validationErrors = {};

    if (!form.contrasena) {
      validationErrors.contrasena =
        'La nueva contraseña es obligatoria.';
    } else if (
      form.contrasena.length < 8
    ) {
      validationErrors.contrasena =
        'La contraseña debe tener al menos 8 caracteres.';
    } else if (
      form.contrasena.length > 72
    ) {
      validationErrors.contrasena =
        'La contraseña no puede superar 72 caracteres.';
    }

    if (!form.confirmarContrasena) {
      validationErrors.confirmarContrasena =
        'Confirma la nueva contraseña.';
    } else if (
      form.contrasena !==
      form.confirmarContrasena
    ) {
      validationErrors.confirmarContrasena =
        'Las contraseñas no coinciden.';
    }

    return validationErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors =
      validateForm();

    setErrors(validationErrors);
    setSubmitError('');

    if (
      Object.keys(validationErrors)
        .length > 0
    ) {
      return;
    }

    try {
      setSaving(true);

      await onSubmit({
        contrasena:
          form.contrasena,

        confirmarContrasena:
          form.confirmarContrasena,
      });
    } catch (error) {
      setSubmitError(
        error.message ||
          'No fue posible restablecer la contraseña.',
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
        aria-labelledby="admin-password-title"
      >
        <header className="admin-user-modal__header">
          <div>
            <span className="admin-user-modal__icon">
              <KeyRound size={22} />
            </span>

            <div>
              <h2 id="admin-password-title">
                Restablecer contraseña
              </h2>

              <p>
                Asigna una contraseña nueva
                para esta cuenta.
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

        <form
          onSubmit={handleSubmit}
          noValidate
        >
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

            <div className="admin-user-field">
              <label htmlFor="admin-new-password">
                Nueva contraseña
              </label>

              <input
                id="admin-new-password"
                name="contrasena"
                type="password"
                value={form.contrasena}
                onChange={handleChange}
                disabled={saving}
                autoFocus
              />

              {errors.contrasena && (
                <small>
                  {errors.contrasena}
                </small>
              )}
            </div>

            <div className="admin-user-field">
              <label htmlFor="admin-confirm-new-password">
                Confirmar contraseña
              </label>

              <input
                id="admin-confirm-new-password"
                name="confirmarContrasena"
                type="password"
                value={
                  form.confirmarContrasena
                }
                onChange={handleChange}
                disabled={saving}
              />

              {errors.confirmarContrasena && (
                <small>
                  {
                    errors.confirmarContrasena
                  }
                </small>
              )}
            </div>

            <div className="admin-user-modal__warning">
              <KeyRound size={20} />

              <p>
                Al restablecerla se cerrarán
                las sesiones anteriores del
                usuario.
              </p>
            </div>
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
              type="submit"
              className="admin-users-primary-button"
              disabled={saving}
            >
              <Save size={18} />

              {saving
                ? 'Guardando...'
                : 'Restablecer contraseña'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}