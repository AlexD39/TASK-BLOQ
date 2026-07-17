const ALLOWED_PRIORITIES = [
  'ALTA',
  'MEDIA',
  'BAJA',
];

const ALLOWED_STATUSES = [
  'PENDIENTE',
  'EN_PROCESO',
  'EN_REVISION',
  'COMPLETADA',
];

function isValidDate(dateValue) {
  if (
    typeof dateValue !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)
  ) {
    return false;
  }

  const [year, month, day] = dateValue
    .split('-')
    .map(Number);

  const parsedDate = new Date(
    Date.UTC(year, month - 1, day),
  );

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

export function validateActivityField(
  fieldName,
  rawValue,
) {
  const value =
    typeof rawValue === 'string'
      ? rawValue
      : '';

  switch (fieldName) {
    case 'titulo': {
      const cleanTitle = value.trim();

      if (!cleanTitle) {
        return 'El título es obligatorio.';
      }

      if (cleanTitle.length > 180) {
        return 'El título no puede superar 180 caracteres.';
      }

      return '';
    }

    case 'descripcion': {
      if (value.trim().length > 1000) {
        return 'La descripción no puede superar 1000 caracteres.';
      }

      return '';
    }

    case 'fechaLimite': {
      if (!value) {
        return 'La fecha límite es obligatoria.';
      }

      if (!isValidDate(value)) {
        return 'Selecciona una fecha válida.';
      }

      return '';
    }

    case 'prioridad': {
      if (!value) {
        return 'La prioridad es obligatoria.';
      }

      if (!ALLOWED_PRIORITIES.includes(value)) {
        return 'La prioridad seleccionada no es válida.';
      }

      return '';
    }

    case 'estatus': {
      if (!value) {
        return 'El estatus es obligatorio.';
      }

      if (!ALLOWED_STATUSES.includes(value)) {
        return 'El estatus seleccionado no es válido.';
      }

      return '';
    }

    default:
      return '';
  }
}

export function validateActivityForm(form) {
  const fields = [
    'titulo',
    'descripcion',
    'fechaLimite',
    'prioridad',
    'estatus',
  ];

  return fields.reduce((errors, fieldName) => {
    const fieldError = validateActivityField(
      fieldName,
      form[fieldName],
    );

    if (fieldError) {
      errors[fieldName] = fieldError;
    }

    return errors;
  }, {});
}