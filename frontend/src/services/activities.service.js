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

  return data;
}

export async function getUsers() {
  const response = await apiFetch(
    '/users',
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
        'No fue posible consultar los usuarios.',
      ),
    );
  }

  return data;
}

export async function createActivity(
  activityData,
) {
  const response = await apiFetch(
    '/activities',
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