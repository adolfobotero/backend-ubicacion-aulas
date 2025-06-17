const pool = require('../config/db');

// Habilitar extensión UUID si no existe
const crearExtensionUUID = async () => {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('Extensión "uuid-ossp" habilitada correctamente');
  } catch (err) {
    console.error('Error al habilitar la extensión UUID:', err.message);
  }
};

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
        metodoLogin VARCHAR(50) NOT NULL DEFAULT 'local',
        recibirNotificaciones BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('Tabla "Usuarios" verificada/creada correctamente');
  } catch (err) {
    console.error('Error al crear la tabla Usuarios:', err.message);
  }
};

const crearTablaSedes = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sedes (
        idSede UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        codeSede VARCHAR(50) UNIQUE,
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
        idProfesor UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        codeProfesor VARCHAR(50) UNIQUE NOT NULL,
        nombreProfesor VARCHAR(100) NOT NULL,
        mailProfesor VARCHAR(100) NOT NULL
      );
    `);
    console.log('Tabla "Profesores" verificada/creada correctamente');
  } catch (err) {
    console.error('Error al crear la tabla Profesores:', err.message);
  }
};

const crearTablaAsignaturas = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS asignaturas (
        idAsignatura UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        codeAsignatura VARCHAR(50) UNIQUE NOT NULL,
        nombreAsignatura VARCHAR(100) NOT NULL
      );
    `);
    console.log('Tabla "Asignaturas" verificada/creada correctamente');
  } catch (err) {
    console.error('Error al crear la tabla Asignaturas:', err.message);
  }
};

const crearTablaProfesorAsignatura = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profesor_asignatura (
        idProfesorAsignatura UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        idProfesor UUID NOT NULL,
        idAsignatura UUID NOT NULL,
        FOREIGN KEY (idProfesor) REFERENCES profesores (idProfesor) ON DELETE CASCADE,
        FOREIGN KEY (idAsignatura) REFERENCES asignaturas (idAsignatura) ON DELETE CASCADE,
        UNIQUE (idProfesor, idAsignatura)
      );
    `);
    console.log('Tabla "ProfesorAsignatura" verificada/creada correctamente');
  } catch (err) {
    console.error('Error al crear la tabla ProfesorAsignatura:', err.message);
  }
};

const crearTablaAulas = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS aulas (
        idAula UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        codeAula VARCHAR(50) UNIQUE NOT NULL,
        nombreAula VARCHAR(100) NOT NULL,
        capAula INTEGER,
        edificioAula VARCHAR(100),
        pisoAula VARCHAR(20),
        idSedeActual UUID NOT NULL,
        FOREIGN KEY (idSedeActual) REFERENCES sedes(idSede) ON DELETE CASCADE
      );
    `);
    console.log('Tabla "Aulas" verificada/creada correctamente');
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
        idProfesor UUID NOT NULL,
        diaSemana VARCHAR(15) NOT NULL,
        horaInicio TIME NOT NULL,
        horaFin TIME NOT NULL,
        FOREIGN KEY (idAsignatura) REFERENCES asignaturas(idAsignatura) ON DELETE CASCADE,
        FOREIGN KEY (idAula) REFERENCES aulas(idAula) ON DELETE CASCADE,
        FOREIGN KEY (idProfesor) REFERENCES profesores(idProfesor) ON DELETE CASCADE,
        UNIQUE (idAsignatura, idAula, diaSemana, horaInicio, horaFin)
      );
    `);
    console.log('Tabla "AsignaturaAula" verificada/creada correctamente');
  } catch (err) {
    console.error('Error al crear la tabla AsignaturaAula:', err.message);
  }
};

const crearTablaHistorialAsignaturaAula = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historial_asignatura_aula (
        idHistorial UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        idAsignatura UUID NOT NULL,
        idAulaAnterior UUID,
        idAulaNueva UUID,
        diaSemanaAnterior VARCHAR(15),
        horaInicioAnterior TIME,
        horaFinAnterior TIME,
        diaSemanaNuevo VARCHAR(15),
        horaInicioNuevo TIME,
        horaFinNuevo TIME,
        idUsuarioCambio UUID NOT NULL,
        fechaCambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        motivo TEXT,
        FOREIGN KEY (idAsignatura) REFERENCES asignaturas(idAsignatura) ON DELETE CASCADE,
        FOREIGN KEY (idAulaAnterior) REFERENCES aulas(idAula) ON DELETE SET NULL,
        FOREIGN KEY (idAulaNueva) REFERENCES aulas(idAula) ON DELETE CASCADE,
        FOREIGN KEY (idUsuarioCambio) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
      );
    `);
    console.log('Tabla "historial_asignatura_aula" verificada/creada correctamente');
  } catch (err) {
    console.error('Error al crear la tabla historial_asignatura_aula:', err.message);
  }
};

const iniciarBaseDeDatos = async () => {
  await crearExtensionUUID();
  await crearTablaUsuarios();
  await crearTablaSedes();
  await crearTablaAulas();
  await crearTablaProfesores();
  await crearTablaAsignaturas();
  await crearTablaProfesorAsignatura();
  await crearTablaAsignaturaAula();
  await crearTablaHistorialAsignaturaAula();
};

module.exports = iniciarBaseDeDatos;