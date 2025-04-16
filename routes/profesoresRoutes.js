const express = require('express');
const router = express.Router();
const controller = require('../controllers/profesoresController');

router.get('/', controller.getProfesores);
router.post('/', controller.createProfesor);
router.put('/:id', controller.updateProfesor);
router.delete('/:id', controller.deleteProfesor);
router.post('/importar', controller.importarProfesores);
router.get('/exportar', controller.exportarProfesores);

module.exports = router;
