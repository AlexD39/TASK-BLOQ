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
  // 🔑 EL TRUCO: Si usas las credenciales de prueba, te dejamos pasar directamente sin consultar al backend
  if (
    credentials.email === 'admin@taskbloq.edu' && 
    credentials.password === 'TaskBloq2026'
  ) {
    console.log('⚡ Acceso concedido mediante bypass de demostración local.');
    
    // Guardamos un token falso de sesión para que el frontend no se rompa
    const dummyToken = 'token_falso_bypass_desarrollo_2026';
    sessionStorage.setItem('task_bloq_access_token', dummyToken); // Token que usa activities.service.js
    sessionStorage.setItem('accessToken', dummyToken);            // Token que usa auth.service.js
    
    // Devolvemos una respuesta exitosa idéntica a la que daría el backend
    return {
      ok: true,
      accessToken: dummyToken,
      usuario: {
        id: 1,
        nombre: 'Administrador Demo',
        email: 'admin@taskbloq.edu',
        rol: 'ADMIN'
      }
    };
  }

  // Petición real original por si quieres ingresar de forma normal más adelante:
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
  // Si estamos usando el bypass, no intentamos refrescar token real con un backend apagado
  if (sessionStorage.getItem('accessToken') === 'token_falso_bypass_desarrollo_2026') {
    return { accessToken: 'token_falso_bypass_desarrollo_2026' };
  }

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

  // Si estamos usando el bypass, devolvemos un dashboard mockeado local para que no falle la pantalla
  if (accessToken === 'token_falso_bypass_desarrollo_2026') {
    return {
      ok: true,
      stats: {
        total: 2,
        completadas: 0,
        pendientes: 2,
      },
      actividades: [
        {
          id: 1,
          titulo: "Actividad de demostración",
          descripcion: "Esta es una tarjeta de prueba para comprobar el formulario.",
          responsable: "Sin asignar",
          fechaLimite: "2026-12-31",
          prioridad: "MEDIA",
          estatus: "PENDIENTE",
          evidencia_url: ""
        }
      ]
    };
  }

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
  // Si no hay backend, simplemente limpiamos sesión local sin disparar fetch
  if (sessionStorage.getItem('accessToken') === 'token_falso_bypass_desarrollo_2026') {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('task_bloq_access_token');
    sessionStorage.removeItem('usuario');
    return;
  }

  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('usuario');
}