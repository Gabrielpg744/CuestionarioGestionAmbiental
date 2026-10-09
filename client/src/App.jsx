import { useState } from 'react'
import './App.css'

const preguntas = [
  {
    tipo: 'texto',
    pregunta: 'Número de control',
  },
  {
    tipo: 'texto',
    pregunta: 'Departamento',
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
    pregunta: '¿Dentro de la organización has recibido alguna capacitación y/o explicación sobre la Política Ambiental?',
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
    pregunta: '¿Con qué frecuencia se te informa sobre los indicadores de desempeño ambiental (ejemplo: porcentaje de consumo de agua, consumo de electricidad, generación de residuos, etc.)?',
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
    pregunta: '¿Conoces en dónde están identificados los aspectos e impactos ambientales de tu área?',
    opciones: ['Sí', 'No'],
  },
  {
    tipo: 'multiple',
    pregunta: '¿Qué consecuencia puede generar el no clasificar adecuadamente los residuos generados en mi área de trabajo?',
    opciones: [
      'Incumplimiento a la política ambiental',
      'Ninguno',
      'Contaminar el agua',
      'Perder valor de los residuos reciclables generados',
      'Contaminar el aire',
      'Incumplimiento en los procedimientos del Sistema de Gestión Ambiental',
    ],
  },
]

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
    correcta: 'Elemento de las actividades, productos o servicios de una organización que interactúa o puede interactuar con el medio ambiente.',
  },
  10: {
    correcta: 'Cambio en el medio ambiente, adverso o beneficioso, que resulta de los aspectos ambientales de una organización.',
  },
  11: {
    correcta: 'Sí',
  },
  // La pregunta sobre clasificación de residuos queda pendiente
  // hasta confirmar las respuestas correctas.
}

function obtenerResultado(respuestas) {
  const detalles = Object.entries(claveCalificacion).map(
    ([indiceTexto, configuracion]) => {
      const indice = Number(indiceTexto)
      const respuesta = respuestas[indice]
      const correcta = configuracion.correcta

      let bien = false

      if (Array.isArray(correcta)) {
        bien =
          Array.isArray(respuesta) &&
          respuesta.length === correcta.length &&
          correcta.every((opcion) => respuesta.includes(opcion))
      } else {
        bien = respuesta === correcta
      }

      return {
        indice,
        numero: indice - 1,
        pregunta: preguntas[indice].pregunta,
        respuesta: respuesta ?? 'Sin respuesta',
        correcta,
        bien,
      }
    },
  )

  const correctas = detalles.filter((detalle) => detalle.bien).length
  const incorrectas = detalles.length - correctas

  return {
    detalles,
    correctas,
    incorrectas,
    total: detalles.length,
    porcentaje: detalles.length
      ? Math.round((correctas / detalles.length) * 100)
      : 0,
  }
}

function App() {
  const [respuestas, setRespuestas] = useState({})
  const [enviado, setEnviado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')

  const cambiarRespuesta = (indice, valor) => {
    setRespuestas((prev) => ({ ...prev, [indice]: valor }))
  }

  const seleccionarMultiple = (indice, opcion, limite) => {
    const actual = respuestas[indice] || []

    if (actual.includes(opcion)) {
      cambiarRespuesta(indice, actual.filter((item) => item !== opcion))
      return
    }

    if (limite && actual.length >= limite) return

    cambiarRespuesta(indice, [...actual, opcion])
  }

  const contestada = (pregunta, indice) => {
    const valor = respuestas[indice]

    if (pregunta.tipo === 'multiple') {
      return (
        Array.isArray(valor) &&
        valor.length > 0 &&
        (!pregunta.limite || valor.length === pregunta.limite)
      )
    }

    if (pregunta.tipo === 'texto') {
      return typeof valor === 'string' && valor.trim() !== ''
    }

    if (pregunta.otro && valor === 'Otros') {
      return Boolean(respuestas[`otro-${indice}`]?.trim())
    }

    return Boolean(valor)
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (guardando) return

    const faltantes = preguntas
      .map((pregunta, indice) => ({ pregunta, indice }))
      .filter(({ pregunta, indice }) => !contestada(pregunta, indice))

    if (faltantes.length > 0) {
      document
        .getElementById(`pregunta-${faltantes[0].indice}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setGuardando(true)
    setErrorEnvio('')

    try {
      // Calcular el resultado antes de enviar los datos.
      const calificacionCalculada = obtenerResultado(respuestas)

      const response = await fetch('http://localhost:3001/api/cuestionarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero_control: respuestas[0],
          departamento: respuestas[1],
          respuestas,
          calificacion: {
            correctas: calificacionCalculada.correctas,
            incorrectas: calificacionCalculada.incorrectas,
            total: calificacionCalculada.total,
            porcentaje: calificacionCalculada.porcentaje,
          },
        }),
      })

      const respuestaServidor = await response.json()

      if (!response.ok) {
        throw new Error(
          respuestaServidor.error || 'No se pudo guardar el cuestionario.',
        )
      }

      setEnviado(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setErrorEnvio(
        `No se pudo guardar el cuestionario: ${error.message}. Verifica que el servidor esté funcionando.`,
      )
    } finally {
      setGuardando(false)
    }
  }

  const resultado = obtenerResultado(respuestas)

  return (
    <main className="app">
      <header className="header">
        <div className="header-brand">
          <img className="logo" src="/logo.png" alt="ALUDEC" />
        </div>
        <div className="header-text">Cuestionarios</div>
      </header>

      {enviado ? (
        <section className="resultado">
          <div className="resultado-icono">✓</div>
          <h1>Cuestionario calificado</h1>

          <p>Gracias por responder el cuestionario.</p>
          <p>Tu cuestionario se guardó correctamente en la base de datos.</p>

          <h2>Tu resultado</h2>
          <p>
            Respuestas correctas: <strong>{resultado.correctas}</strong>
          </p>
          <p>
            Respuestas incorrectas: <strong>{resultado.incorrectas}</strong>
          </p>
          <p>
            Calificación: <strong>{resultado.porcentaje}/100</strong>
          </p>
          <p>Preguntas calificadas: {resultado.total}</p>

          <h2>Detalle de respuestas</h2>

          {resultado.detalles.map((detalle) => (
            <div
              key={detalle.indice}
              style={{
                textAlign: 'left',
                padding: '12px',
                margin: '10px 0',
                borderRadius: '8px',
                background: detalle.bien ? '#dcfce7' : '#fee2e2',
                color: '#1f2937',
              }}
            >
              <strong>
                {detalle.bien ? '✓ Correcta' : '✗ Incorrecta'} — Pregunta{' '}
                {detalle.numero}
              </strong>
              <p>{detalle.pregunta}</p>
              <p>
                Tu respuesta:{' '}
                {Array.isArray(detalle.respuesta)
                  ? detalle.respuesta.join(', ')
                  : detalle.respuesta}
              </p>
              {!detalle.bien && (
                <p>
                  Respuesta esperada:{' '}
                  {Array.isArray(detalle.correcta)
                    ? detalle.correcta.join(', ')
                    : detalle.correcta}
                </p>
              )}
            </div>
          ))}

          <p>
            Las preguntas de identificación no se califican. Las preguntas que
            aún no tienen una clave confirmada no se incluyen en el porcentaje.
          </p>

          <button
            className="btn-principal"
            onClick={() => {
              setRespuestas({})
              setEnviado(false)
              setErrorEnvio('')
            }}
          >
            Volver a comenzar
          </button>
        </section>
      ) : (
        <section className="contenido">
          <div className="introduccion">
            <span className="etiqueta">CUESTIONARIO AMBIENTAL</span>
            <h1>Conciencia del Sistema de Gestión Ambiental CIE</h1>
            <p>
              <strong>Objetivo:</strong> Conocer la percepción y el nivel de
              conocimiento de los participantes sobre los aspectos e impactos
              ambientales generados por sus actividades diarias o laborales,
              con el fin de promover acciones de mejora ambiental.
            </p>
            <p>
              Completa todos los campos y selecciona las respuestas que
              correspondan.
            </p>
          </div>

          <form
            className="tarjeta-pregunta cuestionario-completo"
            onSubmit={enviar}
          >
            <div className="seccion-titulo">
              <h2>Datos del participante</h2>
              <p>Información general</p>
            </div>

            {preguntas.map((pregunta, indice) => (
              <div
                className="pregunta-bloque"
                id={`pregunta-${indice}`}
                key={indice}
              >
                <label
                  className="pregunta-label"
                  htmlFor={`campo-${indice}`}
                >
                  {pregunta.tipo === 'texto' ? (
                    pregunta.pregunta
                  ) : (
                    <>
                      {indice - 1}. {pregunta.pregunta}
                    </>
                  )}
                  <span className="obligatorio"> *</span>
                </label>

                {pregunta.tipo === 'texto' && (
                  <input
                    id={`campo-${indice}`}
                    className="campo-texto"
                    type="text"
                    value={respuestas[indice] || ''}
                    onChange={(e) =>
                      cambiarRespuesta(indice, e.target.value)
                    }
                    placeholder="Escribe aquí..."
                    required
                  />
                )}

                {pregunta.tipo === 'unica' && (
                  <div className="opciones opciones-lista">
                    {pregunta.opciones.map((opcion) => (
                      <label
                        className={`opcion ${
                          respuestas[indice] === opcion
                            ? 'seleccionada'
                            : ''
                        }`}
                        key={opcion}
                      >
                        <input
                          type="radio"
                          name={`pregunta-${indice}`}
                          value={opcion}
                          checked={respuestas[indice] === opcion}
                          onChange={() => cambiarRespuesta(indice, opcion)}
                        />
                        <span>{opcion}</span>
                      </label>
                    ))}

                    {pregunta.otro && respuestas[indice] === 'Otros' && (
                      <input
                        className="campo-texto campo-otro"
                        type="text"
                        value={respuestas[`otro-${indice}`] || ''}
                        onChange={(e) =>
                          cambiarRespuesta(`otro-${indice}`, e.target.value)
                        }
                        placeholder="Especifica tu respuesta..."
                        required
                      />
                    )}
                  </div>
                )}

                {pregunta.tipo === 'multiple' && (
                  <>
                    <p className="indicacion">
                      {pregunta.limite
                        ? `Selecciona exactamente ${pregunta.limite} opciones.`
                        : 'Puedes seleccionar varias opciones.'}
                    </p>

                    <div className="opciones opciones-lista">
                      {pregunta.opciones.map((opcion) => {
                        const seleccionadas = respuestas[indice] || []
                        const marcada = seleccionadas.includes(opcion)

                        return (
                          <label
                            className={`opcion ${
                              marcada ? 'seleccionada' : ''
                            }`}
                            key={opcion}
                          >
                            <input
                              type="checkbox"
                              checked={marcada}
                              onChange={() =>
                                seleccionarMultiple(
                                  indice,
                                  opcion,
                                  pregunta.limite,
                                )
                              }
                            />
                            <span>{opcion}</span>
                          </label>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}

            {errorEnvio && (
              <p role="alert" style={{ color: '#b91c1c' }}>
                {errorEnvio}
              </p>
            )}

            <div className="acciones acciones-final">
              <button
                className="btn-principal"
                type="submit"
                disabled={guardando}
              >
                {guardando ? 'Guardando respuestas...' : 'Enviar cuestionario'}
              </button>
            </div>
          </form>
        </section>
      )}

      <footer className="footer">
        <span>CIE ALUDEC</span>
        <span>Cuestionarios</span>
      </footer>
    </main>
  )
}

export default App