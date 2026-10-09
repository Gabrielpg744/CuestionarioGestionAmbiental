# Decisiones y desviaciones de este sistema

Desviaciones respecto a `stack.md` / `styles.md`, justificadas como pide la política
del QMS (*default fuerte, flexible*).

## Versiones más nuevas que las de lab

| Pieza | `stack.md` (lab) | Aquí | Motivo |
|---|---|---|---|
| React | `^18.3` | `^19.2` | El proyecto nació con React 19 (plantilla de Vite). No hay nada que gane bajándolo y 19 es la línea con soporte. |
| Vite | `^5.4` | `^8.3` | Mismo motivo; Tailwind v4 (`@tailwindcss/vite`) lo soporta. |
| react-router-dom | `^6.26` | `^7.18` | La línea 6 tiene avisos de seguridad (open redirect en `<Link>`/`useNavigate`) sin parche en 6.x. La 7 conserva la API declarativa (`BrowserRouter`, `Routes`, `Route`). |
| Express | `^4.21` | `^5.2` | El proyecto nació con Express 5. Las rutas siguen la convención de `stack.md` (`try/catch` + `next(e)`), que funciona igual en 4 y 5; además Express 5 reenvía solo los rechazos de handlers `async` al middleware de error. |

El resto del core (Node 24, `pg`, migraciones SQL con `_migraciones`, Tailwind v4 con el
`@theme` de `styles.md`, helper `api()` único, error centralizado) sigue la línea.

## Puertos propios: API `:3040`, Vite `:5177`

`stack.md` pone `:3000` / `:5173`, que son los de lab. Este sistema corre en la misma
máquina que lab, y con los mismos puertos uno de los dos no arranca o, peor, el proxy
de Vite le manda las peticiones al API del otro. `login.md` ya da por hecho que cada
sistema vive en su puerto (`:3000`, `:3033`, portal `:5190`). El API toma `PORT` del
`.env` si se define.

## Auth: el login protege solo la administración

El cuestionario es **público**: lo contesta el personal de planta con su número de
control, sin cuenta. Pedir login para contestar obligaría a dar de alta a todo el
personal. El login (`login.md`) protege la zona de administración:

| Rol | Puede |
|---|---|
| `admin` | Ver resultados y administrar usuarios |
| `consulta` | Ver resultados |

Consecuencias:

- `POST /api/cuestionarios` no lleva sesión, así que los envíos **no tienen FK a
  `usuarios(id)`**: quien contesta no es un usuario del sistema. La FK de
  trazabilidad que pide `login.md` §8 aplicará a lo que hagan los usuarios de
  administración cuando haya algo que atribuir (hoy solo leen).
- Solo está `AUTH_MODE=standalone`. Con cualquier otro valor el servidor no
  arranca, en vez de arrancar sin proteger nada. `usuarios` ya trae `external_id`
  y `password_hash` admite NULL para cuando llegue el modo `sso`.
- La cookie de sesión se llama `cuestionarios.sid` y no `connect.sid`: las cookies
  no distinguen puertos, y con el nombre por defecto esta sesión y la de lab se
  pisarían en el mismo host.
- Una baja o un cambio de rol se aplica en el siguiente `/api/auth/me` (el client
  lo pide al cargar). Hasta entonces la sesión abierta sigue valiendo, como mucho
  8 h: el mismo criterio que la revocación del modo central (`login.md` §7.1).
- `bcryptjs` va en la 3.x (`stack.md` dice `^2.4`). Es la línea actual y la API
  (`hash`, `compare`) es la misma.
