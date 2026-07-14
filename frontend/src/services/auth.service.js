const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001/api';

async function readResponse(response) {
  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message ||
      'Ocurrió un error en la solicitud.',
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

export async function login(credentials) {
  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      credentials: 'include',

      body: JSON.stringify(credentials),
    },
  );

  return readResponse(response);
}

export async function refreshAccessToken() {
  const response = await fetch(
    `${API_URL}/auth/refresh`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  return readResponse(response);
}

export async function getDashboard() {
  let accessToken =
    sessionStorage.getItem('accessToken');

  let response = await fetch(
    `${API_URL}/dashboard`,
    {
      headers: {
        Authorization:
          `Bearer ${accessToken || ''}`,
      },
      credentials: 'include',
    },
  );

  if (response.status === 401) {
    const refreshed =
      await refreshAccessToken();

    accessToken = refreshed.accessToken;

    sessionStorage.setItem(
      'accessToken',
      accessToken,
    );

    response = await fetch(
      `${API_URL}/dashboard`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
        credentials: 'include',
      },
    );
  }

  return readResponse(response);
}

export async function logout() {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('usuario');
}