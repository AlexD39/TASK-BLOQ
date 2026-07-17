const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001/api';

export async function createActivity(
  activityData,
) {
  const accessToken =
    sessionStorage.getItem(
      'task_bloq_access_token',
    );

  if (!accessToken) {
    throw new Error(
      'La sesión no es válida. Inicia sesión nuevamente.',
    );
  }

  const response = await fetch(
    `${API_URL}/activities`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },

      body: JSON.stringify(activityData),
    },
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || !data.ok) {
    const validationError =
      data.errors
        ? Object.values(data.errors)[0]
        : null;

    throw new Error(
      validationError ||
        data.message ||
        'No fue posible registrar la actividad.',
    );
  }

  return data;
}