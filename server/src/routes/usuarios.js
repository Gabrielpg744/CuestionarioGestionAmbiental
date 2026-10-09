// Administración de usuarios (solo admin).
const express = require('express');
const { query } = require('../db');
const { requireRol } = require('../auth');
const { generarTemporal, hashear } = require('../contrasenas');

const router = express.Router();
const ROLES = ['admin', 'consulta'];
const COLUMNAS = 'id, usuario, nombre, rol, activo, debe_cambiar_password, creado_en';

router.use(requireRol('admin'));

function errorValidacion(mensaje, status = 400) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

function idDe(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw errorValidacion('Usuario no encontrado', 404);
  return id;
}

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT ${COLUMNAS} FROM usuarios ORDER BY nombre`);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const usuario = String(req.body.usuario || '').trim();
    const nombre = String(req.body.nombre || '').trim();
    const { rol } = req.body;

    if (!/^[a-z0-9._-]{3,50}$/i.test(usuario)) {
      throw errorValidacion(
        'El usuario debe tener de 3 a 50 letras, números, punto, guion o guion bajo',
      );
    }
    if (!nombre) throw errorValidacion('El nombre es obligatorio');
    if (!ROLES.includes(rol)) throw errorValidacion('Rol no válido');

    const temporal = generarTemporal();
    const { rows } = await query(
      `INSERT INTO usuarios (usuario, nombre, rol, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING ${COLUMNAS}`,
      [usuario, nombre, rol, await hashear(temporal)],
    );
    res.status(201).json({ ...rows[0], password_temporal: temporal });
  } catch (e) {
    if (e.code === '23505') return next(errorValidacion('Ese usuario ya existe', 409));
    next(e);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = idDe(req);
    const { nombre, rol, activo } = req.body;
    const propio = id === req.session.user.id;

    if (nombre !== undefined && !String(nombre).trim()) {
      throw errorValidacion('El nombre es obligatorio');
    }
    if (rol !== undefined && !ROLES.includes(rol)) throw errorValidacion('Rol no válido');
    if (activo !== undefined && typeof activo !== 'boolean')
      throw errorValidacion('Activo no válido');
    // Que nadie se quede fuera por accidente quitándose a sí mismo.
    if (propio && ((rol !== undefined && rol !== 'admin') || activo === false)) {
      throw errorValidacion('No puedes quitarte el rol de admin ni desactivarte a ti mismo');
    }

    const { rows } = await query(
      `UPDATE usuarios SET
         nombre = COALESCE($2, nombre),
         rol = COALESCE($3, rol),
         activo = COALESCE($4, activo)
       WHERE id = $1
       RETURNING ${COLUMNAS}`,
      [id, nombre === undefined ? null : String(nombre).trim(), rol ?? null, activo ?? null],
    );
    if (!rows[0]) throw errorValidacion('Usuario no encontrado', 404);
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/reiniciar-password', async (req, res, next) => {
  try {
    const temporal = generarTemporal();
    const { rows } = await query(
      `UPDATE usuarios SET password_hash = $2, debe_cambiar_password = true
       WHERE id = $1
       RETURNING ${COLUMNAS}`,
      [idDe(req), await hashear(temporal)],
    );
    if (!rows[0]) throw errorValidacion('Usuario no encontrado', 404);
    res.json({ ...rows[0], password_temporal: temporal });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
