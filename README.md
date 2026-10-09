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
