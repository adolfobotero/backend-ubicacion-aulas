const express = require('express');
const router = express.Router();
const aulasController = require('../controllers/aulasController');
const { verificarAdmin } = require('../middlewares/authProxy');


// CRUD de Aulas
router.get('/', aulasController.getAulas);
router.post('/', aulasController.createAula);
router.put('/:id', aulasController.updateAula);
router.delete('/:id', aulasController.deleteAula);

// Relación Asignatura-Aula
router.get('/:id/asignaturas', aulasController.getAsignaturasPorAula);
router.post('/:id/asignaturas', verificarAdmin, aulasController.asignarAsignatura);
router.get('/asignadas', verificarAdmin, aulasController.getAsignaturasAsignadas);

// Mover asignatura entre aulas
router.post('/:idaula/mover-asignatura', verificarAdmin, aulasController.moverAsignatura);

// Importar / Exportar aulas
router.post('/importar', aulasController.importarAulas);
router.get('/exportar', aulasController.exportarAulas);
router.post('/importar-asignaciones', aulasController.importarAsignaciones);

module.exports = router;
