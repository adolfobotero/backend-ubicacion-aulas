// routes/aulasRoutes.js
const express = require('express');
const router = express.Router();
const aulasController = require('../controllers/aulasController');

// CRUD de Aulas
router.get('/', aulasController.getAulas);
router.post('/', aulasController.createAula);
router.put('/:id', aulasController.updateAula);
router.delete('/:id', aulasController.deleteAula);

// Relación Asignatura-Aula
router.get('/:id/asignaturas', aulasController.getAsignaturasPorAula);
router.post('/:id/asignaturas', aulasController.asignarAsignatura);
router.delete('/:id/asignaturas/:idAsignatura', aulasController.quitarAsignatura);

module.exports = router;
