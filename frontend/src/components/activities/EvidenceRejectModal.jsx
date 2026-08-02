import {
  useEffect,
  useState,
} from 'react';

import {
  AlertTriangle,
  X,
  XCircle,
} from 'lucide-react';

export default function EvidenceRejectModal({
  isOpen,
  evidence,
  onClose,
  onSubmit,
}) {
  const [observation, setObservation] =
    useState('');

  const [error, setError] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setObservation('');
    setError('');
    setSaving(false);
  }, [
    isOpen,
    evidence,
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

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
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

  if (!isOpen || !evidence) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanObservation =
      observation.trim();

    setError('');

    if (!cleanObservation) {
      setError(
        'Escribe el motivo del rechazo.',
      );

      return;
    }

    if (cleanObservation.length > 1000) {
      setError(
        'La observación no puede superar 1000 caracteres.',
      );

      return;
    }

    try {
      setSaving(true);

      await onSubmit(
        cleanObservation,
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          'No fue posible rechazar la evidencia.',
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
        aria-labelledby="reject-evidence-title"
      >
        <header className="evidence-action-modal__header">
          <div>
            <span className="evidence-action-modal__icon evidence-action-modal__icon--danger">
              <XCircle size={22} />
            </span>

            <div>
              <h2 id="reject-evidence-title">
                Rechazar evidencia
              </h2>

              <p>
                Explica qué debe corregir el
                responsable.
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
            <div className="evidence-action-summary">
              <strong>
                Evidencia #{evidence.id}
              </strong>

              <a
                href={evidence.enlace}
                target="_blank"
                rel="noreferrer"
              >
                {evidence.enlace}
              </a>
            </div>

            <div className="evidence-action-warning">
              <AlertTriangle size={20} />

              <p>
                Al rechazarla, la actividad
                regresará al estado En proceso.
              </p>
            </div>

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
                Observación del rechazo *
              </span>

              <textarea
                value={observation}
                onChange={(event) => {
                  setObservation(
                    event.target.value,
                  );

                  setError('');
                }}
                rows={5}
                maxLength={1000}
                disabled={saving}
                autoFocus
                placeholder="Ejemplo: el enlace no permite consultar el documento..."
              />

              <small>
                {observation.length}/1000
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
              className="evidence-action-danger"
              disabled={saving}
            >
              <XCircle size={18} />

              {saving
                ? 'Rechazando...'
                : 'Rechazar evidencia'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}