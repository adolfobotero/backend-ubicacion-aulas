const express = require('express');
const router = express.Router();
const sedeController = require('../controllers/sedesController');

// Listar sedes
router.get('/', sedeController.getSedes);

// Agregar sede
router.post('/', sedeController.addSede);

// Editar sede
router.put('/:id', sedeController.updateSede);

// Eliminar sede
router.delete('/:id', sedeController.deleteSede);

module.exports = router;
