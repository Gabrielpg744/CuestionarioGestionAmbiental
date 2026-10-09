import { useEffect, useState } from 'react';
import { api } from '../api.js';

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function ResultadosPage() {
  const [envios, setEnvios] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/cuestionarios')
      .then(setEnvios)
      .catch((err) => setError(err.message));
  }, []);

  const calificados = (envios || []).filter((e) => e.calificacion !== null);
  const promedio = calificados.length
    ? Math.round(calificados.reduce((suma, e) => suma + e.calificacion, 0) / calificados.length)
    : null;

  return (
    <section className="mx-auto w-[min(1100px,calc(100%-32px))] py-10">
      <h1 className="mb-6 text-2xl font-bold">Resultados</h1>

      {error && (
        <p role="alert" className="mb-6 rounded-[10px] bg-red-50 px-4 py-3 text-sm text-mal">
          {error}
        </p>
      )}

      {envios === null && !error && <p className="text-sm text-suave">Cargando…</p>}

      {envios && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="card">
              <div className="text-sm text-suave">Cuestionarios recibidos</div>
              <div className="text-3xl font-bold">{envios.length}</div>
            </div>
            <div className="card">
              <div className="text-sm text-suave">Calificación promedio</div>
              <div className="text-3xl font-bold">{promedio ?? '—'}</div>
            </div>
          </div>

          {envios.length === 0 ? (
            <p className="card text-center text-sm text-suave">Aún no hay cuestionarios.</p>
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full min-w-[640px]">
                <thead className="border-b border-borde bg-fondo">
                  <tr>
                    <th className="th">Fecha</th>
                    <th className="th">Número de control</th>
                    <th className="th">Departamento</th>
                    <th className="th text-right">Correctas</th>
                    <th className="th text-right">Incorrectas</th>
                    <th className="th text-right">Calificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {envios.map((e) => (
                    <tr key={e.id}>
                      <td className="td whitespace-nowrap text-suave">
                        {formatoFecha.format(new Date(e.fecha_envio))}
                      </td>
                      <td className="td font-medium">{e.numero_control}</td>
                      <td className="td">{e.departamento}</td>
                      <td className="td text-right">{e.respuestas_correctas ?? '—'}</td>
                      <td className="td text-right">{e.respuestas_incorrectas ?? '—'}</td>
                      <td className="td text-right font-semibold">{e.calificacion ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
