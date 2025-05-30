require('dotenv').config();
const { Pool } = require('pg');

// Conexión desde variables de entorno
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : true,
    })
  : new Pool({
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: process.env.PG_PORT,
    });

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

module.exports = pool;