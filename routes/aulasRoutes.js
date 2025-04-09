const express = require('express');
const router = express.Router();
const aulasController = require('../controllers/aulasController');
const { verificarAdmin } = require('../middlewares/authProxy');


// CRUD de Aulas
router.get('/', aulasController.getAulas);
router.post('/', aulasController.createAula);
router.put('/:id', verificarAdmin, aulasController.updateAula);
router.delete('/:id', aulasController.deleteAula);

// Relación Asignatura-Aula
router.get('/:id/asignaturas', aulasController.getAsignaturasPorAula);
router.post('/:id/asignaturas', aulasController.asignarAsignatura);
router.delete('/:id/asignaturas/:idAsignatura', aulasController.quitarAsignatura);

// Historial de Aulas
router.get('/:id/historial', verificarAdmin, aulasController.getHistorialUbicacion);

module.exports = router;
