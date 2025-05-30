const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verificarToken } = require('../middlewares/AuthProxy');

// RUTA ESPECÍFICA ANTES DE LAS DINÁMICAS
router.put('/notificaciones', verificarToken, usuariosController.actualizarConsentimiento);

// Rutas generales de usuarios
router.get('/', usuariosController.getUsuarios);
router.post('/', usuariosController.addUsuario);
router.put('/:id', usuariosController.updateUsuario);
router.delete('/:id', usuariosController.deleteUsuario);

module.exports = router;
