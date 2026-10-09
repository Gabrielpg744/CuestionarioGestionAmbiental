const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const ENV = path.join(__dirname, '..', '.env');

dotenv.config({ path: ENV, quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error(diagnosticarEnv());
}

// Explica por qué no se leyó DATABASE_URL: en Windows casi siempre es el nombre
// del archivo (.env.txt) o que se guardó en UTF-16.
function diagnosticarEnv() {
  if (!fs.existsSync(ENV)) {
    const parecidos = fs
      .readdirSync(path.dirname(ENV))
      .filter((nombre) => nombre.toLowerCase().includes('env') && nombre !== '.env.example');
    return (
      `No existe ${ENV}.` +
      (parecidos.length
        ? ` Hay un archivo parecido: ${parecidos.join(', ')} — renómbralo a .env.`
        : '')
    );
  }
  const inicio = fs.readFileSync(ENV).subarray(0, 2);
  if ((inicio[0] === 0xff && inicio[1] === 0xfe) || (inicio[0] === 0xfe && inicio[1] === 0xff)) {
    return `${ENV} está guardado en UTF-16 ("Unicode") y no se puede leer. Guárdalo como UTF-8.`;
  }
  return `${ENV} no trae DATABASE_URL (revisa que la línea empiece exactamente con DATABASE_URL=).`;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (error) => {
  console.error('Error inesperado en PostgreSQL:', error.message);
});

module.exports = { pool, query: (text, params) => pool.query(text, params) };
