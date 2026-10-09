import { createContext, useContext } from 'react';

// user: undefined mientras se consulta /auth/me, null sin sesión.
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
