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

// Habilitar extensión UUID si no existe
const crearExtensionUUID = async () => {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    console.log('Extensión "uuid-ossp" habilitada correctamente');
  } catch (err) {
    console.error('Error al habilitar la extensión UUID:', err.message);
  }
};

// Crear tabla de usuarios con UUID
const crearTablaUsuarios = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        idUsuario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

// Crear tabla de sedes con UUID
const crearTablaSedes = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sedes (
        idSede UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

// Crear tabla Profesores con UUID
const crearTablaProfesores = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profesores (
        idProfesor UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        codeProfesor VARCHAR(50) UNIQUE NOT NULL,
        nombreProfesor VARCHAR(100) NOT NULL,
        mailProfesor VARCHAR(100) NOT NULL
      );
    `);
    console.log('Tabla "Profesores" verificada/creada correctamente.');
  } catch (err) {
    console.error('Error al crear la tabla Profesores:', err.message);
  }
};

// Crear tabla Asignaturas con UUID
const crearTablaAsignaturas = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS asignaturas (
        idAsignatura UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        codeAsignatura VARCHAR(50) UNIQUE NOT NULL,
        nombreAsignatura VARCHAR(100) NOT NULL
      );
    `);
    console.log('Tabla "Asignaturas" verificada/creada correctamente.');
  } catch (err) {
    console.error('Error al crear la tabla Asignaturas:', err.message);
  }
};

// Crear tabla ProfesorAsignatura con UUID
const crearTablaProfesorAsignatura = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profesor_asignatura (
        idProfesorAsignatura UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        idProfesor UUID NOT NULL,
        idAsignatura UUID NOT NULL,
        horarioAsignatura VARCHAR(150) NOT NULL,
        FOREIGN KEY (idProfesor) REFERENCES profesores (idProfesor) ON DELETE CASCADE,
        FOREIGN KEY (idAsignatura) REFERENCES asignaturas (idAsignatura) ON DELETE CASCADE,
        UNIQUE (idProfesor, idAsignatura, horarioAsignatura)
      );
    `);
    console.log('Tabla "ProfesorAsignatura" verificada/creada correctamente.');
  } catch (err) {
    console.error('Error al crear la tabla ProfesorAsignatura:', err.message);
  }
};

// Crear tabla Aula con UUID
const crearTablaAulas = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS aulas (
        idAula UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        codeAula VARCHAR(50) UNIQUE NOT NULL,
        nombreAula VARCHAR(80) NOT NULL,
        capAula INTEGER,
        idSedeActual UUID NOT NULL,
        FOREIGN KEY (idSedeActual) REFERENCES sedes(idSede) ON DELETE CASCADE
      );
    `);
    console.log('Tabla "Aulas" verificada/creada correctamente.');
  } catch (err) {
    console.error('Error al crear la tabla Aulas:', err.message);
  }
};

const crearTablaAsignaturaAula = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS asignatura_aula (
        idAsignaturaAula UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        idAsignatura UUID NOT NULL,
        idAula UUID NOT NULL,
        diaSemana VARCHAR(15) NOT NULL,
        horaInicio TIME NOT NULL,
        horaFin TIME NOT NULL,
        FOREIGN KEY (idAsignatura) REFERENCES asignaturas(idAsignatura) ON DELETE CASCADE,
        FOREIGN KEY (idAula) REFERENCES aulas(idAula) ON DELETE CASCADE
      );
    `);
    console.log('Tabla "AsignaturaAula" verificada/creada correctamente.');
  } catch (err) {
    console.error('Error al crear la tabla AsignaturaAula:', err.message);
  }
};

// Ejecutar creación de tablas
(async () => {
  await crearExtensionUUID();
  await crearTablaUsuarios();
  await crearTablaSedes();
  await crearTablaAulas();
  await crearTablaProfesores();
  await crearTablaAsignaturas();
  await crearTablaProfesorAsignatura();
  await crearTablaAsignaturaAula();
  console.log('Todas las tablas han sido verificadas/creadas correctamente.');
})();

module.exports = pool;
