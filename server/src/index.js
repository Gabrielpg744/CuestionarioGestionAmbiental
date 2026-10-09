const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const { pool } = require('./db');

// standalone = login local con sesión; sso = login central del QMS (login.md §3).
const AUTH_MODE = process.env.AUTH_MODE || 'standalone';
const PORT = process.env.PORT || 3040;
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');

if (AUTH_MODE !== 'standalone') {
  throw new Error(`AUTH_MODE=${AUTH_MODE} aún no está implementado; usa standalone`);
}
if (!process.env.SESSION_SECRET) {
  throw new Error('Falta SESSION_SECRET en server/.env');
}

const app = express();

app.use(express.json());

// Configuración pública: el client la lee para saber en qué modo corre.
app.get('/api/config', (req, res) => {
  res.json({ auth_mode: AUTH_MODE });
});

const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
app.use(
  session({
    // Nombre propio: las cookies ignoran el puerto, y con el nombre por defecto
    // (connect.sid) esta sesión y la de lab se pisarían en el mismo host.
    name: 'cuestionarios.sid',
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 },
  }),
);

app.use('/api/auth', require('./routes/auth'));

// Mientras un usuario deba cambiar su contraseña, solo puede usar /api/auth.
app.use('/api', (req, res, next) => {
  const u = req.session.user;
  if (u && u.debe_cambiar_password && !req.path.startsWith('/auth/')) {
    return res.status(403).json({
      error: 'Debes cambiar tu contraseña antes de continuar',
      code: 'CAMBIO_REQUERIDO',
    });
  }
  next();
});

app.use('/api/estado', require('./routes/estado'));
app.use('/api/cuestionarios', require('./routes/cuestionarios'));
app.use('/api/usuarios', require('./routes/usuarios'));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// En producción el mismo proceso sirve el client compilado (SPA).
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.code === '23505') return res.status(409).json({ error: 'El registro ya existe' });
  if (err.code === '23503') return res.status(400).json({ error: 'Referencia inválida' });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// 0.0.0.0: escucha en todas las interfaces, para que entren otras computadoras
// de la red (además hay que abrir el puerto en el firewall; ver README).
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  for (const ip of ipsDeRed()) console.log(`  En la red: http://${ip}:${PORT}`);
});

function ipsDeRed() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
}
