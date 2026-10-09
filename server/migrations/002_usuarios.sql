-- Usuarios de la zona de administración (login.md §8). El cuestionario en sí es
-- público y no pasa por aquí.
--   password_hash: NULL para los usuarios que lleguen por el login central (sso).
--   external_id:   el `sub` del token del QMS; NULL para los usuarios locales.
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    password_hash TEXT,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('admin', 'consulta')),
    activo BOOLEAN NOT NULL DEFAULT true,
    debe_cambiar_password BOOLEAN NOT NULL DEFAULT true,
    external_id TEXT UNIQUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
