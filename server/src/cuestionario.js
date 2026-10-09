// Definición del cuestionario, su clave y la calificación. Es la ÚNICA fuente:
// el client pide las preguntas (sin la clave) a GET /api/cuestionarios/preguntas
// y la calificación se calcula aquí, nunca en el navegador.

const preguntas = [
  {
    tipo: 'texto',
    pregunta: 'Número de control',
    max: 50,
  },
  {
    tipo: 'texto',
    pregunta: 'Departamento',
    max: 100,
  },
  {
    tipo: 'unica',
    pregunta: '¿Conoce si la empresa cuenta con un Sistema de Gestión Ambiental (SGA)?',
    opciones: ['Sí', 'No', 'No estoy seguro'],
  },
  {
    tipo: 'multiple',
    limite: 2,
    pregunta: '¿Cómo contribuyes al cumplimiento de la Política Ambiental?',
    opciones: [
      'Fomentando el uso responsable de los recursos naturales como el agua, optimizando su consumo y prevención a su contaminación tras su uso',
      'Mezclar los residuos para ahorrar espacio.',
      'Ignorar derrames o fugas pequeñas.',
      'Desperdiciar agua y energía durante la operación.',
    ],
  },
  {
    tipo: 'unica',
    pregunta: '¿Cuál es el propósito principal de la Política de Medio Ambiente?',
    opciones: [
      'Incrementar la producción sin restricciones.',
      'Promover la protección del medio ambiente y el desarrollo sostenible.',
      'Reducir únicamente los costos operativos.',
      'Aumentar el consumo de recursos naturales.',
    ],
  },
  {
    tipo: 'unica',
    pregunta: '¿Cuál de los siguientes recursos debe utilizarse de manera responsable?',
    opciones: [
      'Agua, energía y materias primas.',
      'Únicamente la energía eléctrica.',
      'Solo el agua potable.',
      'Ninguno de los anteriores.',
    ],
  },
  {
    tipo: 'unica',
    pregunta:
      '¿Dentro de la organización has recibido alguna capacitación y/o explicación sobre la Política Ambiental?',
    opciones: [
      'Sí, a través de la inducción del personal',
      'Reforzamiento en las juntas de operación diarias',
      'No he recibido capacitación',
      'Otros',
    ],
    otro: true,
  },
  {
    tipo: 'multiple',
    pregunta: '¿Dónde puedes consultar la Política Ambiental?',
    opciones: [
      'Lonas Nave 1 y Nave 2',
      'Intranet',
      'Tableros informativos',
      'Páginas oficiales de Aludec',
      'En los baños',
      'En el comedor',
    ],
  },
  {
    tipo: 'unica',
    pregunta:
      '¿Con qué frecuencia se te informa sobre los indicadores de desempeño ambiental (ejemplo: porcentaje de consumo de agua, consumo de electricidad, generación de residuos, etc.)?',
    opciones: ['Mensual', 'Cuatrimestral', 'Cada 6 meses', 'Otros'],
    otro: true,
  },
  {
    tipo: 'unica',
    pregunta: '¿Qué es un Aspecto Ambiental?',
    opciones: [
      'Sustancias y desechos generados por la operación que pueden contaminar el ambiente.',
      'Conjunto de leyes y normas ambientales que debe cumplir la organización.',
      'Elemento de las actividades, productos o servicios de una organización que interactúa o puede interactuar con el medio ambiente.',
      'Cualquier componente del medio ambiente que influye en las operaciones de la organización.',
      'Acciones positivas realizadas por la empresa para cuidar la naturaleza.',
    ],
  },
  {
    tipo: 'unica',
    pregunta: '¿Qué es un Impacto Ambiental?',
    opciones: [
      'Efecto permanente y destructivo que provoca una empresa en la naturaleza.',
      'Opinión social acerca de cómo la empresa afecta al ambiente.',
      'Consecuencia legal por no seguir las normas ambientales.',
      'Acciones que la organización realiza para conservar el ambiente.',
      'Cambio en el medio ambiente, adverso o beneficioso, que resulta de los aspectos ambientales de una organización.',
    ],
  },
  {
    tipo: 'unica',
    pregunta:
      '¿Conoces en dónde están identificados los aspectos e impactos ambientales de tu área?',
    opciones: ['Sí', 'No'],
  },
  {
    tipo: 'multiple',
    pregunta:
      '¿Qué consecuencia puede generar el no clasificar adecuadamente los residuos generados en mi área de trabajo?',
    opciones: [
      'Incumplimiento a la política ambiental',
      'Ninguno',
      'Contaminar el agua',
      'Perder valor de los residuos reciclables generados',
      'Contaminar el aire',
      'Incumplimiento en los procedimientos del Sistema de Gestión Ambiental',
    ],
  },
];

// Solo se califican las preguntas cuya clave está confirmada.
// Los índices corresponden a posiciones del arreglo preguntas.
const claveCalificacion = {
  2: {
    correcta: 'Sí',
  },
  // La pregunta de contribución ambiental está pendiente de confirmar
  // sus dos respuestas correctas.
  4: {
    correcta: 'Promover la protección del medio ambiente y el desarrollo sostenible.',
  },
  5: {
    correcta: 'Agua, energía y materias primas.',
  },
  6: {
    correcta: 'Sí, a través de la inducción del personal',
  },
  7: {
    correcta: ['Lonas Nave 1 y Nave 2', 'Intranet'],
  },
  8: {
    correcta: 'Mensual',
  },
  9: {
    correcta:
      'Elemento de las actividades, productos o servicios de una organización que interactúa o puede interactuar con el medio ambiente.',
  },
  10: {
    correcta:
      'Cambio en el medio ambiente, adverso o beneficioso, que resulta de los aspectos ambientales de una organización.',
  },
  11: {
    correcta: 'Sí',
  },
  // La pregunta sobre clasificación de residuos queda pendiente
  // hasta confirmar las respuestas correctas.
};

function obtenerResultado(respuestas) {
  const detalles = Object.entries(claveCalificacion).map(([indiceTexto, configuracion]) => {
    const indice = Number(indiceTexto);
    const respuesta = respuestas[indice];
    const correcta = configuracion.correcta;

    const bien = Array.isArray(correcta)
      ? Array.isArray(respuesta) &&
        respuesta.length === correcta.length &&
        correcta.every((opcion) => respuesta.includes(opcion))
      : respuesta === correcta;

    return {
      indice,
      numero: indice - 1,
      pregunta: preguntas[indice].pregunta,
      respuesta: respuesta ?? 'Sin respuesta',
      correcta,
      bien,
    };
  });

  const correctas = detalles.filter((detalle) => detalle.bien).length;
  const incorrectas = detalles.length - correctas;

  return {
    detalles,
    correctas,
    incorrectas,
    total: detalles.length,
    porcentaje: detalles.length ? Math.round((correctas / detalles.length) * 100) : 0,
  };
}

const MAX_OTRO = 500;

function errorValidacion(mensaje) {
  const error = new Error(mensaje);
  error.status = 400;
  return error;
}

const etiqueta = (pregunta, indice) =>
  pregunta.tipo === 'texto' ? `"${pregunta.pregunta}"` : `la pregunta ${indice - 1}`;

// Valida un envío contra la definición y devuelve solo lo que vale: cada
// respuesta tiene que ser una de las opciones de su pregunta, así que no se
// puede colar texto libre ni claves que no existan. Lanza un 400 si algo falta
// o no cuadra.
function normalizarRespuestas(respuestas) {
  if (!respuestas || typeof respuestas !== 'object' || Array.isArray(respuestas)) {
    throw errorValidacion('Faltan las respuestas.');
  }

  const limpias = {};

  preguntas.forEach((pregunta, indice) => {
    const valor = respuestas[indice];
    const nombre = etiqueta(pregunta, indice);

    if (pregunta.tipo === 'texto') {
      const texto = typeof valor === 'string' ? valor.trim() : '';
      if (!texto) throw errorValidacion(`Falta responder ${nombre}.`);
      if (texto.length > pregunta.max) {
        throw errorValidacion(`${nombre} admite como máximo ${pregunta.max} caracteres.`);
      }
      limpias[indice] = texto;
      return;
    }

    if (pregunta.tipo === 'unica') {
      if (!pregunta.opciones.includes(valor)) {
        throw errorValidacion(`Falta responder ${nombre}.`);
      }
      limpias[indice] = valor;

      if (pregunta.otro && valor === 'Otros') {
        const otro = respuestas[`otro-${indice}`];
        const texto = typeof otro === 'string' ? otro.trim() : '';
        if (!texto) throw errorValidacion(`Especifica tu respuesta en ${nombre}.`);
        if (texto.length > MAX_OTRO) {
          throw errorValidacion(
            `La respuesta de ${nombre} admite como máximo ${MAX_OTRO} caracteres.`,
          );
        }
        limpias[`otro-${indice}`] = texto;
      }
      return;
    }

    // multiple
    if (
      !Array.isArray(valor) ||
      valor.length === 0 ||
      new Set(valor).size !== valor.length ||
      !valor.every((opcion) => pregunta.opciones.includes(opcion))
    ) {
      throw errorValidacion(`Falta responder ${nombre}.`);
    }
    if (pregunta.limite && valor.length !== pregunta.limite) {
      throw errorValidacion(`En ${nombre} selecciona exactamente ${pregunta.limite} opciones.`);
    }
    limpias[indice] = valor;
  });

  return limpias;
}

// `preguntas` no lleva la clave (vive aparte, en claveCalificacion): es seguro
// mandarla al navegador.
module.exports = { preguntas, normalizarRespuestas, obtenerResultado };
