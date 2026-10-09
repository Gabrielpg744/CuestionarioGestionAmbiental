import { describe, expect, it } from 'vitest';
import cuestionario from '../src/cuestionario.js';

const { preguntas, normalizarRespuestas, obtenerResultado } = cuestionario;

// Un envío con todas las preguntas calificadas bien.
const correcto = () => ({
  0: 'A123',
  1: 'Calidad',
  2: 'Sí',
  3: preguntas[3].opciones.slice(0, 2),
  4: 'Promover la protección del medio ambiente y el desarrollo sostenible.',
  5: 'Agua, energía y materias primas.',
  6: 'Sí, a través de la inducción del personal',
  7: ['Lonas Nave 1 y Nave 2', 'Intranet'],
  8: 'Mensual',
  9: 'Elemento de las actividades, productos o servicios de una organización que interactúa o puede interactuar con el medio ambiente.',
  10: 'Cambio en el medio ambiente, adverso o beneficioso, que resulta de los aspectos ambientales de una organización.',
  11: 'Sí',
  12: [preguntas[12].opciones[0]],
});

const calificar = (respuestas) => obtenerResultado(normalizarRespuestas(respuestas));

const rechaza = (respuestas, mensaje) => {
  try {
    normalizarRespuestas(respuestas);
  } catch (e) {
    expect(e.status).toBe(400);
    if (mensaje) expect(e.message).toMatch(mensaje);
    return;
  }
  throw new Error('Se esperaba un 400');
};

describe('obtenerResultado', () => {
  it('califica solo las 9 preguntas con clave confirmada', () => {
    const r = calificar(correcto());
    expect(r).toMatchObject({ correctas: 9, incorrectas: 0, total: 9, porcentaje: 100 });
    expect(r.detalles.map((d) => d.indice)).toEqual([2, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('cuenta una respuesta única equivocada', () => {
    const r = calificar({ ...correcto(), 2: 'No' });
    expect(r).toMatchObject({ correctas: 8, incorrectas: 1, porcentaje: 89 });
    expect(r.detalles.find((d) => d.indice === 2)).toMatchObject({ bien: false, numero: 1 });
  });

  it('en múltiple no importa el orden', () => {
    expect(calificar({ ...correcto(), 7: ['Intranet', 'Lonas Nave 1 y Nave 2'] }).correctas).toBe(
      9,
    );
  });

  it('en múltiple, marcar de más es incorrecto', () => {
    const r = calificar({
      ...correcto(),
      7: ['Lonas Nave 1 y Nave 2', 'Intranet', 'Tableros informativos'],
    });
    expect(r.correctas).toBe(8);
  });

  it('elegir "Otros" en una pregunta con clave es incorrecto', () => {
    expect(calificar({ ...correcto(), 8: 'Otros', 'otro-8': 'Semanal' }).correctas).toBe(8);
  });
});

describe('normalizarRespuestas', () => {
  it('recorta los textos y descarta claves que no son preguntas', () => {
    const limpias = normalizarRespuestas({
      ...correcto(),
      0: '  A123 ',
      99: 'cuela',
      calificacion: 100,
      'otro-2': 'no aplica',
    });
    expect(limpias[0]).toBe('A123');
    expect(Object.keys(limpias)).not.toContain('99');
    expect(Object.keys(limpias)).not.toContain('calificacion');
    expect(Object.keys(limpias)).not.toContain('otro-2');
  });

  it('guarda el texto de "Otros" solo cuando se eligió "Otros"', () => {
    expect(normalizarRespuestas({ ...correcto(), 'otro-8': 'Semanal' })).not.toHaveProperty(
      'otro-8',
    );
    expect(
      normalizarRespuestas({ ...correcto(), 8: 'Otros', 'otro-8': ' Semanal ' })['otro-8'],
    ).toBe('Semanal');
  });

  it('rechaza un envío sin respuestas', () => {
    rechaza(undefined, 'Faltan las respuestas');
    rechaza([], 'Faltan las respuestas');
  });

  it('rechaza un texto vacío o demasiado largo', () => {
    rechaza({ ...correcto(), 0: '   ' }, 'Número de control');
    rechaza({ ...correcto(), 1: 'x'.repeat(101) }, 'máximo 100');
  });

  it('rechaza una opción que no existe', () => {
    rechaza({ ...correcto(), 2: 'Tal vez' }, 'pregunta 1');
  });

  it('rechaza "Otros" sin especificar', () => {
    rechaza({ ...correcto(), 8: 'Otros' }, 'Especifica');
  });

  it('rechaza múltiples vacías, repetidas, con opciones ajenas o fuera de límite', () => {
    rechaza({ ...correcto(), 7: [] });
    rechaza({ ...correcto(), 7: ['Intranet', 'Intranet'] });
    rechaza({ ...correcto(), 7: ['Intranet', 'Por correo'] });
    rechaza({ ...correcto(), 3: preguntas[3].opciones.slice(0, 1) }, 'exactamente 2');
    rechaza({ ...correcto(), 3: preguntas[3].opciones.slice(0, 3) }, 'exactamente 2');
  });
});
