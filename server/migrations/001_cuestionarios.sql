-- Esquema inicial. Usa IF NOT EXISTS para adoptar bases creadas con el antiguo
-- server/sql/tablas.sql, que no traía las columnas de calificación.

CREATE TABLE IF NOT EXISTS cuestionarios_enviados (
    id BIGSERIAL PRIMARY KEY,
    numero_control VARCHAR(50) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    fecha_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE cuestionarios_enviados
    ADD COLUMN IF NOT EXISTS respuestas_correctas INTEGER,
    ADD COLUMN IF NOT EXISTS respuestas_incorrectas INTEGER,
    ADD COLUMN IF NOT EXISTS preguntas_calificadas INTEGER,
    ADD COLUMN IF NOT EXISTS calificacion INTEGER;

CREATE TABLE IF NOT EXISTS respuestas_cuestionario (
    id BIGSERIAL PRIMARY KEY,
    cuestionario_id BIGINT NOT NULL
        REFERENCES cuestionarios_enviados(id) ON DELETE CASCADE,
    numero_pregunta INTEGER NOT NULL,
    respuesta JSONB NOT NULL,
    UNIQUE (cuestionario_id, numero_pregunta)
);

CREATE INDEX IF NOT EXISTS idx_cuestionarios_numero_control
    ON cuestionarios_enviados(numero_control);

CREATE INDEX IF NOT EXISTS idx_cuestionarios_fecha
    ON cuestionarios_enviados(fecha_envio);
