-- =====================================================
-- TASK BLOQ
-- Migración inicial de base de datos
-- =====================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- USUARIOS
-- =====================================================

CREATE TABLE usuarios (
    id_usuario BIGSERIAL PRIMARY KEY,

    nombre VARCHAR(120) NOT NULL,

    correo VARCHAR(160) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    rol VARCHAR(20) NOT NULL DEFAULT 'USUARIO'
        CHECK (rol IN ('ADMIN', 'USUARIO')),

    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),

    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- REFRESH TOKENS
-- =====================================================

CREATE TABLE refresh_tokens (
    id_refresh_token BIGSERIAL PRIMARY KEY,

    id_usuario BIGINT NOT NULL,

    token_hash VARCHAR(64) NOT NULL UNIQUE,

    expira_en TIMESTAMPTZ NOT NULL,

    revocado_en TIMESTAMPTZ,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_refresh_token_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_usuario
    ON refresh_tokens(id_usuario);

CREATE INDEX idx_refresh_tokens_hash
    ON refresh_tokens(token_hash);

CREATE INDEX idx_refresh_tokens_expira
    ON refresh_tokens(expira_en);

-- =====================================================
-- ACTIVIDADES
-- =====================================================

CREATE TABLE actividades (
    id_actividad BIGSERIAL PRIMARY KEY,

    titulo VARCHAR(180) NOT NULL,

    descripcion TEXT,

    id_creador BIGINT NOT NULL,

    id_responsable BIGINT,

    fecha_limite DATE NOT NULL,

    estatus VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (
            estatus IN (
                'PENDIENTE',
                'EN_PROCESO',
                'EN_REVISION',
                'COMPLETADA'
            )
        ),

    prioridad VARCHAR(20) NOT NULL DEFAULT 'MEDIA'
        CHECK (
            prioridad IN (
                'ALTA',
                'MEDIA',
                'BAJA'
            )
        ),

    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_actividad_creador
        FOREIGN KEY (id_creador)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_actividad_responsable
        FOREIGN KEY (id_responsable)
        REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL
);

-- =====================================================
-- COMENTARIOS
-- =====================================================

CREATE TABLE comentarios (
    id_comentario BIGSERIAL PRIMARY KEY,

    id_actividad BIGINT NOT NULL,

    id_usuario BIGINT NOT NULL,

    comentario TEXT NOT NULL
        CHECK (LENGTH(TRIM(comentario)) > 0),

    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_comentario_actividad
        FOREIGN KEY (id_actividad)
        REFERENCES actividades(id_actividad)
        ON DELETE CASCADE,

    CONSTRAINT fk_comentario_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT
);

-- =====================================================
-- EVIDENCIAS
-- =====================================================

CREATE TABLE evidencias (
    id_evidencia BIGSERIAL PRIMARY KEY,

    id_actividad BIGINT NOT NULL,

    id_usuario_envia BIGINT NOT NULL,

    enlace TEXT NOT NULL,

    descripcion TEXT,

    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (
            estado IN (
                'PENDIENTE',
                'APROBADA',
                'RECHAZADA'
            )
        ),

    id_usuario_revisa BIGINT,

    observacion_revision TEXT,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    revisado_en TIMESTAMPTZ,

    CONSTRAINT fk_evidencia_actividad
        FOREIGN KEY (id_actividad)
        REFERENCES actividades(id_actividad)
        ON DELETE CASCADE,

    CONSTRAINT fk_evidencia_usuario_envia
        FOREIGN KEY (id_usuario_envia)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_evidencia_usuario_revisa
        FOREIGN KEY (id_usuario_revisa)
        REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL
);

-- =====================================================
-- ACTUALIZACIÓN AUTOMÁTICA DE FECHAS
-- =====================================================

CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_actualizado_en
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trg_actividades_actualizado_en
BEFORE UPDATE ON actividades
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_modificacion();

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_usuarios_rol
    ON usuarios(rol);

CREATE INDEX idx_usuarios_estado
    ON usuarios(estado);

CREATE INDEX idx_actividades_creador
    ON actividades(id_creador);

CREATE INDEX idx_actividades_responsable
    ON actividades(id_responsable);

CREATE INDEX idx_actividades_estatus
    ON actividades(estatus);

CREATE INDEX idx_actividades_prioridad
    ON actividades(prioridad);

CREATE INDEX idx_actividades_fecha_limite
    ON actividades(fecha_limite);

CREATE INDEX idx_comentarios_actividad
    ON comentarios(id_actividad);

CREATE INDEX idx_evidencias_actividad
    ON evidencias(id_actividad);

CREATE INDEX idx_evidencias_estado
    ON evidencias(estado);

COMMIT;

-- =====================================================
-- USUARIOS INICIALES
-- =====================================================

INSERT INTO usuarios (
    nombre,
    correo,
    password_hash,
    rol,
    estado
)
VALUES
(
    'Administrador TASK BLOQ',
    'admin@taskbloq.edu',
    crypt('TaskBloq2026', gen_salt('bf', 10)),
    'ADMIN',
    'ACTIVO'
),
(
    'Usuario TASK BLOQ',
    'usuario@taskbloq.edu',
    crypt('Usuario2026', gen_salt('bf', 10)),
    'USUARIO',
    'ACTIVO'
)
ON CONFLICT (correo)
DO UPDATE SET
    nombre = EXCLUDED.nombre,
    password_hash = EXCLUDED.password_hash,
    rol = EXCLUDED.rol,
    estado = EXCLUDED.estado,
    actualizado_en = NOW();