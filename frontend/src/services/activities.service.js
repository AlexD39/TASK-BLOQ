import { apiFetch } from './api.service.js';

async function readResponse(response) {
  return response
    .json()
    .catch(() => ({}));
}

function getErrorMessage(
  data,
  defaultMessage,
) {
  const validationError =
    data.errors
      ? Object.values(data.errors)[0]
      : null;

  return (
    validationError ||
    data.message ||
    defaultMessage
  );
}

export async function getActivities() {
  const response = await apiFetch(
    '/activities',
    {
      method: 'GET',
    },
  );

  const data =
    await readResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(
      getErrorMessage(
        data,
        'No fue posible consultar las actividades.',
      ),
    );
  }

 feat/hu-comentarios-actividad
  // 🔑 EL TRUCO: Si estamos usando el token falso de desarrollo, simulamos éxito directo
  if (accessToken === 'token_falso_bypass_desarrollo_2026') {
    console.log('⚡ Actividad creada localmente (Bypass de demostración):', activityData);
    
    // Devolvemos una respuesta exitosa idéntica a la que esperaría recibir el frontend
    return {
      ok: true,
      message: 'Actividad registrada exitosamente.',
      actividad: {
        id: Math.floor(Math.random() * 1000), // ID aleatorio temporal
        ...activityData,
        estatus: activityData.estatus || 'PENDIENTE',
        fechaLimite: activityData.fechaLimite || new Date().toISOString().split('T')[0]
      }
    };
  }

  // Petición real original para cuando el backend esté encendido:
  const response = await fetch(
    `${API_URL}/activities`,

  return data;
}

export async function createActivity(
  activityData,
) {
  const response = await apiFetch(
    '/activities',
 develop
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(activityData),
    },
  );

  const data =
    await readResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(
      getErrorMessage(
        data,
        'No fue posible registrar la actividad.',
      ),
    );
  }

  return data;
}

export async function updateActivity(
  activityId,
  activityData,
) {
  const response = await apiFetch(
    `/activities/${activityId}`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(activityData),
    },
  );

  const data =
    await readResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(
      getErrorMessage(
        data,
        'No fue posible actualizar la actividad.',
      ),
    );
  }

  return data;
}