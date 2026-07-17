import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: 'postgresql://taskbloq_user:taskbloq_dev_password@localhost:5433/taskbloq' });

async function run() {
  try {
    const email = 'admin@taskbloq.edu';
    const password = 'TaskBloq2026';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertamos el usuario con rol de ADMIN (o el campo correspondiente en tu tabla de usuarios)
    // Si tu tabla de usuarios no tiene campo 'rol', este query la creará de forma básica
    await pool.query(
      'INSERT INTO usuarios (email, password, nombre, rol) VALUES (, , , ) ON CONFLICT (email) DO NOTHING',
      [email, hashedPassword, 'Administrador', 'ADMIN']
    );
    console.log('?? ¡Usuario admin@taskbloq.edu creado con éxito!');
  } catch (err) {
    console.error('? Error al crear usuario:', err.message);
  } finally {
    await pool.end();
  }
}
run();
