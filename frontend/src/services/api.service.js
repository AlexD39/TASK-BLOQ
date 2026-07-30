import {
  API_URL,
} from '../config/env.js';

let refreshRequest = null;

async function requestNewAccessToken() {
  const response = await fetch(
    `${API_URL}/auth/refresh`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (
    !response.ok ||
    !data.ok ||
    !data.accessToken
  ) {
    throw new Error(
      data.message ||
        'La sesión ha expirado.',
    );
  }

  sessionStorage.setItem(
    'task_bloq_access_token',
    data.accessToken,
  );

  return data.accessToken;
}

function clearLocalSession() {
  sessionStorage.removeItem(
    'task_bloq_access_token',
  );

  localStorage.removeItem(
    'task_bloq_user',
  );
}

export async function apiFetch(
  path,
  options = {},
) {
  function sendRequest(accessToken) {
    return fetch(`${API_URL}${path}`, {
      ...options,

      credentials: 'include',

      headers: {
        ...options.headers,

        ...(accessToken
          ? {
              Authorization:
                `Bearer ${accessToken}`,
            }
          : {}),
      },
    });
  }

  let accessToken =
    sessionStorage.getItem(
      'task_bloq_access_token',
    );

  let response =
    await sendRequest(accessToken);

  if (response.status !== 401) {
    return response;
  }

  try {
    /*
     * Evita lanzar varias solicitudes de refresh
     * cuando varias peticiones fallan al mismo tiempo.
     */
    if (!refreshRequest) {
      refreshRequest =
        requestNewAccessToken().finally(() => {
          refreshRequest = null;
        });
    }

    accessToken = await refreshRequest;

    /*
     * Reintenta una sola vez la petición original
     * usando el access token nuevo.
     */
    response =
      await sendRequest(accessToken);

    return response;
  } catch (error) {
    clearLocalSession();

    /*
     * ProtectedRoute detectará que ya no existe
     * usuario y enviará nuevamente al login.
     */
    window.location.reload();

    throw error;
  }
}