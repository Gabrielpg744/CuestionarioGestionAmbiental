const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/estado', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, base: process.env.DB_NAME });
  } catch (error) {
    console.error('Error de conexión:', error.message);
    res.status(500).json({
      error: 'Error de conexión con la base de datos'
    });
  }
});

app.post('/api/cuestionarios', async (req, res) => {
  const {
    numero_control,
    departamento,
    respuestas,
    calificacion
  } = req.body;

  if (
    typeof numero_control !== 'string' ||
    !numero_control.trim() ||
    typeof departamento !== 'string' ||
    !departamento.trim() ||
    !respuestas ||
    typeof respuestas !== 'object' ||
    Array.isArray(respuestas)
  ) {
    return res.status(400).json({
      error: 'Faltan el número de control, departamento o respuestas.'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Guardar el cuestionario y su calificación
    const resultado = await client.query(
      `INSERT INTO cuestionarios_enviados
       (
         numero_control,
         departamento,
         respuestas_correctas,
         respuestas_incorrectas,
         preguntas_calificadas,
         calificacion
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, fecha_envio`,
      [
        numero_control.trim(),
        departamento.trim(),
        calificacion?.correctas ?? null,
        calificacion?.incorrectas ?? null,
        calificacion?.total ?? null,
        calificacion?.porcentaje ?? null
      ]
    );

    const cuestionario = resultado.rows[0];

    // Guardar las respuestas individuales
    for (const [clave, valor] of Object.entries(respuestas)) {
      if (!/^\d+$/.test(clave)) continue;

      const respuesta = {
        valor,
        ...(Object.prototype.hasOwnProperty.call(
          respuestas,
          `otro-${clave}`
        )
          ? { otro: respuestas[`otro-${clave}`] }
          : {})
      };

      await client.query(
        `INSERT INTO respuestas_cuestionario
         (cuestionario_id, numero_pregunta, respuesta)
         VALUES ($1, $2, $3::jsonb)`,
        [
          cuestionario.id,
          Number(clave),
          JSON.stringify(respuesta)
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      ok: true,
      mensaje: 'Cuestionario guardado correctamente.',
      id: cuestionario.id,
      fecha_envio: cuestionario.fecha_envio
    });
  } catch (error) {
    await client.query('ROLLBACK');

    console.error(
      'Error al guardar cuestionario:',
      error.message
    );

    res.status(500).json({
      error: 'No se pudo guardar el cuestionario.'
    });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(
    `API de cuestionarios disponible en http://localhost:${PORT}`
  );
});