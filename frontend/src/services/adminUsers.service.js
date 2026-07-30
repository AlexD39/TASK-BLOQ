import {
  apiFetch,
} from './api.service.js';

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

export async function getAdminUsers() {
  const response = await apiFetch(
    '/admin/users',
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
        'No fue posible consultar las cuentas.',
      ),
    );
  }

  return data;
}

export async function createAdminUser(
  userData,
) {
  const response = await apiFetch(
    '/admin/users',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(userData),
    },
  );

  const data =
    await readResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(
      getErrorMessage(
        data,
        'No fue posible crear la cuenta.',
      ),
    );
  }

  return data;
}

export async function updateAdminUser(
  userId,
  userData,
) {
  const response = await apiFetch(
    `/admin/users/${userId}`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(userData),
    },
  );

  const data =
    await readResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(
      getErrorMessage(
        data,
        'No fue posible actualizar la cuenta.',
      ),
    );
  }

  return data;
}

export async function updateAdminUserStatus(
  userId,
  estado,
) {
  const response = await apiFetch(
    `/admin/users/${userId}/status`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        estado,
      }),
    },
  );

  const data =
    await readResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(
      getErrorMessage(
        data,
        'No fue posible cambiar el estado de la cuenta.',
      ),
    );
  }

  return data;
}

export async function resetAdminUserPassword(
  userId,
  passwordData,
) {
  const response = await apiFetch(
    `/admin/users/${userId}/password`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(passwordData),
    },
  );

  const data =
    await readResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(
      getErrorMessage(
        data,
        'No fue posible restablecer la contraseña.',
      ),
    );
  }

  return data;
}