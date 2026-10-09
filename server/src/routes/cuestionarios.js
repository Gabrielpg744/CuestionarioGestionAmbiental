const express = require('express');
const { pool, query } = require('../db');
const { requireRol } = require('../auth');
const { preguntas, normalizarRespuestas, obtenerResultado } = require('../cuestionario');

const router = express.Router();

// Resultados: zona de administración. Las preguntas y el envío de abajo son
// públicos (los usa el personal sin cuenta).
router.get('/', requireRol('consulta'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, numero_control, departamento, fecha_envio, respuestas_correctas,
              respuestas_incorrectas, preguntas_calificadas, calificacion
       FROM cuestionarios_enviados
       ORDER BY fecha_envio DESC`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// Las preguntas para contestar, sin la clave de calificación. Público.
router.get('/preguntas', (req, res) => {
  res.json(preguntas);
});

// Envío público. El servidor valida las respuestas y calcula la calificación;
// lo que mande el navegador como calificación se ignora.
router.post('/', async (req, res, next) => {
  let respuestas;
  try {
    respuestas = normalizarRespuestas(req.body.respuestas);
  } catch (e) {
    return next(e);
  }
  const resultado = obtenerResultado(respuestas);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Guardar el cuestionario y su calificación
    const { rows } = await client.query(
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
        respuestas[0],
        respuestas[1],
        resultado.correctas,
        resultado.incorrectas,
        resultado.total,
        resultado.porcentaje,
      ],
    );

    const cuestionario = rows[0];

    // Guardar las respuestas individuales
    for (let indice = 0; indice < preguntas.length; indice++) {
      const otro = respuestas[`otro-${indice}`];
      const respuesta = { valor: respuestas[indice], ...(otro !== undefined ? { otro } : {}) };

      await client.query(
        `INSERT INTO respuestas_cuestionario
         (cuestionario_id, numero_pregunta, respuesta)
         VALUES ($1, $2, $3::jsonb)`,
        [cuestionario.id, indice, JSON.stringify(respuesta)],
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      ok: true,
      mensaje: 'Cuestionario guardado correctamente.',
      id: cuestionario.id,
      fecha_envio: cuestionario.fecha_envio,
      resultado,
    });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
});

module.exports = router;
