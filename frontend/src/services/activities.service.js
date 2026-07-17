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