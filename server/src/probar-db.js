const pool = require('./db');

async function probarConexion() {
  try {
    const resultado = await pool.query(`
      SELECT current_database() AS base,
             COUNT(*) AS tablas
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `);

    console.log('Conexión exitosa:', resultado.rows[0]);
  } catch (error) {
    console.error('Error de conexión:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

probarConexion();