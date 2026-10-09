# Conciencia del Sistema de Gestión Ambiental CIE

Sistema del QMS de ALUDEC para aplicar y calificar el cuestionario de conciencia
del Sistema de Gestión Ambiental. Guarda cada envío con su calificación y sus
respuestas individuales.

- **Cuestionario** (`/`): público, lo contesta el personal con su número de control.
- **Administración** (`/admin`): con login. `admin` ve resultados y administra
  usuarios; `consulta` solo ve resultados.

Documentos del ecosistema: [`stack.md`](stack.md) (con qué se construye),
[`styles.md`](styles.md) (cómo se ve), [`login.md`](login.md) (autenticación) y
[`DECISIONS.md`](DECISIONS.md) (desviaciones de este sistema).

## Puesta en marcha

Requiere Node 24 (`.nvmrc`) y PostgreSQL.

```bash
npm run setup
```

Copia `server/.env.example` a `server/.env` y ajusta `DATABASE_URL` y
`SESSION_SECRET`. Luego:

```bash
npm run migrate
```

Crea el primer usuario `admin` y muestra su contraseña temporal una sola vez:

```bash
npm run seed
```

```bash
npm run dev
```

El client queda en http://localhost:5177 (con proxy de `/api` al server en `:3040`).

## Scripts

| Script | Qué hace |
|---|---|
| `npm run setup` | Instala dependencias de raíz, server y client |
| `npm run dev` | Server (`:3040`, `node --watch`) + client (Vite `:5177`) |
| `npm run build` | Compila el client a `client/dist` |
| `npm start` | Un solo proceso: API + client compilado |
| `npm run migrate` | Aplica las migraciones pendientes de `server/migrations` |
| `npm run seed` | Crea el primer `admin` si no hay usuarios (idempotente) |
| `npm run lint` | ESLint en server y client |
| `npm test` | Pruebas (Vitest) de la calificación y la validación de respuestas |
| `npm run format` | Prettier en todo el repo |

## Acceso desde otras computadoras

El servidor escucha en todas las interfaces de red (`0.0.0.0`). En la máquina que
hace de servidor:

1. **Compilar y arrancar en modo producción**: un solo proceso sirve el API y la
   interfaz en el puerto `3040`.

   ```bash
   npm run build
   ```

   ```bash
   npm start
   ```

   Al arrancar imprime las direcciones de red (`En la red: http://<IP>:3040`). Usa
   la de la red de la empresa; las `172.x` suelen ser adaptadores virtuales
   (WSL, Hyper-V, Docker) y no sirven desde otro equipo.

2. **Abrir el puerto en el firewall de Windows** (PowerShell como administrador).
   La regla tiene que cubrir el perfil de red real del servidor; compruébalo con
   `Get-NetConnectionProfile` (`Domain`, `Private` o `Public`) y ajusta `-Profile`:

   ```bash
   New-NetFirewallRule -DisplayName "Cuestionarios CIE (3040)" -Direction Inbound -Protocol TCP -LocalPort 3040 -Action Allow -Profile Domain,Private
   ```

3. **Probar desde otro equipo** (otra PC o un celular en la misma red):
   `http://<IP-del-servidor>:3040`. Una prueba desde el propio servidor no revela
   si el firewall bloquea el tráfico de fuera.

Conviene que el servidor tenga **IP fija** (o un nombre en el DNS de la empresa) y
que todos entren siempre por la misma dirección: las cookies de sesión van
atadas al nombre del host (`login.md` §4.1).

En desarrollo (`npm run dev`) Vite también escucha en la red (`:5177`), pero para
que otros usen el sistema se usa `npm start`.
