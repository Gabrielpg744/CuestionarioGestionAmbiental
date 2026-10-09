// Crea el primer administrador si todavía no hay usuarios. Idempotente: si ya
// hay alguno, no hace nada. La contraseña temporal se muestra una sola vez y
// obliga a cambiarla al entrar.
const { pool } = require('../src/db');
const { generarTemporal, hashear } = require('../src/contrasenas');

async function sembrar() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM usuarios');
  if (rows[0].total > 0) {
    console.log('Ya hay usuarios; no se siembra nada.');
    return;
  }

  const temporal = generarTemporal();
  await pool.query(
    `INSERT INTO usuarios (usuario, nombre, rol, password_hash)
     VALUES ('admin', 'Administrador', 'admin', $1)`,
    [await hashear(temporal)],
  );

  console.log('Creado el usuario "admin".');
  console.log(`Contraseña temporal (se pide cambiarla al entrar): ${temporal}`);
}

sembrar()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
