import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está configurada');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (error) => {
  console.error('Error inesperado en PostgreSQL:', error);
});

// --- CÓDIGO TEMPORAL PARA LA HU DE EVIDENCIAS ---
async function actualizarTablaTemporal() {
  try {
    console.log('--- Intentando agregar columna evidencia_url ---');
    await pool.query('ALTER TABLE actividades ADD COLUMN IF NOT EXISTS evidencia_url VARCHAR(2048) DEFAULT NULL;');
    console.log('--- ¡Columna evidencia_url verificada/agregada en la BD! 🎉 ---');
  } catch (error) {
    console.error('Error al actualizar la tabla:', error);
  }
}
actualizarTablaTemporal();
// ------------------------------------------------      