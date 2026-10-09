// Comprobación de UX: llevar a quien contesta a la primera pregunta sin
// responder. La validación que cuenta es la del servidor (server/src/cuestionario.js).

export function estaContestada(pregunta, indice, respuestas) {
  const valor = respuestas[indice];

  if (pregunta.tipo === 'multiple') {
    return (
      Array.isArray(valor) &&
      valor.length > 0 &&
      (!pregunta.limite || valor.length === pregunta.limite)
    );
  }

  if (pregunta.tipo === 'texto') {
    return typeof valor === 'string' && valor.trim() !== '';
  }

  if (pregunta.otro && valor === 'Otros') {
    return Boolean(respuestas[`otro-${indice}`]?.trim());
  }

  return Boolean(valor);
}
