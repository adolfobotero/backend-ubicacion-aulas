const { Pool } = require('pg');

// Configuración desde variables de entorno
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'ubicacion_aulas',
  password: process.env.PG_PASSWORD || 'masterkey',
  port: process.env.PG_PORT || 5432
});

// Captura errores del pool globalmente
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

// Probar conexión al iniciar el servidor
(async () => {
  try {
    const client = await pool.connect();
    console.log('Conectado a la base de datos PostgreSQL');
    client.release();
  } catch (err) {
    console.error('No se pudo conectar con la base de datos:', err.message);
    process.exit(1);
  }
})();

module.exports = pool;
