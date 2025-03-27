const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioFactory = require('../models/userFactory');

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

    const usuario = UsuarioFactory.crearUsuario('local', user);
    const token = jwt.sign(
      { idusuario: user.idusuario, rol: user.rolusuario },
      process.env.JWT_SECRET
    );

    res.json({ token, redirect: '/admin/dashboard', usuario });

  } catch (err) {
    console.error('Error en loginLocal:', err.message);
    res.status(500).json({ message: 'Error al conectar con la base de datos. Intente más tarde.' });
  }
};