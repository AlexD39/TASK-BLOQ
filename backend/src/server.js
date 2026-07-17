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

      const estatus =
        typeof request.body?.estatus === 'string'
          ? request.body.estatus
              .trim()
              .toUpperCase()
          : 'PENDIENTE';

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