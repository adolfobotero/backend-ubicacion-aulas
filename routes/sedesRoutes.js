const express = require('express');
const router = express.Router();
const sedeController = require('../controllers/sedesController');

router.get('/', sedeController.getSedes);
router.post('/', sedeController.addSede);
router.put('/:id', sedeController.updateSede);
router.delete('/:id', sedeController.deleteSede);

module.exports = router;
