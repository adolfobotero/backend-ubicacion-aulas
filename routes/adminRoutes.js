const express = require('express');
const router = express.Router();
const roleProxy = require('../middlewares/roleProxy');

// Ruta protegida solo para administradores
router.get('/dashboard', roleProxy('admin'), (req, res) => {
  res.json({ message: `Bienvenido al panel de administración, usuario ${req.usuario.idusuario}` });
});

module.exports = router;
