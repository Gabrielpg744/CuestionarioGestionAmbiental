const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const LONGITUD_MINIMA = 8;

// Contraseña temporal generada por el sistema, no escrita por el administrador
// (si no, acaba siendo la misma para todos). Se enseña una sola vez y obliga a
// cambiarla al entrar (login.md §6.2).
const generarTemporal = () => crypto.randomBytes(9).toString('base64url');

const hashear = (password) => bcrypt.hash(password, 10);

const coincide = (password, hash) => bcrypt.compare(password, hash);

module.exports = { LONGITUD_MINIMA, generarTemporal, hashear, coincide };
