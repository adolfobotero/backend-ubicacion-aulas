const pool = require('../config/Db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioFactory = require('../factories/UsuarioFactory');

exports.loginLocal = async (req, res) => {
  const { mailUsuario, passUsuario } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE mailusuario = $1', [mailUsuario]);
    const user = result.rows[0];
    
    /*
    console.log('Correo recibido:', mailUsuario);
    console.log('Resultado BD:', result.rows);
    console.log('Contraseña recibida:', passUsuario);
    console.log('Contraseña en BD:', user?.passusuario);
    */

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const valid = await bcrypt.compare(passUsuario, user.passusuario);
    if (!valid) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    //const usuario = UsuarioFactory.crearUsuario('local', user);
    const usuario = UsuarioFactory.crearUsuario('local', mapSnakeToCamel(user));
    const token = jwt.sign(
      {
        idusuario: user.idusuario,
        nombreUsuario: user.nombrecompleto,
        rol: user.rolusuario,
        mailUsuario: user.mailusuario,
        recibir_notificaciones: user.recibir_notificaciones
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    //console.log('Token generado:', jwt.decode(token));
    res.json({ token, redirect: '/admin/dashboard', usuario });

  } catch (err) {
    console.error('Error en loginLocal:', err.message);
    res.status(500).json({ message: 'Error de conexión. Intente más tarde.' });
  }
};

function mapSnakeToCamel(user) {
  return {
    codeUsuario: user.codeusuario,
    nombreCompleto: user.nombrecompleto,
    mailUsuario: user.mailusuario,
    rolUsuario: user.rolusuario
  };
};