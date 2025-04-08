const express = require('express');
const router = express.Router();
const asignaturaController = require('../controllers/asignaturasController');

// Rutas principales
router.get('/', asignaturaController.getAsignaturas);
router.post('/', asignaturaController.createAsignatura);
router.put('/:id', asignaturaController.updateAsignatura);
router.delete('/:id', asignaturaController.deleteAsignatura);

// Rutas para gestión de profesores por asignatura
router.get('/:id/profesores', asignaturaController.getProfesoresPorAsignatura);
router.post('/:id/profesores', asignaturaController.asignarProfesor);
router.delete('/:idAsignatura/profesores/:idProfesor/:horarioAsignatura', asignaturaController.quitarProfesor);


module.exports = router;
