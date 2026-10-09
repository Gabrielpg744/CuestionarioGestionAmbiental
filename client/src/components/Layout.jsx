import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.js';

const claseEnlace = ({ isActive }) =>
  `rounded-[10px] px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-primario text-white' : 'text-tinta hover:bg-fondo'
  }`;

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const conMenu = user && !user.debe_cambiar_password;

  const salir = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-t-[5px] border-acento bg-white px-5 py-2 shadow-sm sm:min-h-20 sm:px-12">
        <Link to="/">
          <img
            className="h-9 w-[90px] object-contain sm:h-[42px] sm:w-[110px]"
            src="/logo.png"
            alt="ALUDEC"
          />
        </Link>

        {conMenu ? (
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
            <NavLink to="/admin" end className={claseEnlace}>
              Resultados
            </NavLink>
            {user.rol === 'admin' && (
              <NavLink to="/admin/usuarios" className={claseEnlace}>
                Usuarios
              </NavLink>
            )}
            <span className="hidden px-2 text-sm text-suave sm:inline">{user.nombre}</span>
            <button className="btn-ghost" onClick={salir}>
              Salir
            </button>
          </nav>
        ) : user ? (
          <button className="btn-ghost" onClick={salir}>
            Salir
          </button>
        ) : (
          <Link to="/login" className="text-sm font-medium text-suave hover:text-tinta">
            Administración
          </Link>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="flex min-h-14 flex-wrap items-center justify-between gap-4 bg-primario px-5 py-4 text-xs text-white sm:px-12">
        <span>CIE ALUDEC</span>
        <span>Cuestionarios</span>
      </footer>
    </div>
  );
}
