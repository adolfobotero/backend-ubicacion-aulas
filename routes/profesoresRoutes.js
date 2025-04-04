const express = require('express');
const router = express.Router();
const controller = require('../controllers/profesoresController');
const pool = require('../config/db');

router.get('/', controller.getProfesores);
router.post('/', controller.createProfesor);
router.put('/:id', controller.updateProfesor);
router.delete('/:id', controller.deleteProfesor);

router.post('/importar', async (req, res) => {
  const { profesores } = req.body;

  let insertados = 0;
  let ignorados = 0;

  try {
    for (const p of profesores) {
      const { codeProfesor, nombreProfesor, mailProfesor } = p;

      if (!codeProfesor || !nombreProfesor || !mailProfesor) {
        ignorados++;
        continue;
      }

      if (!mailProfesor.endsWith('@ucaldas.edu.co')) {
        ignorados++;
        continue;
      }

      const result = await pool.query(
        `INSERT INTO profesores (codeProfesor, nombreProfesor, mailProfesor)
         VALUES ($1, $2, $3)
         ON CONFLICT (codeProfesor) DO NOTHING`,
        [codeProfesor, nombreProfesor, mailProfesor]
      );

      if (result.rowCount > 0) {
        insertados++;
      } else {
        ignorados++;
      }
    }

    res.status(200).json({
      message: 'Importación completada',
      insertados,
      ignorados
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al importar profesores' });
  }
});

module.exports = router;
