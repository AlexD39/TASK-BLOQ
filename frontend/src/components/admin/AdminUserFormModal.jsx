import {
  useEffect,
  useState,
} from 'react';

import {
  Save,
  UserPlus,
  X,
} from 'lucide-react';

const INITIAL_FORM = {
  nombre: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
  rol: 'USUARIO',
};

export default function AdminUserFormModal({
  isOpen,
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
  }, [isOpen]);

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

  if (!isOpen) {
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

    const nombre =
      form.nombre.trim();

    const correo =
      form.correo
        .trim()
        .toLowerCase();

    if (!nombre) {
      validationErrors.nombre =
        'El nombre es obligatorio.';
    } else if (nombre.length < 3) {
      validationErrors.nombre =
        'El nombre debe tener al menos 3 caracteres.';
    } else if (nombre.length > 120) {
      validationErrors.nombre =
        'El nombre no puede superar 120 caracteres.';
    }

    if (!correo) {
      validationErrors.correo =
        'El correo es obligatorio.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        correo,
      )
    ) {
      validationErrors.correo =
        'Ingresa un correo válido.';
    }

    if (!form.contrasena) {
      validationErrors.contrasena =
        'La contraseña es obligatoria.';
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
        'Confirma la contraseña.';
    } else if (
      form.contrasena !==
      form.confirmarContrasena
    ) {
      validationErrors.confirmarContrasena =
        'Las contraseñas no coinciden.';
    }

    if (
      ![
        'ADMIN',
        'USUARIO',
      ].includes(form.rol)
    ) {
      validationErrors.rol =
        'Selecciona un rol válido.';
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
        nombre:
          form.nombre.trim(),

        correo:
          form.correo
            .trim()
            .toLowerCase(),

        contrasena:
          form.contrasena,

        rol:
          form.rol,
      });
    } catch (error) {
      setSubmitError(
        error.message ||
          'No fue posible crear la cuenta.',
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
        className="admin-user-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-modal-title"
      >
        <header className="admin-user-modal__header">
          <div>
            <span className="admin-user-modal__icon">
              <UserPlus size={22} />
            </span>

            <div>
              <h2 id="admin-user-modal-title">
                Nueva cuenta
              </h2>

              <p>
                Registra un usuario para
                acceder a TASK BLOQ.
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

            <div className="admin-user-field">
              <label htmlFor="admin-user-name">
                Nombre completo
              </label>

              <input
                id="admin-user-name"
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                maxLength={120}
                disabled={saving}
                autoFocus
              />

              {errors.nombre && (
                <small>
                  {errors.nombre}
                </small>
              )}
            </div>

            <div className="admin-user-field">
              <label htmlFor="admin-user-email">
                Correo electrónico
              </label>

              <input
                id="admin-user-email"
                name="correo"
                type="email"
                value={form.correo}
                onChange={handleChange}
                maxLength={160}
                disabled={saving}
              />

              {errors.correo && (
                <small>
                  {errors.correo}
                </small>
              )}
            </div>

            <div className="admin-user-field">
              <label htmlFor="admin-user-role">
                Rol
              </label>

              <select
                id="admin-user-role"
                name="rol"
                value={form.rol}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="USUARIO">
                  Usuario
                </option>

                <option value="ADMIN">
                  Administrador
                </option>
              </select>

              {errors.rol && (
                <small>
                  {errors.rol}
                </small>
              )}
            </div>

            <div className="admin-user-form-grid">
              <div className="admin-user-field">
                <label htmlFor="admin-user-password">
                  Contraseña
                </label>

                <input
                  id="admin-user-password"
                  name="contrasena"
                  type="password"
                  value={form.contrasena}
                  onChange={handleChange}
                  disabled={saving}
                />

                {errors.contrasena && (
                  <small>
                    {errors.contrasena}
                  </small>
                )}
              </div>

              <div className="admin-user-field">
                <label htmlFor="admin-user-confirm-password">
                  Confirmar contraseña
                </label>

                <input
                  id="admin-user-confirm-password"
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
                : 'Crear cuenta'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}