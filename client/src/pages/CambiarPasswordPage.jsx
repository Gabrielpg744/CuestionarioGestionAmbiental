import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.js';

const LONGITUD_MINIMA = 8;

export default function CambiarPasswordPage() {
  const { user, refrescar } = useAuth();
  const navigate = useNavigate();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (nueva.length < LONGITUD_MINIMA) {
      setError(`La nueva contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres`);
      return;
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setEnviando(true);
    try {
      await api('/auth/cambiar-password', { method: 'POST', body: { actual, nueva } });
      await refrescar();
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="flex justify-center px-4 py-16">
      <form className="card flex w-full max-w-sm flex-col gap-4 p-7" onSubmit={enviar}>
        <div className="mb-2">
          <h1 className="text-lg font-bold">Cambiar contraseña</h1>
          {user?.debe_cambiar_password && (
            <p className="mt-1 text-sm text-suave">
              Entraste con una contraseña temporal. Elige una propia para continuar.
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="actual">
            Contraseña actual
          </label>
          <input
            id="actual"
            className="input"
            type="password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="nueva">
            Nueva contraseña
          </label>
          <input
            id="nueva"
            className="input"
            type="password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            autoComplete="new-password"
            required
          />
          <p className="mt-1 text-xs text-suave">Al menos {LONGITUD_MINIMA} caracteres.</p>
        </div>
        <div>
          <label className="label" htmlFor="confirmar">
            Confirmar nueva contraseña
          </label>
          <input
            id="confirmar"
            className="input"
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {error && (
          <p role="alert" className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-mal">
            {error}
          </p>
        )}

        <button className="btn-primary mt-2 min-h-11" type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </section>
  );
}
