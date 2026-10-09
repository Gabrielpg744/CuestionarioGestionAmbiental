const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en server/.env');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (error) => {
  console.error('Error inesperado en PostgreSQL:', error.message);
});

module.exports = { pool, query: (text, params) => pool.query(text, params) };
