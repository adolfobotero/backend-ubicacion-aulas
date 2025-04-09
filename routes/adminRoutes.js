const express = require('express');
const router = express.Router();
const roleProxy = require('../middlewares/roleProxy');
const { getEstadisticas } = require('../controllers/dashboardController');
const { verificarAdmin } = require('../middlewares/authProxy');

router.get('/estadisticas', verificarAdmin, getEstadisticas);

// Ruta protegida solo para administradores
router.get('/dashboard', roleProxy('admin'), (req, res) => {
  res.json({ message: `Bienvenido al panel de administración, usuario ${req.usuario.idusuario}` });
});

module.exports = router;
