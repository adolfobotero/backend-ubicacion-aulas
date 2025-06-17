const pool = require('../config/db');

const insertarUsuarioAdmin = async () => {
  try {
    const result = await pool.query(
      `SELECT * FROM usuarios WHERE mailUsuario = 'admin@ucaldas.edu.co'`
    );

    if (result.rowCount === 0) {
      await pool.query(`
        INSERT INTO usuarios (codeUsuario, nombreCompleto, mailUsuario, passUsuario, rolUsuario, metodoLogin, recibirNotificaciones)
        VALUES (
          'ADM001',
          'Administrador',
          'admin@ucaldas.edu.co',
          '$2b$10$YcIPq/KvskKCasmI3u567OV721fZRP/xdXjjJUCfPVHr92y3XokVW', -- contraseña: admin123
          'admin',
          'local',
          false
        );
      `);
      console.log('Usuario administrador creado por defecto');
    } else {
      console.log('Usuario administrador ya existe');
    }
  } catch (err) {
    console.error('Error al insertar el usuario administrador:', err.message);
  }
};

module.exports = insertarUsuarioAdmin;