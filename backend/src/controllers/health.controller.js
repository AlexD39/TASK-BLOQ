import { pool } from '../config/database.js';

export async function getHealth(_request, response) {
  try {
    const result = await pool.query(`
      SELECT
        NOW() AS database_time,
        CURRENT_DATABASE() AS database_name
    `);

    return response.status(200).json({
      ok: true,
      service: 'task-bloq-api',
      api: 'connected',
      database: {
        connected: true,
        name: result.rows[0].database_name,
        time: result.rows[0].database_time,
      },
    });
  } catch (error) {
    console.error('Error de conexión con PostgreSQL:', error.message);

    return response.status(503).json({
      ok: false,
      service: 'task-bloq-api',
      api: 'connected',
      database: {
        connected: false,
      },
      message: 'No fue posible conectar con PostgreSQL',
    });
  }
}