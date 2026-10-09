import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api } from './api.js';
import { AuthContext } from './auth.js';
import Layout from './components/Layout.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import CambiarPasswordPage from './pages/CambiarPasswordPage.jsx';
import CuestionarioPage from './pages/CuestionarioPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ResultadosPage from './pages/ResultadosPage.jsx';
import UsuariosPage from './pages/UsuariosPage.jsx';

export default function App() {
  const [user, setUser] = useState(undefined);

  const refrescar = useCallback(
    () =>
      api('/auth/me')
        .then(setUser)
        .catch(() => setUser(null)),
    [],
  );

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const auth = useMemo(
    () => ({
      user,
      refrescar,
      login: async (usuario, password) => {
        const u = await api('/auth/login', { method: 'POST', body: { usuario, password } });
        setUser(u);
        return u;
      },
      logout: async () => {
        await api('/auth/logout', { method: 'POST' });
        setUser(null);
      },
    }),
    [user, refrescar],
  );

  return (
    <AuthContext.Provider value={auth}>
      <Layout>
        <Routes>
          <Route path="/" element={<CuestionarioPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/cambiar-password"
            element={
              <RequireAuth>
                <CambiarPasswordPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <ResultadosPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <RequireAuth rol="admin">
                <UsuariosPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthContext.Provider>
  );
}
