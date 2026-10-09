// Aplica en orden las migraciones de server/migrations que aún no estén en
// _migraciones. Cada archivo corre en su propia transacción.
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

const MIGRACIONES = path.join(__dirname, '..', 'migrations');

async function migrar() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migraciones (
      nombre TEXT PRIMARY KEY,
      aplicada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const { rows } = await pool.query('SELECT nombre FROM _migraciones');
  const aplicadas = new Set(rows.map((r) => r.nombre));

  const pendientes = fs
    .readdirSync(MIGRACIONES)
    .filter((archivo) => archivo.endsWith('.sql') && !aplicadas.has(archivo))
    .sort();

  if (pendientes.length === 0) {
    console.log('Sin migraciones pendientes.');
    return;
  }

  for (const archivo of pendientes) {
    const sql = fs.readFileSync(path.join(MIGRACIONES, archivo), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migraciones (nombre) VALUES ($1)', [archivo]);
      await client.query('COMMIT');
      console.log(`Aplicada ${archivo}`);
    } catch (e) {
      await client.query('ROLLBACK');
      throw new Error(`Falló ${archivo}: ${e.message}`, { cause: e });
    } finally {
      client.release();
    }
  }
}

migrar()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
