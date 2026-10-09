// Login local (AUTH_MODE=standalone).
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../auth');
const { LONGITUD_MINIMA, coincide, hashear } = require('../contrasenas');

const router = express.Router();

const sesionDe = (u) => ({
  id: u.id,
  usuario: u.usuario,
  nombre: u.nombre,
  rol: u.rol,
  debe_cambiar_password: u.debe_cambiar_password,
});

router.post('/login', async (req, res, next) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const { rows } = await query('SELECT * FROM usuarios WHERE usuario = $1 AND activo', [
      String(usuario).trim(),
    ]);
    const u = rows[0];
    // Los usuarios del login central (sin password_hash) no entran por aquí.
    if (!u || !u.password_hash || !(await coincide(password, u.password_hash))) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Sesión nueva en cada login para no heredar un id de sesión previo.
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = sesionDe(u);
      res.json(req.session.user);
    });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    // Se relee de la BD para que una baja o un cambio de rol se note al
    // recargar, sin esperar a que caduque la sesión.
    const { rows } = await query('SELECT * FROM usuarios WHERE id = $1 AND activo', [
      req.session.user.id,
    ]);
    if (!rows[0]) {
      return req.session.destroy(() => res.status(401).json({ error: 'No autenticado' }));
    }
    req.session.user = sesionDe(rows[0]);
    res.json(req.session.user);
  } catch (e) {
    next(e);
  }
});

router.post('/cambiar-password', requireAuth, async (req, res, next) => {
  try {
    const { actual, nueva } = req.body;
    if (!nueva || nueva.length < LONGITUD_MINIMA) {
      return res
        .status(400)
        .json({ error: `La nueva contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres` });
    }
    if (nueva === actual) {
      return res.status(400).json({ error: 'La nueva contraseña debe ser distinta de la actual' });
    }

    const { rows } = await query('SELECT password_hash FROM usuarios WHERE id = $1', [
      req.session.user.id,
    ]);
    if (!rows[0]?.password_hash || !(await coincide(actual || '', rows[0].password_hash))) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta' });
    }

    await query(
      'UPDATE usuarios SET password_hash = $1, debe_cambiar_password = false WHERE id = $2',
      [await hashear(nueva), req.session.user.id],
    );
    req.session.user.debe_cambiar_password = false;
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
