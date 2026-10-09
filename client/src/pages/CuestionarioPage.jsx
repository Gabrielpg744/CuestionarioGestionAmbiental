import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Pregunta from '../components/Pregunta.jsx';
import Resultado from '../components/Resultado.jsx';
import { estaContestada } from '../cuestionario.js';

export default function CuestionarioPage() {
  const [preguntas, setPreguntas] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [respuestas, setRespuestas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');

  useEffect(() => {
    api('/cuestionarios/preguntas')
      .then(setPreguntas)
      .catch((err) => setErrorCarga(err.message));
  }, []);

  const cambiarRespuesta = (indice, valor) => {
    setRespuestas((prev) => ({ ...prev, [indice]: valor }));
  };

  const seleccionarMultiple = (indice, opcion, limite) => {
    const actual = respuestas[indice] || [];

    if (actual.includes(opcion)) {
      cambiarRespuesta(
        indice,
        actual.filter((item) => item !== opcion),
      );
      return;
    }

    if (limite && actual.length >= limite) return;

    cambiarRespuesta(indice, [...actual, opcion]);
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (guardando || !preguntas) return;

    const faltante = preguntas.findIndex(
      (pregunta, indice) => !estaContestada(pregunta, indice, respuestas),
    );

    if (faltante !== -1) {
      document
        .getElementById(`pregunta-${faltante}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setGuardando(true);
    setErrorEnvio('');

    try {
      // La calificación la calcula el servidor; aquí solo se muestra.
      const envio = await api('/cuestionarios', { method: 'POST', body: { respuestas } });

      setResultado(envio.resultado);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setErrorEnvio(
        error.status === 400
          ? `No se pudo guardar el cuestionario: ${error.message}`
          : `No se pudo guardar el cuestionario: ${error.message}. Verifica que el servidor esté funcionando.`,
      );
    } finally {
      setGuardando(false);
    }
  };

  if (resultado) {
    return (
      <Resultado
        resultado={resultado}
        onReiniciar={() => {
          setRespuestas({});
          setResultado(null);
          setErrorEnvio('');
        }}
      />
    );
  }

  return (
    <section className="mx-auto w-[min(1000px,calc(100%-32px))] pt-9 pb-12 sm:pt-11 sm:pb-16">
      <div className="mb-8 sm:mb-10">
        <span className="mb-3.5 inline-block text-xs font-extrabold tracking-[1.5px] text-acento">
          CUESTIONARIO AMBIENTAL
        </span>
        <h1 className="mb-4 text-[29px] leading-snug font-bold sm:text-4xl">
          Conciencia del Sistema de Gestión Ambiental CIE
        </h1>
        <p className="max-w-[750px] text-[15px] leading-relaxed text-suave sm:text-base">
          <strong className="text-tinta">Objetivo:</strong> Conocer la percepción y el nivel de
          conocimiento de los participantes sobre los aspectos e impactos ambientales generados por
          sus actividades diarias o laborales, con el fin de promover acciones de mejora ambiental.
        </p>
        <p className="mt-2 max-w-[750px] text-[15px] leading-relaxed text-suave sm:text-base">
          Completa todos los campos y selecciona las respuestas que correspondan.
        </p>
      </div>

      <form className="card flex flex-col gap-5 p-3 sm:gap-7 sm:p-7" onSubmit={enviar}>
        <div className="border-b-2 border-borde px-1 pt-2 pb-6">
          <h2 className="mb-2 text-xl font-bold sm:text-2xl">Datos del participante</h2>
          <p className="text-[15px] text-suave">Información general</p>
        </div>

        {errorCarga && (
          <p role="alert" className="rounded-[10px] bg-red-50 px-4 py-3 text-sm text-mal">
            No se pudieron cargar las preguntas: {errorCarga}. Recarga la página.
          </p>
        )}
        {!preguntas && !errorCarga && (
          <p className="py-8 text-center text-sm text-suave">Cargando preguntas…</p>
        )}

        {preguntas?.map((pregunta, indice) => (
          <Pregunta
            key={indice}
            pregunta={pregunta}
            indice={indice}
            respuestas={respuestas}
            onCambiar={cambiarRespuesta}
            onSeleccionarMultiple={seleccionarMultiple}
          />
        ))}

        {errorEnvio && (
          <p role="alert" className="rounded-[10px] bg-red-50 px-4 py-3 text-sm text-mal">
            {errorEnvio}
          </p>
        )}

        <div className="flex justify-end pt-2">
          <button
            className="btn-primary min-h-12 w-full px-8 text-[15px] sm:w-auto"
            type="submit"
            disabled={guardando || !preguntas}
          >
            {guardando ? 'Guardando respuestas...' : 'Enviar cuestionario'}
          </button>
        </div>
      </form>
    </section>
  );
}
