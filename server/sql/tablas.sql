
CREATE TABLE IF NOT EXISTS cuestionarios_enviados (
    id BIGSERIAL PRIMARY KEY,
    numero_control VARCHAR(50) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    fecha_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
