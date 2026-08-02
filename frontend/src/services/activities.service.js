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

export async function createActivityEvidence(
  activityId,
  evidenceData,
) {
  const response = await apiFetch(
    `/activities/${activityId}/evidences`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(evidenceData),
    },
  );

  const data =
    await readResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(
      getErrorMessage(
        data,
        'No fue posible registrar la evidencia.',
      ),
    );
  }

  return data;
}

export async function reviewActivityEvidence(
  evidenceId,
  reviewData,
) {
  const response = await apiFetch(
    `/evidences/${evidenceId}/review`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(reviewData),
    },
  );

  const data =
    await readResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(
      getErrorMessage(
        data,
        'No fue posible revisar la evidencia.',
      ),
    );
  }

  return data;
}

export async function resubmitActivityEvidence(
  evidenceId,
  evidenceData,
) {
  const response = await apiFetch(
    `/evidences/${evidenceId}/resubmit`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(evidenceData),
    },
  );

  const data =
    await readResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(
      getErrorMessage(
        data,
        'No fue posible reenviar la evidencia.',
      ),
    );
  }

  return data;
}

export async function getActivityComments(
  activityId,
) {
  const response = await apiFetch(
    `/activities/${activityId}/comments`,
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
        'No fue posible consultar los comentarios.',
      ),
    );
  }

  return data;
}

export async function createActivityComment(
  activityId,
  commentData,
) {
  const response = await apiFetch(
    `/activities/${activityId}/comments`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(commentData),
    },
  );

  const data =
    await readResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(
      getErrorMessage(
        data,
        'No fue posible registrar el comentario.',
      ),
    );
  }

  return data;
}