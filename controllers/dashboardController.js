const pool = require('../config/db');

exports.getEstadisticas = async (req, res) => {
  try {
    const [aulas, sedes, profesores, asignaturas, usuarios, historial_asignatura_aula] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM aulas'),
      pool.query('SELECT COUNT(*) FROM sedes'),
      pool.query('SELECT COUNT(*) FROM profesores'),
      pool.query('SELECT COUNT(*) FROM asignaturas'),
      pool.query('SELECT COUNT(*) FROM usuarios'),
      pool.query('SELECT COUNT(*) FROM historial_asignatura_aula'),
    ]);

    res.json({
      aulas: parseInt(aulas.rows[0].count),
      sedes: parseInt(sedes.rows[0].count),
      profesores: parseInt(profesores.rows[0].count),
      asignaturas: parseInt(asignaturas.rows[0].count),
      usuarios: parseInt(usuarios.rows[0].count),
      reubicaciones: parseInt(historial_asignatura_aula.rows[0].count)
    });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err.message);
    res.status(500).json({ message: 'Error al cargar estadísticas' });
  }
};
