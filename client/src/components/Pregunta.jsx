export default function Pregunta({
  pregunta,
  indice,
  respuestas,
  onCambiar,
  onSeleccionarMultiple,
}) {
  const valor = respuestas[indice];

  return (
    <div
      id={`pregunta-${indice}`}
      className="scroll-mt-6 rounded-[10px] border border-borde bg-white px-4 py-6 shadow-sm sm:px-8 sm:py-8"
    >
      <label
        htmlFor={`campo-${indice}`}
        className="mb-5 block text-base leading-relaxed font-bold sm:mb-7 sm:text-[17px]"
      >
        {pregunta.tipo === 'texto' ? pregunta.pregunta : `${indice - 1}. ${pregunta.pregunta}`}
        <span className="font-extrabold text-acento"> *</span>
      </label>

      {pregunta.tipo === 'texto' && (
        <input
          id={`campo-${indice}`}
          className="input min-h-12 text-[15px]"
          type="text"
          value={valor || ''}
          onChange={(e) => onCambiar(indice, e.target.value)}
          placeholder="Escribe aquí..."
          maxLength={pregunta.max}
          required
        />
      )}

      {pregunta.tipo === 'unica' && (
        <div className="flex flex-col gap-3 sm:gap-4">
          {pregunta.opciones.map((opcion) => (
            <label className="opcion" key={opcion}>
              <input
                type="radio"
                name={`pregunta-${indice}`}
                value={opcion}
                checked={valor === opcion}
                onChange={() => onCambiar(indice, opcion)}
              />
              <span>{opcion}</span>
            </label>
          ))}

          {pregunta.otro && valor === 'Otros' && (
            <input
              className="input min-h-12 text-[15px]"
              type="text"
              value={respuestas[`otro-${indice}`] || ''}
              onChange={(e) => onCambiar(`otro-${indice}`, e.target.value)}
              placeholder="Especifica tu respuesta..."
              maxLength={500}
              required
            />
          )}
        </div>
      )}

      {pregunta.tipo === 'multiple' && (
        <>
          <p className="-mt-2 mb-4 text-sm text-suave">
            {pregunta.limite
              ? `Selecciona exactamente ${pregunta.limite} opciones.`
              : 'Puedes seleccionar varias opciones.'}
          </p>

          <div className="flex flex-col gap-3 sm:gap-4">
            {pregunta.opciones.map((opcion) => (
              <label className="opcion" key={opcion}>
                <input
                  type="checkbox"
                  checked={(valor || []).includes(opcion)}
                  onChange={() => onSeleccionarMultiple(indice, opcion, pregunta.limite)}
                />
                <span>{opcion}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
