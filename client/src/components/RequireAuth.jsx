import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.js';

// Solo decide qué pantalla enseñar; quien protege los datos es el servidor.
export default function RequireAuth({ rol, children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (user === undefined) {
    return <p className="py-16 text-center text-sm text-suave">Cargando…</p>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.debe_cambiar_password && pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }
  if (rol && user.rol !== 'admin' && user.rol !== rol) return <Navigate to="/admin" replace />;

  return children;
}
