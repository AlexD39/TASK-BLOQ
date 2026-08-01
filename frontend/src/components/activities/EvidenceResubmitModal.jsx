import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  RotateCcw,
  X,
} from 'lucide-react';

export default function EvidenceResubmitModal({
  isOpen,
  evidence,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    enlace: '',
    descripcion: '',
  });

  const [error, setError] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!isOpen || !evidence) {
      return;
    }

    setForm({
      enlace:
        evidence.enlace || '',

      descripcion:
        evidence.descripcion || '',
    });

    setError('');
    setSaving(false);
  }, [
    isOpen,
    evidence,
  ]);

  if (!isOpen || !evidence) {
    return null;
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

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanData = {
      enlace:
        form.enlace.trim(),

      descripcion:
        form.descripcion.trim(),
    };

    setError('');

    if (
      !cleanData.enlace ||
      !isValidHttpUrl(
        cleanData.enlace,
      )
    ) {
      setError(
        'Ingresa un enlace HTTP o HTTPS válido.',
      );

      return;
    }

    if (
      cleanData.descripcion.length > 1000
    ) {
      setError(
        'La descripción no puede superar 1000 caracteres.',
      );

      return;
    }

    try {
      setSaving(true);

      await onSubmit(cleanData);
    } catch (requestError) {
      setError(
        requestError.message ||
          'No fue posible reenviar la evidencia.',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleBackdrop(event) {
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
      className="evidence-action-backdrop"
      onMouseDown={handleBackdrop}
    >
      <section
        className="evidence-action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resubmit-evidence-title"
      >
        <header className="evidence-action-modal__header">
          <div>
            <span className="evidence-action-modal__icon">
              <RotateCcw size={22} />
            </span>

            <div>
              <h2 id="resubmit-evidence-title">
                Corregir evidencia
              </h2>

              <p>
                Actualiza la información y
                vuelve a enviarla.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="evidence-action-modal__body">
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

            {error && (
              <div
                className="activity-form-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <label className="evidence-action-field">
              <span>
                Enlace corregido *
              </span>

              <div className="activity-input-icon">
                <Link size={19} />

                <input
                  type="url"
                  value={form.enlace}
                  onChange={(event) =>
                    setForm(
                      (currentForm) => ({
                        ...currentForm,
                        enlace:
                          event.target.value,
                      }),
                    )
                  }
                  disabled={saving}
                  autoFocus
                />
              </div>
            </label>

            <label className="evidence-action-field">
              <span>
                Descripción
              </span>

              <textarea
                value={form.descripcion}
                onChange={(event) =>
                  setForm(
                    (currentForm) => ({
                      ...currentForm,
                      descripcion:
                        event.target.value,
                    }),
                  )
                }
                rows={4}
                maxLength={1000}
                disabled={saving}
              />

              <small>
                {form.descripcion.length}/1000
              </small>
            </label>
          </div>

          <footer className="evidence-action-modal__footer">
            <button
              type="button"
              className="activity-button activity-button--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="activity-button activity-button--primary"
              disabled={saving}
            >
              <RotateCcw size={18} />

              {saving
                ? 'Reenviando...'
                : 'Corregir y reenviar'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}