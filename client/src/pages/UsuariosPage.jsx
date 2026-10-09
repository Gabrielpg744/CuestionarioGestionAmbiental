import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.js';

const ROLES = { admin: 'Admin', consulta: 'Consulta' };
const NUEVO = { usuario: '', nombre: '', rol: 'consulta' };

export default function UsuariosPage() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState(null);
  const [nuevo, setNuevo] = useState(NUEVO);
  const [temporal, setTemporal] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api('/usuarios')
      .then(setUsuarios)
      .catch((err) => setError(err.message));
  }, []);

  const reemplazar = (u) => setUsuarios((prev) => prev.map((x) => (x.id === u.id ? u : x)));

  const ejecutar = async (accion) => {
    setError('');
    try {
      await accion();
    } catch (err) {
      setError(err.message);
    }
  };

  const crear = (e) => {
    e.preventDefault();
    setGuardando(true);
    ejecutar(async () => {
      const { password_temporal, ...u } = await api('/usuarios', { method: 'POST', body: nuevo });
      setUsuarios((prev) => [...prev, u].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setTemporal({ usuario: u.usuario, password: password_temporal });
      setNuevo(NUEVO);
    }).finally(() => setGuardando(false));
  };

  const actualizar = (id, cambios) =>
    ejecutar(async () => {
      reemplazar(await api(`/usuarios/${id}`, { method: 'PATCH', body: cambios }));
    });

  const reiniciar = (u) => {
    if (!window.confirm(`¿Generar una contraseña temporal nueva para ${u.nombre}?`)) return;
    ejecutar(async () => {
      const { password_temporal, ...actualizado } = await api(
        `/usuarios/${u.id}/reiniciar-password`,
        { method: 'POST' },
      );
      reemplazar(actualizado);
      setTemporal({ usuario: actualizado.usuario, password: password_temporal });
    });
  };

  return (
    <section className="mx-auto w-[min(1100px,calc(100%-32px))] py-10">
      <h1 className="mb-6 text-2xl font-bold">Usuarios</h1>

      {temporal && (
        <div className="mb-6 rounded-[10px] border border-acento bg-orange-50 px-4 py-3 text-sm">
          <p>
            Contraseña temporal de <strong>{temporal.usuario}</strong>:{' '}
            <code className="rounded bg-white px-2 py-0.5 font-mono text-base">
              {temporal.password}
            </code>
          </p>
          <p className="mt-1 text-suave">
            Dísela a la persona ahora: no se volverá a mostrar. Se le pedirá cambiarla al entrar.
          </p>
          <button className="btn-ghost mt-3" onClick={() => setTemporal(null)}>
            Listo
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-6 rounded-[10px] bg-red-50 px-4 py-3 text-sm text-mal">
          {error}
        </p>
      )}

      <form className="card mb-6 grid gap-4 sm:grid-cols-[1fr_1.5fr_auto_auto]" onSubmit={crear}>
        <div>
          <label className="label" htmlFor="nuevo-usuario">
            Usuario
          </label>
          <input
            id="nuevo-usuario"
            className="input"
            value={nuevo.usuario}
            onChange={(e) => setNuevo({ ...nuevo, usuario: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="nuevo-nombre">
            Nombre
          </label>
          <input
            id="nuevo-nombre"
            className="input"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="nuevo-rol">
            Rol
          </label>
          <select
            id="nuevo-rol"
            className="input"
            value={nuevo.rol}
            onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}
          >
            {Object.entries(ROLES).map(([valor, nombre]) => (
              <option key={valor} value={valor}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn-primary w-full" type="submit" disabled={guardando}>
            Agregar
          </button>
        </div>
      </form>

      {usuarios === null && !error && <p className="text-sm text-suave">Cargando…</p>}

      {usuarios && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-borde bg-fondo">
              <tr>
                <th className="th">Usuario</th>
                <th className="th">Nombre</th>
                <th className="th">Rol</th>
                <th className="th">Estado</th>
                <th className="th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {usuarios.map((u) => {
                const propio = u.id === user.id;
                return (
                  <tr key={u.id} className={u.activo ? '' : 'text-suave'}>
                    <td className="td font-medium">{u.usuario}</td>
                    <td className="td">{u.nombre}</td>
                    <td className="td">
                      <select
                        className="input w-auto py-1"
                        value={u.rol}
                        disabled={propio}
                        onChange={(e) => actualizar(u.id, { rol: e.target.value })}
                        aria-label={`Rol de ${u.usuario}`}
                      >
                        {Object.entries(ROLES).map(([valor, nombre]) => (
                          <option key={valor} value={valor}>
                            {nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="td">
                      {u.activo ? (
                        <span className="badge bg-green-100 text-green-700">Activo</span>
                      ) : (
                        <span className="badge bg-slate-200 text-slate-500">Inactivo</span>
                      )}
                      {u.activo && u.debe_cambiar_password && (
                        <span className="badge ml-2 bg-orange-100 text-orange-700">
                          Contraseña temporal
                        </span>
                      )}
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-2">
                        <button className="btn-ghost py-1" onClick={() => reiniciar(u)}>
                          Reiniciar contraseña
                        </button>
                        {!propio && (
                          <button
                            className="btn-ghost py-1"
                            onClick={() => actualizar(u.id, { activo: !u.activo })}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
