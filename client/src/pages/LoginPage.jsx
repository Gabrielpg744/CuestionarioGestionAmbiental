import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.js';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(usuario, password);
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
        <div className="mb-2 text-center">
          <img className="mx-auto mb-4 h-12 object-contain" src="/logo.png" alt="ALUDEC" />
          <h1 className="text-lg font-bold">Administración</h1>
          <p className="text-sm text-suave">Cuestionario de Gestión Ambiental CIE</p>
        </div>

        <div>
          <label className="label" htmlFor="usuario">
            Usuario
          </label>
          <input
            id="usuario"
            className="input"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p role="alert" className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-mal">
            {error}
          </p>
        )}

        <button className="btn-primary mt-2 min-h-11" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </section>
  );
}
