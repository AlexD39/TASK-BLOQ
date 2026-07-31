import 'dotenv/config';

import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import { createHash } from 'node:crypto';

const { Pool } = pg;

const requiredEnvironmentVariables = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

for (const variable of requiredEnvironmentVariables) {
  if (!process.env[variable]) {
    throw new Error(
      `La variable ${variable} no está configurada.`,
    );
  }
}

const app = express();
const port = Number(process.env.PORT) || 3001;

const accessTokenExpiration =
  process.env.ACCESS_TOKEN_EXPIRES || '15m';

const refreshTokenDays =
  Number(process.env.REFRESH_TOKEN_DAYS) || 7;

const isProduction =
  process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.disable('x-powered-by');

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      'http://localhost:5173',

    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

function hashToken(token) {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

function generateAccessToken(usuario) {
  return jwt.sign(
    {
      tipo: 'access',
      correo: usuario.correo,
      rol: usuario.rol,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      algorithm: 'HS256',
      subject: String(usuario.id_usuario),
      issuer: 'task-bloq-api',
      audience: 'task-bloq-web',
      expiresIn: accessTokenExpiration,
    },
  );
}

function generateRefreshToken(usuario) {
  return jwt.sign(
    {
      tipo: 'refresh',
      rol: usuario.rol,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      algorithm: 'HS256',
      subject: String(usuario.id_usuario),
      issuer: 'task-bloq-api',
      audience: 'task-bloq-web',
      expiresIn: `${refreshTokenDays}d`,
    },
  );
}

function setRefreshCookie(response, refreshToken) {
  response.cookie(
    'refreshToken',
    refreshToken,
    {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge:
        refreshTokenDays *
        24 *
        60 *
        60 *
        1000,
    },
  );
}

function clearRefreshCookie(response) {
  response.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth',
  });
}

function requireAccessToken(
  request,
  response,
  next,
) {
  const authorization =
    request.headers.authorization || '';

  const [type, token] =
    authorization.split(' ');

  if (type !== 'Bearer' || !token) {
    return response.status(401).json({
      ok: false,
      message: 'Access token requerido.',
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET,
      {
        algorithms: ['HS256'],
        issuer: 'task-bloq-api',
        audience: 'task-bloq-web',
      },
    );

    if (payload.tipo !== 'access') {
      return response.status(401).json({
        ok: false,
        message: 'Token no válido.',
      });
    }

    request.auth = {
      idUsuario: Number(payload.sub),
      correo: payload.correo,
      rol: payload.rol,
    };

    return next();
  } catch {
    return response.status(401).json({
      ok: false,
      message:
        'Access token inválido o expirado.',
    });
  }
}

function requireAdminRole(
  request,
  response,
  next,
) {
  if (request.auth?.rol !== 'ADMIN') {
    return response.status(403).json({
      ok: false,
      message:
        'Esta acción requiere permisos de administrador.',
    });
  }

  return next();
}

function normalizeHttpUrl(value) {
  const cleanValue =
    typeof value === 'string'
      ? value.trim()
      : '';

  if (
    !cleanValue ||
    cleanValue.length > 2048
  ) {
    return null;
  }

  try {
    const url = new URL(cleanValue);

    if (
      ![
        'http:',
        'https:',
      ].includes(url.protocol)
    ) {
      return null;
    }

    return cleanValue;
  } catch {
    return null;
  }
}

async function getEvidenceById(
  queryable,
  idEvidence,
) {
  const result = await queryable.query(
    `
      SELECT
        e.id_evidencia AS id,
        e.id_actividad AS "idActividad",
        e.id_usuario_envia AS "idUsuarioEnvia",
        sender.nombre AS "enviadoPor",
        e.enlace,
        COALESCE(
          e.descripcion,
          ''
        ) AS descripcion,
        e.estado,
        e.id_usuario_revisa AS "idUsuarioRevisa",
        reviewer.nombre AS revisor,
        COALESCE(
          e.observacion_revision,
          ''
        ) AS "observacionRevision",
        e.creado_en AS "creadoEn",
        e.revisado_en AS "revisadoEn"

      FROM evidencias e

      INNER JOIN usuarios sender
        ON sender.id_usuario =
          e.id_usuario_envia

      LEFT JOIN usuarios reviewer
        ON reviewer.id_usuario =
          e.id_usuario_revisa

      WHERE e.id_evidencia = $1
      LIMIT 1
    `,
    [idEvidence],
  );

  return result.rows[0] || null;
}

/* =========================================
   HEALTH
========================================= */

app.get('/api/health', async (_request, response) => {
  try {
    const result = await pool.query(`
      SELECT
        NOW() AS database_time,
        CURRENT_DATABASE() AS database_name
    `);

    return response.status(200).json({
      ok: true,
      api: 'connected',
      database: {
        connected: true,
        name: result.rows[0].database_name,
        time: result.rows[0].database_time,
      },
    });
  } catch (error) {
    return response.status(503).json({
      ok: false,
      api: 'connected',
      database: {
        connected: false,
      },
      error: error.message,
    });
  }
});

/* =========================================
   LOGIN
========================================= */

app.post(
  '/api/auth/login',
  async (request, response) => {
    try {
      const correo =
        typeof request.body?.correo === 'string'
          ? request.body.correo
              .trim()
              .toLowerCase()
          : '';

      const contrasena =
        typeof request.body?.contrasena ===
        'string'
          ? request.body.contrasena
          : '';

      const errors = {};

      if (!correo) {
        errors.correo =
          'El correo es obligatorio.';
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          correo,
        )
      ) {
        errors.correo =
          'Ingresa un correo válido.';
      }

      if (!contrasena) {
        errors.contrasena =
          'La contraseña es obligatoria.';
      }

      if (Object.keys(errors).length > 0) {
        return response.status(400).json({
          ok: false,
          message:
            'Verifica los campos del formulario.',
          errors,
        });
      }

      const result = await pool.query(
        `
          SELECT
            id_usuario,
            nombre,
            correo,
            password_hash,
            rol,
            estado
          FROM usuarios
          WHERE LOWER(correo) = LOWER($1)
          LIMIT 1
        `,
        [correo],
      );

      const usuario = result.rows[0];

      if (!usuario) {
        return response.status(401).json({
          ok: false,
          message:
            'Correo o contraseña incorrectos.',
        });
      }

      if (usuario.estado !== 'ACTIVO') {
        return response.status(403).json({
          ok: false,
          message:
            'La cuenta se encuentra inactiva.',
        });
      }

      const passwordIsValid =
        await bcrypt.compare(
          contrasena,
          usuario.password_hash,
        );

      if (!passwordIsValid) {
        return response.status(401).json({
          ok: false,
          message:
            'Correo o contraseña incorrectos.',
        });
      }

      const accessToken =
        generateAccessToken(usuario);

      const refreshToken =
        generateRefreshToken(usuario);

      const refreshTokenHash =
        hashToken(refreshToken);

      await pool.query(
        `
          DELETE FROM refresh_tokens
          WHERE id_usuario = $1
            AND (
              expira_en <= NOW()
              OR revocado_en IS NOT NULL
            )
        `,
        [usuario.id_usuario],
      );

      await pool.query(
        `
          INSERT INTO refresh_tokens (
            id_usuario,
            token_hash,
            expira_en
          )
          VALUES (
            $1,
            $2,
            NOW() + (
              $3::INTEGER *
              INTERVAL '1 day'
            )
          )
        `,
        [
          usuario.id_usuario,
          refreshTokenHash,
          refreshTokenDays,
        ],
      );

      setRefreshCookie(
        response,
        refreshToken,
      );

      return response.status(200).json({
        ok: true,
        message:
          'Inicio de sesión correcto.',
        accessToken,
        expiresIn: accessTokenExpiration,
        usuario: {
          id: usuario.id_usuario,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
        },
      });
    } catch (error) {
      console.error(
        'Error durante login:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'Ocurrió un error al iniciar sesión.',
      });
    }
  },
);

/* =========================================
   REFRESH TOKEN
========================================= */

app.post(
  '/api/auth/refresh',
  async (request, response) => {
    const refreshToken =
      request.cookies.refreshToken;

    if (!refreshToken) {
      return response.status(401).json({
        ok: false,
        message: 'Refresh token requerido.',
      });
    }

    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET,
        {
          algorithms: ['HS256'],
          issuer: 'task-bloq-api',
          audience: 'task-bloq-web',
        },
      );

      if (payload.tipo !== 'refresh') {
        return response.status(401).json({
          ok: false,
          message:
            'Refresh token no válido.',
        });
      }

      const refreshTokenHash =
        hashToken(refreshToken);

      const result = await pool.query(
        `
          SELECT
            rt.id_refresh_token,
            u.id_usuario,
            u.nombre,
            u.correo,
            u.rol,
            u.estado
          FROM refresh_tokens rt
          INNER JOIN usuarios u
            ON u.id_usuario = rt.id_usuario
          WHERE rt.token_hash = $1
            AND rt.revocado_en IS NULL
            AND rt.expira_en > NOW()
          LIMIT 1
        `,
        [refreshTokenHash],
      );

      const session = result.rows[0];

      if (
        !session ||
        session.id_usuario !==
          Number(payload.sub)
      ) {
        clearRefreshCookie(response);

        return response.status(401).json({
          ok: false,
          message:
            'La sesión ya no es válida.',
        });
      }

      if (session.estado !== 'ACTIVO') {
        clearRefreshCookie(response);

        return response.status(403).json({
          ok: false,
          message:
            'La cuenta se encuentra inactiva.',
        });
      }

      await pool.query(
        `
          UPDATE refresh_tokens
          SET revocado_en = NOW()
          WHERE id_refresh_token = $1
        `,
        [session.id_refresh_token],
      );

      const newAccessToken =
        generateAccessToken(session);

      const newRefreshToken =
        generateRefreshToken(session);

      await pool.query(
        `
          INSERT INTO refresh_tokens (
            id_usuario,
            token_hash,
            expira_en
          )
          VALUES (
            $1,
            $2,
            NOW() + (
              $3::INTEGER *
              INTERVAL '1 day'
            )
          )
        `,
        [
          session.id_usuario,
          hashToken(newRefreshToken),
          refreshTokenDays,
        ],
      );

      setRefreshCookie(
        response,
        newRefreshToken,
      );

      return response.status(200).json({
        ok: true,
        accessToken: newAccessToken,
        expiresIn: accessTokenExpiration,
      });
    } catch {
      clearRefreshCookie(response);

      return response.status(401).json({
        ok: false,
        message:
          'Refresh token inválido o expirado.',
      });
    }
  },
);

/* =========================================
   LOGOUT
========================================= */

app.post(
  '/api/auth/logout',
  async (request, response) => {
    const refreshToken =
      request.cookies.refreshToken;

    if (refreshToken) {
      await pool.query(
        `
          UPDATE refresh_tokens
          SET revocado_en = NOW()
          WHERE token_hash = $1
        `,
        [hashToken(refreshToken)],
      );
    }

    clearRefreshCookie(response);

    return response.status(200).json({
      ok: true,
      message: 'Sesión cerrada correctamente.',
    });
  },
);

/* =========================================
   DASHBOARD PROTEGIDO
========================================= */

app.get(
  '/api/dashboard',
  requireAccessToken,
  async (request, response) => {
    const result = await pool.query(
      `
        SELECT
          id_usuario,
          nombre,
          correo,
          rol,
          estado
        FROM usuarios
        WHERE id_usuario = $1
          AND estado = 'ACTIVO'
        LIMIT 1
      `,
      [request.auth.idUsuario],
    );

    const usuario = result.rows[0];

    if (!usuario) {
      return response.status(401).json({
        ok: false,
        message: 'Usuario no disponible.',
      });
    }

    return response.status(200).json({
      ok: true,
      message:
        'Bienvenido al dashboard general.',
      usuario,
      indicadores: {
        actividadesTotales: 0,
        pendientes: 0,
        enProceso: 0,
        enRevision: 0,
        completadas: 0,
      },
    });
  },
);

/* =========================================
   LISTAR USUARIOS (RESPONSABLES DISPONIBLES)
========================================= */

app.get(
  '/api/users',
  requireAccessToken,  
  async (_request, response) => {
    try {
      const result = await pool.query(`
        SELECT
          id_usuario AS id,
          nombre,
          correo
        FROM usuarios
        WHERE estado = 'ACTIVO'
        ORDER BY nombre ASC
      `);

      return response.status(200).json({
        ok: true,
        usuarios: result.rows,
      });
    } catch (error) {
      console.error(
        'Error consultando usuarios:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'No fue posible consultar los usuarios.',
      });
    }
  },
);

/* =========================================
   ADMINISTRACIÓN DE USUARIOS
========================================= */

/*
 * LISTAR TODAS LAS CUENTAS
 */
app.get(
  '/api/admin/users',
  requireAccessToken,
  requireAdminRole,
  async (_request, response) => {
    try {
      const result = await pool.query(`
        SELECT
          id_usuario AS id,
          nombre,
          correo,
          rol,
          estado,
          creado_en AS "creadoEn",
          actualizado_en AS "actualizadoEn"
        FROM usuarios
        ORDER BY
          creado_en DESC,
          id_usuario DESC
      `);

      return response.status(200).json({
        ok: true,
        usuarios: result.rows,
      });
    } catch (error) {
      console.error(
        'Error consultando usuarios administrativos:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'No fue posible consultar las cuentas.',
      });
    }
  },
);

/*
 * EDITAR UNA CUENTA
 */
app.patch(
  '/api/admin/users/:id',
  requireAccessToken,
  requireAdminRole,
  async (request, response) => {
    try {
      const idUsuario = Number(
        request.params.id,
      );

      if (
        !Number.isInteger(idUsuario) ||
        idUsuario <= 0
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'El identificador del usuario no es válido.',
        });
      }

      const nombre =
        typeof request.body?.nombre === 'string'
          ? request.body.nombre.trim()
          : '';

      const correo =
        typeof request.body?.correo === 'string'
          ? request.body.correo
              .trim()
              .toLowerCase()
          : '';

      const rol =
        typeof request.body?.rol === 'string'
          ? request.body.rol
              .trim()
              .toUpperCase()
          : '';

      const errors = {};

      if (!nombre) {
        errors.nombre =
          'El nombre es obligatorio.';
      } else if (nombre.length < 3) {
        errors.nombre =
          'El nombre debe contener al menos 3 caracteres.';
      } else if (nombre.length > 120) {
        errors.nombre =
          'El nombre no puede superar 120 caracteres.';
      }

      if (!correo) {
        errors.correo =
          'El correo es obligatorio.';
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          correo,
        )
      ) {
        errors.correo =
          'Ingresa un correo válido.';
      } else if (correo.length > 160) {
        errors.correo =
          'El correo no puede superar 160 caracteres.';
      }

      const rolesPermitidos = [
        'ADMIN',
        'USUARIO',
      ];

      if (!rolesPermitidos.includes(rol)) {
        errors.rol =
          'El rol debe ser ADMIN o USUARIO.';
      }

      if (Object.keys(errors).length > 0) {
        return response.status(400).json({
          ok: false,
          message:
            'Verifica los datos de la cuenta.',
          errors,
        });
      }

      const existingResult = await pool.query(
        `
          SELECT
            id_usuario,
            rol
          FROM usuarios
          WHERE id_usuario = $1
          LIMIT 1
        `,
        [idUsuario],
      );

      const existingUser =
        existingResult.rows[0];

      if (!existingUser) {
        return response.status(404).json({
          ok: false,
          message:
            'La cuenta solicitada no existe.',
        });
      }

      if (
        idUsuario === request.auth.idUsuario &&
        rol !== 'ADMIN'
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'No puedes retirar tu propio rol de administrador.',
        });
      }

      const duplicatedEmailResult =
        await pool.query(
          `
            SELECT id_usuario
            FROM usuarios
            WHERE LOWER(correo) = LOWER($1)
              AND id_usuario <> $2
            LIMIT 1
          `,
          [
            correo,
            idUsuario,
          ],
        );

      if (duplicatedEmailResult.rows[0]) {
        return response.status(409).json({
          ok: false,
          message:
            'Ya existe otra cuenta registrada con ese correo.',
          errors: {
            correo:
              'El correo ya está registrado.',
          },
        });
      }

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        const result = await client.query(
          `
            UPDATE usuarios
            SET
              nombre = $1,
              correo = $2,
              rol = $3
            WHERE id_usuario = $4
            RETURNING
              id_usuario AS id,
              nombre,
              correo,
              rol,
              estado,
              creado_en AS "creadoEn",
              actualizado_en AS "actualizadoEn"
          `,
          [
            nombre,
            correo,
            rol,
            idUsuario,
          ],
        );

        if (existingUser.rol !== rol) {
          await client.query(
            `
              UPDATE refresh_tokens
              SET revocado_en = NOW()
              WHERE id_usuario = $1
                AND revocado_en IS NULL
            `,
            [idUsuario],
          );
        }

        await client.query('COMMIT');

        return response.status(200).json({
          ok: true,
          message:
            'Cuenta actualizada correctamente.',
          usuario: result.rows[0],
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (error?.code === '23505') {
        return response.status(409).json({
          ok: false,
          message:
            'Ya existe otra cuenta registrada con ese correo.',
        });
      }

      console.error(
        'Error editando usuario administrativo:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'No fue posible actualizar la cuenta.',
      });
    }
  },
);

/*
 * ACTIVAR O DESACTIVAR UNA CUENTA
 */
app.patch(
  '/api/admin/users/:id/status',
  requireAccessToken,
  requireAdminRole,
  async (request, response) => {
    try {
      const idUsuario = Number(
        request.params.id,
      );

      if (
        !Number.isInteger(idUsuario) ||
        idUsuario <= 0
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'El identificador del usuario no es válido.',
        });
      }

      const estado =
        typeof request.body?.estado === 'string'
          ? request.body.estado
              .trim()
              .toUpperCase()
          : '';

      const estadosPermitidos = [
        'ACTIVO',
        'INACTIVO',
      ];

      if (
        !estadosPermitidos.includes(estado)
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'El estado debe ser ACTIVO o INACTIVO.',
          errors: {
            estado:
              'Selecciona un estado válido.',
          },
        });
      }

      const existingResult = await pool.query(
        `
          SELECT
            id_usuario,
            nombre,
            correo,
            rol,
            estado
          FROM usuarios
          WHERE id_usuario = $1
          LIMIT 1
        `,
        [idUsuario],
      );

      const existingUser =
        existingResult.rows[0];

      if (!existingUser) {
        return response.status(404).json({
          ok: false,
          message:
            'La cuenta solicitada no existe.',
        });
      }

      if (
        idUsuario === request.auth.idUsuario &&
        estado === 'INACTIVO'
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'No puedes desactivar tu propia cuenta.',
        });
      }

      if (
        existingUser.rol === 'ADMIN' &&
        existingUser.estado === 'ACTIVO' &&
        estado === 'INACTIVO'
      ) {
        const activeAdminsResult =
          await pool.query(
            `
              SELECT COUNT(*)::INTEGER AS total
              FROM usuarios
              WHERE rol = 'ADMIN'
                AND estado = 'ACTIVO'
                AND id_usuario <> $1
            `,
            [idUsuario],
          );

        const activeAdmins =
          activeAdminsResult.rows[0].total;

        if (activeAdmins === 0) {
          return response.status(400).json({
            ok: false,
            message:
              'No puedes desactivar al último administrador activo.',
          });
        }
      }

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        const result = await client.query(
          `
            UPDATE usuarios
            SET estado = $1
            WHERE id_usuario = $2
            RETURNING
              id_usuario AS id,
              nombre,
              correo,
              rol,
              estado,
              creado_en AS "creadoEn",
              actualizado_en AS "actualizadoEn"
          `,
          [
            estado,
            idUsuario,
          ],
        );

        if (estado === 'INACTIVO') {
          await client.query(
            `
              UPDATE refresh_tokens
              SET revocado_en = NOW()
              WHERE id_usuario = $1
                AND revocado_en IS NULL
            `,
            [idUsuario],
          );
        }

        await client.query('COMMIT');

        return response.status(200).json({
          ok: true,
          message:
            estado === 'ACTIVO'
              ? 'Cuenta activada correctamente.'
              : 'Cuenta desactivada correctamente.',
          usuario: result.rows[0],
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(
        'Error cambiando estado del usuario:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'No fue posible cambiar el estado de la cuenta.',
      });
    }
  },
);

/*
 * RESTABLECER CONTRASEÑA DE UNA CUENTA
 */
app.patch(
  '/api/admin/users/:id/password',
  requireAccessToken,
  requireAdminRole,
  async (request, response) => {
    try {
      const idUsuario = Number(
        request.params.id,
      );

      if (
        !Number.isInteger(idUsuario) ||
        idUsuario <= 0
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'El identificador del usuario no es válido.',
        });
      }

      const contrasena =
        typeof request.body?.contrasena === 'string'
          ? request.body.contrasena
          : '';

      const confirmarContrasena =
        typeof request.body?.confirmarContrasena ===
        'string'
          ? request.body.confirmarContrasena
          : '';

      const errors = {};

      if (!contrasena) {
        errors.contrasena =
          'La nueva contraseña es obligatoria.';
      } else if (contrasena.length < 8) {
        errors.contrasena =
          'La contraseña debe contener al menos 8 caracteres.';
      } else if (contrasena.length > 72) {
        errors.contrasena =
          'La contraseña no puede superar 72 caracteres.';
      }

      if (!confirmarContrasena) {
        errors.confirmarContrasena =
          'Confirma la nueva contraseña.';
      } else if (
        contrasena !== confirmarContrasena
      ) {
        errors.confirmarContrasena =
          'Las contraseñas no coinciden.';
      }

      if (Object.keys(errors).length > 0) {
        return response.status(400).json({
          ok: false,
          message:
            'Verifica los datos de la contraseña.',
          errors,
        });
      }

      const existingResult = await pool.query(
        `
          SELECT
            id_usuario,
            nombre,
            correo,
            estado
          FROM usuarios
          WHERE id_usuario = $1
          LIMIT 1
        `,
        [idUsuario],
      );

      const existingUser =
        existingResult.rows[0];

      if (!existingUser) {
        return response.status(404).json({
          ok: false,
          message:
            'La cuenta solicitada no existe.',
        });
      }

      const passwordHash =
        await bcrypt.hash(
          contrasena,
          10,
        );

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        await client.query(
          `
            UPDATE usuarios
            SET password_hash = $1
            WHERE id_usuario = $2
          `,
          [
            passwordHash,
            idUsuario,
          ],
        );

        await client.query(
          `
            UPDATE refresh_tokens
            SET revocado_en = NOW()
            WHERE id_usuario = $1
              AND revocado_en IS NULL
          `,
          [idUsuario],
        );

        await client.query('COMMIT');

        return response.status(200).json({
          ok: true,
          message:
            'Contraseña restablecida correctamente.',
          usuario: {
            id: String(
              existingUser.id_usuario,
            ),
            nombre:
              existingUser.nombre,
            correo:
              existingUser.correo,
            estado:
              existingUser.estado,
          },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(
        'Error restableciendo contraseña:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'No fue posible restablecer la contraseña.',
      });
    }
  },
);

/*
 * CREAR UNA CUENTA
 */
app.post(
  '/api/admin/users',
  requireAccessToken,
  requireAdminRole,
  async (request, response) => {
    try {
      const nombre =
        typeof request.body?.nombre === 'string'
          ? request.body.nombre.trim()
          : '';

      const correo =
        typeof request.body?.correo === 'string'
          ? request.body.correo
              .trim()
              .toLowerCase()
          : '';

      const contrasena =
        typeof request.body?.contrasena === 'string'
          ? request.body.contrasena
          : '';

      const rol =
        typeof request.body?.rol === 'string'
          ? request.body.rol
              .trim()
              .toUpperCase()
          : 'USUARIO';

      const errors = {};

      if (!nombre) {
        errors.nombre =
          'El nombre es obligatorio.';
      } else if (nombre.length < 3) {
        errors.nombre =
          'El nombre debe contener al menos 3 caracteres.';
      } else if (nombre.length > 120) {
        errors.nombre =
          'El nombre no puede superar 120 caracteres.';
      }

      if (!correo) {
        errors.correo =
          'El correo es obligatorio.';
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          correo,
        )
      ) {
        errors.correo =
          'Ingresa un correo válido.';
      } else if (correo.length > 160) {
        errors.correo =
          'El correo no puede superar 160 caracteres.';
      }

      if (!contrasena) {
        errors.contrasena =
          'La contraseña es obligatoria.';
      } else if (contrasena.length < 8) {
        errors.contrasena =
          'La contraseña debe contener al menos 8 caracteres.';
      } else if (contrasena.length > 72) {
        errors.contrasena =
          'La contraseña no puede superar 72 caracteres.';
      }

      const rolesPermitidos = [
        'ADMIN',
        'USUARIO',
      ];

      if (!rolesPermitidos.includes(rol)) {
        errors.rol =
          'El rol debe ser ADMIN o USUARIO.';
      }

      if (Object.keys(errors).length > 0) {
        return response.status(400).json({
          ok: false,
          message:
            'Verifica los datos de la cuenta.',
          errors,
        });
      }

      const existingResult = await pool.query(
        `
          SELECT id_usuario
          FROM usuarios
          WHERE LOWER(correo) = LOWER($1)
          LIMIT 1
        `,
        [correo],
      );

      if (existingResult.rows[0]) {
        return response.status(409).json({
          ok: false,
          message:
            'Ya existe una cuenta registrada con ese correo.',
          errors: {
            correo:
              'El correo ya está registrado.',
          },
        });
      }

      const passwordHash =
        await bcrypt.hash(
          contrasena,
          10,
        );

      const result = await pool.query(
        `
          INSERT INTO usuarios (
            nombre,
            correo,
            password_hash,
            rol,
            estado
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            'ACTIVO'
          )
          RETURNING
            id_usuario AS id,
            nombre,
            correo,
            rol,
            estado,
            creado_en AS "creadoEn",
            actualizado_en AS "actualizadoEn"
        `,
        [
          nombre,
          correo,
          passwordHash,
          rol,
        ],
      );

      return response.status(201).json({
        ok: true,
        message:
          'Cuenta creada correctamente.',
        usuario: result.rows[0],
      });
    } catch (error) {
      if (error?.code === '23505') {
        return response.status(409).json({
          ok: false,
          message:
            'Ya existe una cuenta registrada con ese correo.',
          errors: {
            correo:
              'El correo ya está registrado.',
          },
        });
      }

      console.error(
        'Error creando usuario administrativo:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'No fue posible crear la cuenta.',
      });
    }
  },
);

/* =========================================
   REGISTRAR ACTIVIDAD
========================================= */
app.post(
  '/api/activities',
  requireAccessToken,
  async (request, response) => {
    try {
      const titulo =
        typeof request.body?.titulo === 'string'
          ? request.body.titulo.trim()
          : '';

      const descripcion =
        typeof request.body?.descripcion === 'string'
          ? request.body.descripcion.trim()
          : '';

      const responsableRecibido =
  request.body?.idResponsable;

const idResponsable =
  responsableRecibido === null ||
  responsableRecibido === undefined ||
  responsableRecibido === ''
    ? null
    : Number(responsableRecibido);

      const fechaLimite =
        typeof request.body?.fechaLimite === 'string'
          ? request.body.fechaLimite.trim()
          : '';

      const prioridad =
        typeof request.body?.prioridad === 'string'
          ? request.body.prioridad
              .trim()
              .toUpperCase()
          : '';

      const estatus = 'PENDIENTE';

      const errors = {};

      if (!titulo) {
        errors.titulo =
          'El título es obligatorio.';
      }

      if (
  idResponsable !== null &&
  (
    !Number.isInteger(idResponsable) ||
    idResponsable <= 0
  )
) {
  errors.idResponsable =
    'Selecciona un responsable válido.';
}    

      if (!fechaLimite) {
        errors.fechaLimite =
          'La fecha límite es obligatoria.';
      }

      const prioridadesPermitidas = [
        'ALTA',
        'MEDIA',
        'BAJA',
      ];

      if (
        !prioridadesPermitidas.includes(
          prioridad,
        )
      ) {
        errors.prioridad =
          'La prioridad debe ser ALTA, MEDIA o BAJA.';
      }

      const estatusPermitidos = [
        'PENDIENTE',
        'EN_PROCESO',
        'EN_REVISION',
        'COMPLETADA',
      ];

      if (!estatusPermitidos.includes(estatus)) {
        errors.estatus =
          'El estatus seleccionado no es válido.';
      }

      if (Object.keys(errors).length > 0) {
        return response.status(400).json({
          ok: false,
          message:
            'Verifica los campos de la actividad.',
          errors,
        });
      }

      let responsable = null;

if (idResponsable !== null) {
  const responsableResult =
    await pool.query(
      `
        SELECT
          id_usuario,
          nombre,
          correo
        FROM usuarios
        WHERE id_usuario = $1
          AND estado = 'ACTIVO'
        LIMIT 1
      `,
      [idResponsable],
    );

  responsable = responsableResult.rows[0];

  if (!responsable) {
    return response.status(400).json({
      ok: false,
      message:
        'El responsable seleccionado no existe o está inactivo.',
    });
  }
}

      const result = await pool.query(
        `
          INSERT INTO actividades (
            titulo,
            descripcion,
            id_creador,
            id_responsable,
            fecha_limite,
            estatus,
            prioridad
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
          RETURNING
            id_actividad,
            titulo,
            descripcion,
            id_creador,
            id_responsable,
            fecha_limite,
            estatus,
            prioridad,
            creado_en,
            actualizado_en
        `,
        [
          titulo,
          descripcion || null,
          request.auth.idUsuario,
          idResponsable,
          fechaLimite,
          estatus,
          prioridad,
        ],
      );

      return response.status(201).json({
        ok: true,
        message:
          'Actividad registrada correctamente.',
        actividad: {
          ...result.rows[0],
          responsable: responsable
  ? {
      id: responsable.id_usuario,
      nombre: responsable.nombre,
      correo: responsable.correo,
    }
  : null,
        },
      });
    } catch (error) {
      console.error(
        'Error registrando actividad:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'Ocurrió un error al registrar la actividad.',
      });
    }
  },
);

/* =========================================
   LISTAR ACTIVIDADES
========================================= */

app.get(
  '/api/activities',
  requireAccessToken,
  async (_request, response) => {
    try {
      const result = await pool.query(`
        SELECT
          a.id_actividad AS id,
          a.titulo,
          COALESCE(a.descripcion, '') AS descripcion,
          a.fecha_limite AS "fechaLimite",
          a.estatus,
          a.prioridad,
          a.creado_en AS "creadoEn",

          a.id_creador AS "idCreador",
          creador.nombre AS creador,

          a.id_responsable AS "idResponsable",
          responsable.nombre AS responsable,

          (
            SELECT COUNT(*)::INTEGER
            FROM comentarios c
            WHERE c.id_actividad = a.id_actividad
          ) AS comentarios,

COALESCE(
  (
    SELECT json_agg(
      json_build_object(
        'id',
          e.id_evidencia,

        'idActividad',
          e.id_actividad,

        'idUsuarioEnvia',
          e.id_usuario_envia,

        'enviadoPor',
          sender.nombre,

        'enlace',
          e.enlace,

        'descripcion',
          COALESCE(
            e.descripcion,
            ''
          ),

        'estado',
          e.estado,

        'idUsuarioRevisa',
          e.id_usuario_revisa,

        'revisor',
          reviewer.nombre,

        'observacionRevision',
          COALESCE(
            e.observacion_revision,
            ''
          ),

        'creadoEn',
          e.creado_en,

        'revisadoEn',
          e.revisado_en
      )
      ORDER BY e.id_evidencia
    )

    FROM evidencias e

    INNER JOIN usuarios sender
      ON sender.id_usuario =
        e.id_usuario_envia

    LEFT JOIN usuarios reviewer
      ON reviewer.id_usuario =
        e.id_usuario_revisa

    WHERE e.id_actividad =
      a.id_actividad
  ),
  '[]'::json
) AS evidencias
 
        FROM actividades a

        INNER JOIN usuarios creador
          ON creador.id_usuario = a.id_creador

        LEFT JOIN usuarios responsable
          ON responsable.id_usuario = a.id_responsable

        ORDER BY
          a.creado_en DESC,
          a.id_actividad DESC
      `);

      return response.status(200).json({
        ok: true,
        actividades: result.rows,
      });
    } catch (error) {
      console.error(
        'Error consultando actividades:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'No fue posible consultar las actividades.',
      });
    }
  },
);

/* =========================================
   ACTUALIZAR ACTIVIDAD
========================================= */

app.patch(
  '/api/activities/:id',
  requireAccessToken,
  async (request, response) => {
    try {
      const idActividad = Number(
        request.params.id,
      );

      if (
        !Number.isInteger(idActividad) ||
        idActividad <= 0
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'El identificador de la actividad no es válido.',
        });
      }

      const titulo =
        typeof request.body?.titulo === 'string'
          ? request.body.titulo.trim()
          : '';

      const descripcion =
        typeof request.body?.descripcion === 'string'
          ? request.body.descripcion.trim()
          : '';

      const responsableProvisto =
        Object.prototype.hasOwnProperty.call(
          request.body || {},
          'idResponsable',
        );

      const responsableRecibido =
        request.body?.idResponsable;

      const idResponsable =
        responsableRecibido === null ||
        responsableRecibido === undefined ||
        responsableRecibido === ''
          ? null
          : Number(responsableRecibido);

      const fechaLimite =
        typeof request.body?.fechaLimite === 'string'
          ? request.body.fechaLimite.trim()
          : '';

      const prioridad =
        typeof request.body?.prioridad === 'string'
          ? request.body.prioridad
              .trim()
              .toUpperCase()
          : '';

      const estatus =
  typeof request.body?.estatus === 'string'
    ? request.body.estatus
        .trim()
        .toUpperCase()
    : '';

const errors = {};

if (!titulo) {
        errors.titulo =
          'El título es obligatorio.';
      } else if (titulo.length > 180) {
        errors.titulo =
          'El título no puede superar 180 caracteres.';
      }

      if (
        responsableProvisto &&
        idResponsable !== null &&
        (
          !Number.isInteger(idResponsable) ||
          idResponsable <= 0
        )
      ) {
        errors.idResponsable =
          'Selecciona un responsable válido.';
      }

      if (!fechaLimite) {
        errors.fechaLimite =
          'La fecha límite es obligatoria.';
      }

      const prioridadesPermitidas = [
        'ALTA',
        'MEDIA',
        'BAJA',
      ];

      if (
        !prioridadesPermitidas.includes(
          prioridad,
        )
      ) {
        errors.prioridad =
          'La prioridad seleccionada no es válida.';
      }

      const estatusPermitidos = [
  'PENDIENTE',
  'EN_PROCESO',
  'EN_REVISION',
  'COMPLETADA',
];

if (
  !estatusPermitidos.includes(estatus)
) {
  errors.estatus =
    'El estatus seleccionado no es válido.';
}

      if (Object.keys(errors).length > 0) {
        return response.status(400).json({
          ok: false,
          message:
            'Verifica los datos de la actividad.',
          errors,
        });
      }

const existingResult = await pool.query(
  `
    SELECT
      id_actividad,
      titulo,
      descripcion,
      id_creador,
      id_responsable,
      fecha_limite::text AS fecha_limite,
      prioridad,
      estatus
    FROM actividades
    WHERE id_actividad = $1
    LIMIT 1
  `,
  [idActividad],
);


      const existingActivity =
        existingResult.rows[0];

      if (!existingActivity) {
        return response.status(404).json({
          ok: false,
          message:
            'La actividad no existe.',
        });
      }

      const isCreator =
  Number(existingActivity.id_creador) ===
  request.auth.idUsuario;

const isResponsible =
  Number(existingActivity.id_responsable) ===
  request.auth.idUsuario;

if (
  !isCreator &&
  !isResponsible
) {
  return response.status(403).json({
    ok: false,
    message:
      'No participas en esta actividad.',
  });
}

const estatusActual =
  existingActivity.estatus;

const cambioEstatus =
  estatus !== estatusActual;

if (cambioEstatus) {
  const responsablePuedeIniciar =
    isResponsible &&
    estatusActual === 'PENDIENTE' &&
    estatus === 'EN_PROCESO';

  const responsablePuedeEnviarRevision =
    isResponsible &&
    estatusActual === 'EN_PROCESO' &&
    estatus === 'EN_REVISION';

  const creadorPuedeCompletar =
    isCreator &&
    estatusActual === 'EN_REVISION' &&
    estatus === 'COMPLETADA';

  const creadorPuedeDevolver =
    isCreator &&
    estatusActual === 'EN_REVISION' &&
    estatus === 'EN_PROCESO';

  const transicionPermitida =
    responsablePuedeIniciar ||
    responsablePuedeEnviarRevision ||
    creadorPuedeCompletar ||
    creadorPuedeDevolver;

  if (!transicionPermitida) {
    return response.status(400).json({
      ok: false,
      message:
        `No está permitido cambiar de ${estatusActual} a ${estatus}.`,
    });
  }

  if (responsablePuedeEnviarRevision) {
  const evidenceSummaryResult =
    await pool.query(
      `
        SELECT
          COUNT(*)::INTEGER AS total,

          COUNT(*) FILTER (
            WHERE estado = 'RECHAZADA'
          )::INTEGER AS rechazadas

        FROM evidencias
        WHERE id_actividad = $1
      `,
      [idActividad],
    );

  const evidenceSummary =
    evidenceSummaryResult.rows[0];

  if (evidenceSummary.total === 0) {
    return response.status(400).json({
      ok: false,
      message:
        'Debes registrar al menos una evidencia antes de enviar la actividad a revisión.',
    });
  }

  if (
    evidenceSummary.rechazadas > 0
  ) {
    return response.status(400).json({
      ok: false,
      message:
        'Debes corregir y reenviar todas las evidencias rechazadas.',
    });
  }
}
  
if (creadorPuedeCompletar) {
  const reviewSummaryResult =
    await pool.query(
      `
        SELECT
          COUNT(*)::INTEGER AS total,

          COUNT(*) FILTER (
            WHERE estado <> 'APROBADA'
          )::INTEGER AS no_aprobadas

        FROM evidencias
        WHERE id_actividad = $1
      `,
      [idActividad],
    );

  const reviewSummary =
    reviewSummaryResult.rows[0];

  if (
    reviewSummary.total === 0 ||
    reviewSummary.no_aprobadas > 0
  ) {
    return response.status(400).json({
      ok: false,
      message:
        'Todas las evidencias deben estar aprobadas antes de completar la actividad.',
    });
  }
}

}

const datosGeneralesCambiaron =
  titulo !== existingActivity.titulo ||
  descripcion !==
    (existingActivity.descripcion || '') ||
  fechaLimite !==
    existingActivity.fecha_limite ||
  prioridad !==
    existingActivity.prioridad;

if (
  datosGeneralesCambiaron &&
  !isCreator
) {
  return response.status(403).json({
    ok: false,
    message:
      'El responsable solo puede administrar evidencias y cambiar el estatus permitido.',
  });
}

const idResponsableActual =
  existingActivity.id_responsable === null ||
  existingActivity.id_responsable === undefined
    ? null
    : Number(
        existingActivity.id_responsable,
      );

const responsableCambiado =
  responsableProvisto &&
  idResponsable !==
    idResponsableActual;

if (
  responsableCambiado &&
  !isCreator
) {
  return response.status(403).json({
    ok: false,
    message:
      'Solo el creador puede asignar o cambiar al responsable.',
  });
}

      let idResponsableFinal =
        existingActivity.id_responsable ??
        null;

      if (responsableCambiado) {
        if (idResponsable !== null) {
          const responsableResult =
            await pool.query(
              `
                SELECT id_usuario
                FROM usuarios
                WHERE id_usuario = $1
                  AND estado = 'ACTIVO'
                LIMIT 1
              `,
              [idResponsable],
            );

          if (!responsableResult.rows[0]) {
            return response.status(400).json({
              ok: false,
              message:
                'El responsable seleccionado no existe o está inactivo.',
            });
          }
        }

        idResponsableFinal = idResponsable;
      }

      const client = await pool.connect();

try {
  await client.query('BEGIN');

  const result = await client.query(
    `
      WITH actividad_actualizada AS (
        UPDATE actividades
        SET
          titulo = $1,
          descripcion = $2,
          fecha_limite = $3,
          prioridad = $4,
          estatus = $5,
          id_responsable = $6
        WHERE id_actividad = $7
        RETURNING *
      )
      SELECT
        a.id_actividad AS id,
        a.titulo,
        COALESCE(
          a.descripcion,
          ''
        ) AS descripcion,
        a.id_creador AS "idCreador",
        a.id_responsable AS "idResponsable",
        a.fecha_limite AS "fechaLimite",
        a.estatus,
        a.prioridad,
        a.creado_en AS "creadoEn",
        a.actualizado_en AS "actualizadoEn",

        responsable.nombre AS responsable

      FROM actividad_actualizada a

      LEFT JOIN usuarios responsable
        ON responsable.id_usuario =
          a.id_responsable
    `,
    [
      titulo,
      descripcion || null,
      fechaLimite,
      prioridad,
      estatus,
      idResponsableFinal,
      idActividad,
    ],
  );

  const evidenciasResult =
  await client.query(
    `
      SELECT
        e.id_evidencia AS id,
        e.id_actividad AS "idActividad",
        e.id_usuario_envia AS "idUsuarioEnvia",
        sender.nombre AS "enviadoPor",
        e.enlace,
        COALESCE(
          e.descripcion,
          ''
        ) AS descripcion,
        e.estado,
        e.id_usuario_revisa AS "idUsuarioRevisa",
        reviewer.nombre AS revisor,
        COALESCE(
          e.observacion_revision,
          ''
        ) AS "observacionRevision",
        e.creado_en AS "creadoEn",
        e.revisado_en AS "revisadoEn"

      FROM evidencias e

      INNER JOIN usuarios sender
        ON sender.id_usuario =
          e.id_usuario_envia

      LEFT JOIN usuarios reviewer
        ON reviewer.id_usuario =
          e.id_usuario_revisa

      WHERE e.id_actividad = $1
      ORDER BY e.id_evidencia
    `,
    [idActividad],
  );

  await client.query('COMMIT');

  return response.status(200).json({
    ok: true,
    message:
      'Actividad actualizada correctamente.',
    actividad: {
      ...result.rows[0],
      evidencias: evidenciasResult.rows,
    },
  });
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
      
    } catch (error) {
      console.error(
        'Error actualizando actividad:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'No fue posible actualizar la actividad.',
      });
    }
  },
);


/* =========================================
   REGISTRAR EVIDENCIA
========================================= */

app.post(
  '/api/activities/:id/evidences',
  requireAccessToken,
  async (request, response) => {
    try {
      const idActivity = Number(
        request.params.id,
      );

      if (
        !Number.isInteger(idActivity) ||
        idActivity <= 0
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'El identificador de la actividad no es válido.',
        });
      }

      const link =
        normalizeHttpUrl(
          request.body?.enlace,
        );

      const description =
        typeof request.body?.descripcion ===
        'string'
          ? request.body.descripcion.trim()
          : '';

      const errors = {};

      if (!link) {
        errors.enlace =
          'Ingresa un enlace HTTP o HTTPS válido.';
      }

      if (description.length > 1000) {
        errors.descripcion =
          'La descripción no puede superar 1000 caracteres.';
      }

      if (Object.keys(errors).length > 0) {
        return response.status(400).json({
          ok: false,
          message:
            'Verifica los datos de la evidencia.',
          errors,
        });
      }

      const activityResult =
        await pool.query(
          `
            SELECT
              id_actividad,
              id_responsable,
              estatus
            FROM actividades
            WHERE id_actividad = $1
            LIMIT 1
          `,
          [idActivity],
        );

      const activity =
        activityResult.rows[0];

      if (!activity) {
        return response.status(404).json({
          ok: false,
          message:
            'La actividad no existe.',
        });
      }

      const isResponsible =
        Number(activity.id_responsable) ===
        request.auth.idUsuario;

      if (!isResponsible) {
        return response.status(403).json({
          ok: false,
          message:
            'Solo el responsable puede registrar evidencias.',
        });
      }

      if (
        activity.estatus !==
        'EN_PROCESO'
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'Solo puedes registrar evidencias mientras la actividad está en proceso.',
        });
      }

      const countResult =
        await pool.query(
          `
            SELECT COUNT(*)::INTEGER AS total
            FROM evidencias
            WHERE id_actividad = $1
          `,
          [idActivity],
        );

      if (
        countResult.rows[0].total >= 20
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'Solo puedes registrar hasta 20 evidencias por actividad.',
        });
      }

      const insertResult =
        await pool.query(
          `
            INSERT INTO evidencias (
              id_actividad,
              id_usuario_envia,
              enlace,
              descripcion
            )
            VALUES (
              $1,
              $2,
              $3,
              $4
            )
            RETURNING id_evidencia
          `,
          [
            idActivity,
            request.auth.idUsuario,
            link,
            description || null,
          ],
        );

      const evidence =
        await getEvidenceById(
          pool,
          insertResult.rows[0]
            .id_evidencia,
        );

      return response.status(201).json({
        ok: true,
        message:
          'Evidencia registrada correctamente.',
        evidencia: evidence,
        actividad: {
          id: String(idActivity),
          estatus: activity.estatus,
        },
      });
    } catch (error) {
      console.error(
        'Error registrando evidencia:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'No fue posible registrar la evidencia.',
      });
    }
  },
);

/* =========================================
   REVISAR EVIDENCIA
========================================= */

app.patch(
  '/api/evidences/:id/review',
  requireAccessToken,
  async (request, response) => {
    const client =
      await pool.connect();

    try {
      const idEvidence = Number(
        request.params.id,
      );

      if (
        !Number.isInteger(idEvidence) ||
        idEvidence <= 0
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'El identificador de la evidencia no es válido.',
        });
      }

      const status =
        typeof request.body?.estado ===
        'string'
          ? request.body.estado
              .trim()
              .toUpperCase()
          : '';

      const observation =
        typeof request.body?.observacion ===
        'string'
          ? request.body.observacion.trim()
          : '';

      if (
        ![
          'APROBADA',
          'RECHAZADA',
        ].includes(status)
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'La evidencia solo puede aprobarse o rechazarse.',
        });
      }

      if (
        status === 'RECHAZADA' &&
        !observation
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'La observación es obligatoria cuando la evidencia es rechazada.',
          errors: {
            observacion:
              'Escribe el motivo del rechazo.',
          },
        });
      }

      if (observation.length > 1000) {
        return response.status(400).json({
          ok: false,
          message:
            'La observación no puede superar 1000 caracteres.',
        });
      }

      await client.query('BEGIN');

      const evidenceResult =
        await client.query(
          `
            SELECT
              e.id_evidencia,
              e.estado,
              a.id_actividad,
              a.id_creador,
              a.estatus
            FROM evidencias e

            INNER JOIN actividades a
              ON a.id_actividad =
                e.id_actividad

            WHERE e.id_evidencia = $1
            FOR UPDATE
          `,
          [idEvidence],
        );

      const evidence =
        evidenceResult.rows[0];

      if (!evidence) {
        await client.query('ROLLBACK');

        return response.status(404).json({
          ok: false,
          message:
            'La evidencia no existe.',
        });
      }

      const isCreator =
        Number(evidence.id_creador) ===
        request.auth.idUsuario;

      if (!isCreator) {
        await client.query('ROLLBACK');

        return response.status(403).json({
          ok: false,
          message:
            'Solo el creador de la actividad puede revisar esta evidencia.',
        });
      }

      if (
        evidence.estatus !==
        'EN_REVISION'
      ) {
        await client.query('ROLLBACK');

        return response.status(400).json({
          ok: false,
          message:
            'La actividad debe estar en revisión.',
        });
      }

      if (
        evidence.estado !==
        'PENDIENTE'
      ) {
        await client.query('ROLLBACK');

        return response.status(400).json({
          ok: false,
          message:
            'Esta evidencia ya fue revisada.',
        });
      }

      await client.query(
        `
          UPDATE evidencias
          SET
            estado = $1,
            id_usuario_revisa = $2,
            observacion_revision = $3,
            revisado_en = NOW()
          WHERE id_evidencia = $4
        `,
        [
          status,
          request.auth.idUsuario,
          observation || null,
          idEvidence,
        ],
      );

      let activityStatus =
        evidence.estatus;

      if (status === 'RECHAZADA') {
        activityStatus =
          'EN_PROCESO';

        await client.query(
          `
            UPDATE actividades
            SET estatus = 'EN_PROCESO'
            WHERE id_actividad = $1
          `,
          [evidence.id_actividad],
        );
      }

      const updatedEvidence =
        await getEvidenceById(
          client,
          idEvidence,
        );

      await client.query('COMMIT');

      return response.status(200).json({
        ok: true,
        message:
          status === 'APROBADA'
            ? 'Evidencia aprobada correctamente.'
            : 'Evidencia rechazada correctamente.',
        evidencia: updatedEvidence,
        actividad: {
          id: String(
            evidence.id_actividad,
          ),
          estatus: activityStatus,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');

      console.error(
        'Error revisando evidencia:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'No fue posible revisar la evidencia.',
      });
    } finally {
      client.release();
    }
  },
);

/* =========================================
   CORREGIR Y REENVIAR EVIDENCIA
========================================= */

app.patch(
  '/api/evidences/:id/resubmit',
  requireAccessToken,
  async (request, response) => {
    try {
      const idEvidence = Number(
        request.params.id,
      );

      if (
        !Number.isInteger(idEvidence) ||
        idEvidence <= 0
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'El identificador de la evidencia no es válido.',
        });
      }

      const link =
        normalizeHttpUrl(
          request.body?.enlace,
        );

      const description =
        typeof request.body?.descripcion ===
        'string'
          ? request.body.descripcion.trim()
          : '';

      const errors = {};

      if (!link) {
        errors.enlace =
          'Ingresa un enlace HTTP o HTTPS válido.';
      }

      if (description.length > 1000) {
        errors.descripcion =
          'La descripción no puede superar 1000 caracteres.';
      }

      if (Object.keys(errors).length > 0) {
        return response.status(400).json({
          ok: false,
          message:
            'Verifica los datos de la evidencia.',
          errors,
        });
      }

      const existingResult =
        await pool.query(
          `
            SELECT
              e.id_evidencia,
              e.estado,
              a.id_actividad,
              a.id_responsable,
              a.estatus
            FROM evidencias e

            INNER JOIN actividades a
              ON a.id_actividad =
                e.id_actividad

            WHERE e.id_evidencia = $1
            LIMIT 1
          `,
          [idEvidence],
        );

      const evidence =
        existingResult.rows[0];

      if (!evidence) {
        return response.status(404).json({
          ok: false,
          message:
            'La evidencia no existe.',
        });
      }

      const isResponsible =
        Number(
          evidence.id_responsable,
        ) === request.auth.idUsuario;

      if (!isResponsible) {
        return response.status(403).json({
          ok: false,
          message:
            'Solo el responsable puede corregir esta evidencia.',
        });
      }

      if (
        evidence.estado !==
        'RECHAZADA'
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'Solo pueden reenviarse evidencias rechazadas.',
        });
      }

      if (
        evidence.estatus !==
        'EN_PROCESO'
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'La actividad debe estar en proceso para corregir la evidencia.',
        });
      }

      await pool.query(
        `
          UPDATE evidencias
          SET
            enlace = $1,
            descripcion = $2,
            estado = 'PENDIENTE'
          WHERE id_evidencia = $3
        `,
        [
          link,
          description || null,
          idEvidence,
        ],
      );

      const updatedEvidence =
        await getEvidenceById(
          pool,
          idEvidence,
        );

      return response.status(200).json({
        ok: true,
        message:
          'Evidencia corregida y reenviada correctamente.',
        evidencia: updatedEvidence,
        actividad: {
          id: String(
            evidence.id_actividad,
          ),
          estatus:
            evidence.estatus,
        },
      });
    } catch (error) {
      console.error(
        'Error reenviando evidencia:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'No fue posible reenviar la evidencia.',
      });
    }
  },
);

/* =========================================
   LISTAR COMENTARIOS DE UNA ACTIVIDAD
========================================= */

app.get(
  '/api/activities/:id/comments',
  requireAccessToken,
  async (request, response) => {
    try {
      const idActividad = Number(
        request.params.id,
      );

      if (
        !Number.isInteger(idActividad) ||
        idActividad <= 0
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'El identificador de la actividad no es válido.',
        });
      }

      const activityResult =
        await pool.query(
          `
            SELECT
              id_actividad,
              id_creador,
              id_responsable
            FROM actividades
            WHERE id_actividad = $1
            LIMIT 1
          `,
          [idActividad],
        );

      const activity =
        activityResult.rows[0];

      if (!activity) {
        return response.status(404).json({
          ok: false,
          message:
            'La actividad no existe.',
        });
      }

      const isCreator =
        Number(activity.id_creador) ===
        request.auth.idUsuario;

      const isResponsible =
  Number(activity.id_responsable) ===
  request.auth.idUsuario;

if (
  !isCreator &&
  !isResponsible &&
  !isAdmin
) {
  return response.status(403).json({
    ok: false,
    message:
      'No tienes permiso para consultar los comentarios de esta actividad.',
  });
}


      const result = await pool.query(
        `
          SELECT
            c.id_comentario AS id,
            c.comentario,
            c.creado_en AS "creadoEn",

            u.id_usuario AS "idUsuario",
            u.nombre AS autor,
            u.correo AS "correoAutor"

          FROM comentarios c

          INNER JOIN usuarios u
            ON u.id_usuario = c.id_usuario

          WHERE c.id_actividad = $1

          ORDER BY
            c.creado_en ASC,
            c.id_comentario ASC
        `,
        [idActividad],
      );

      return response.status(200).json({
        ok: true,
        comentarios: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error(
        'Error consultando comentarios:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'No fue posible consultar los comentarios.',
      });
    }
  },
);

/* =========================================
   REGISTRAR COMENTARIO
========================================= */

app.post(
  '/api/activities/:id/comments',
  requireAccessToken,
  async (request, response) => {
    try {
      const idActividad = Number(
        request.params.id,
      );

      if (
        !Number.isInteger(idActividad) ||
        idActividad <= 0
      ) {
        return response.status(400).json({
          ok: false,
          message:
            'El identificador de la actividad no es válido.',
        });
      }

      const comentario =
        typeof request.body?.comentario ===
        'string'
          ? request.body.comentario.trim()
          : '';

      const errors = {};

      if (!comentario) {
        errors.comentario =
          'El comentario no puede estar vacío.';
      } else if (comentario.length > 1000) {
        errors.comentario =
          'El comentario no puede superar 1000 caracteres.';
      }

      if (Object.keys(errors).length > 0) {
        return response.status(400).json({
          ok: false,
          message:
            'Verifica el comentario.',
          errors,
        });
      }

      const activityResult =
        await pool.query(
          `
            SELECT
              id_actividad,
              id_creador,
              id_responsable
            FROM actividades
            WHERE id_actividad = $1
            LIMIT 1
          `,
          [idActividad],
        );

      const activity =
        activityResult.rows[0];

      if (!activity) {
        return response.status(404).json({
          ok: false,
          message:
            'La actividad no existe.',
        });
      }

      const isCreator =
        Number(activity.id_creador) ===
        request.auth.idUsuario;

      const isResponsible =
        Number(activity.id_responsable) ===
        request.auth.idUsuario;

      if (!isCreator && !isResponsible) {
        return response.status(403).json({
          ok: false,
          message:
            'Solo los participantes de la actividad pueden agregar comentarios.',
        });
      }

      const result = await pool.query(
        `
          WITH comentario_insertado AS (
            INSERT INTO comentarios (
              id_actividad,
              id_usuario,
              comentario
            )
            VALUES ($1, $2, $3)
            RETURNING
              id_comentario,
              id_usuario,
              comentario,
              creado_en
          )
          SELECT
            c.id_comentario AS id,
            c.comentario,
            c.creado_en AS "creadoEn",

            u.id_usuario AS "idUsuario",
            u.nombre AS autor,
            u.correo AS "correoAutor"

          FROM comentario_insertado c

          INNER JOIN usuarios u
            ON u.id_usuario = c.id_usuario
        `,
        [
          idActividad,
          request.auth.idUsuario,
          comentario,
        ],
      );

      const totalResult =
        await pool.query(
          `
            SELECT COUNT(*)::INTEGER AS total
            FROM comentarios
            WHERE id_actividad = $1
          `,
          [idActividad],
        );

      return response.status(201).json({
        ok: true,
        message:
          'Comentario registrado correctamente.',
        comentario: result.rows[0],
        totalComentarios:
          totalResult.rows[0].total,
      });
    } catch (error) {
      console.error(
        'Error registrando comentario:',
        error,
      );

      return response.status(500).json({
        ok: false,
        message:
          'No fue posible registrar el comentario.',
      });
    }
  },
);

app.use((_request, response) => {
  return response.status(404).json({
    ok: false,
    message: 'Ruta no encontrada.',
  });
});

app.listen(port, () => {
  console.log(
    `TASK BLOQ API: http://localhost:${port}`,
  );

  console.log(
    `Health: http://localhost:${port}/api/health`,
  );
});