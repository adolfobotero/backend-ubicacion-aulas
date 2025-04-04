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

// Crear tabla de usuarios si no existe
const crearTablaUsuarios = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
          idUsuario SERIAL PRIMARY KEY,
          codeUsuario VARCHAR(50) NOT NULL,
          nombreCompleto VARCHAR(100) NOT NULL,
          mailUsuario VARCHAR(100) UNIQUE NOT NULL,
          passUsuario TEXT,
          rolUsuario VARCHAR(50) NOT NULL DEFAULT 'admin',
          metodoLogin VARCHAR(50) NOT NULL DEFAULT 'local'
      );
    `);
    console.log('Tabla "Usuarios" verificada/creada correctamente');
  } catch (err) {
    console.error('Error al crear la tabla Usuarios:', err.message);
  }
};
// Crear tabla de sedes si no existe
const crearTablaSedes = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sedes (
        idSede SERIAL PRIMARY KEY,
        nombreSede VARCHAR(100) NOT NULL,
        direccionSede TEXT,
        latitudSede DECIMAL,
        longitudSede DECIMAL
      );
    `);
    console.log('Tabla "Sedes" verificada/creada correctamente');
  } catch (err) {
    console.error('Error al crear la tabla Sedes:', err.message);
  }
};

const crearTablaProfesores = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profesores (
        idProfesor SERIAL PRIMARY KEY,
        codeProfesor VARCHAR(50) UNIQUE NOT NULL,
        nombreProfesor VARCHAR(100) NOT NULL,
        mailProfesor VARCHAR(100) NOT NULL
      );
    `);
    console.log('Tabla "Profesores" verificada/creada correctamente.');
  } catch (error) {
    console.error('Error al crear la tabla Profesores:', error.message);
  }
};

crearTablaUsuarios();
crearTablaSedes();
crearTablaProfesores();

module.exports = pool;
