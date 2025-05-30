const express = require('express');
const router = express.Router();
const { consultarUbicacion } = require('../controllers/ChatbotController');

router.post('/consulta', consultarUbicacion);

module.exports = router;
