const formatear = (valor) => (Array.isArray(valor) ? valor.join(', ') : valor);

export default function Resultado({ resultado, onReiniciar }) {
  return (
    <section className="mx-auto w-[min(650px,calc(100%-32px))] py-12 text-center sm:py-16">
      <div className="mx-auto mb-6 flex size-[72px] items-center justify-center rounded-full bg-acento-suave text-4xl font-extrabold text-tinta">
        ✓
      </div>
      <h1 className="mb-4 text-3xl leading-snug font-bold">Cuestionario calificado</h1>
      <p className="leading-relaxed text-suave">Gracias por responder el cuestionario.</p>
      <p className="mb-8 leading-relaxed text-suave">
        Tu cuestionario se guardó correctamente en la base de datos.
      </p>

      <div className="card mb-8 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-ok">{resultado.correctas}</div>
          <div className="text-xs text-suave">Correctas</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-mal">{resultado.incorrectas}</div>
          <div className="text-xs text-suave">Incorrectas</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{resultado.porcentaje}/100</div>
          <div className="text-xs text-suave">Calificación</div>
        </div>
      </div>
      <p className="mb-8 text-sm text-suave">Preguntas calificadas: {resultado.total}</p>

      <h2 className="mb-4 text-left text-xl font-bold">Detalle de respuestas</h2>

      <div className="flex flex-col gap-3 text-left">
        {resultado.detalles.map((detalle) => (
          <div
            key={detalle.indice}
            className={`card border-l-4 ${detalle.bien ? 'border-l-ok' : 'border-l-mal'}`}
          >
            <span
              className={`badge ${detalle.bien ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
            >
              {detalle.bien ? '✓ Correcta' : '✗ Incorrecta'}
            </span>
            <span className="ml-2 text-sm font-semibold">Pregunta {detalle.numero}</span>
            <p className="mt-2 text-sm">{detalle.pregunta}</p>
            <p className="mt-2 text-sm text-suave">
              Tu respuesta: <span className="text-tinta">{formatear(detalle.respuesta)}</span>
            </p>
            {!detalle.bien && (
              <p className="mt-1 text-sm text-suave">
                Respuesta esperada:{' '}
                <span className="text-tinta">{formatear(detalle.correcta)}</span>
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="my-8 text-sm leading-relaxed text-suave">
        Las preguntas de identificación no se califican. Las preguntas que aún no tienen una clave
        confirmada no se incluyen en el porcentaje.
      </p>

      <button className="btn-primary min-h-12 w-full px-8 sm:w-auto" onClick={onReiniciar}>
        Volver a comenzar
      </button>
    </section>
  );
}
