// controllers/aulasController.js
const pool = require('../config/db');

// Obtener aulas con nombre de la sede
exports.getAulas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, s.nombreSede
      FROM aulas a
      JOIN sedes s ON a.idSedeActual = s.idSede
      ORDER BY a.codeAula
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener aulas:', err.message);
    res.status(500).json({ message: 'Error al obtener aulas' });
  }
};

// Crear una nueva aula
exports.createAula = async (req, res) => {
  const { codeAula, nombreAula, capAula, idSedeActual } = req.body;
  if (!codeAula || !nombreAula || !capAula || !idSedeActual) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO aulas (codeAula, nombreAula, capAula, idSedeActual)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [codeAula, nombreAula, capAula, idSedeActual]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear aula:', err.message);
    res.status(500).json({ message: 'Error al crear aula' });
  }
};

// Actualizar aula
exports.updateAula = async (req, res) => {
  const idAula = req.params.id;
  const { codeAula, nombreAula, capAula, idSedeActual } = req.body;

  try {
    const result = await pool.query(
      `UPDATE aulas SET codeAula = $1, nombreAula = $2, capAula = $3, idSedeActual = $4
       WHERE idAula = $5 RETURNING *`,
      [codeAula, nombreAula, capAula, idSedeActual, idAula]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar aula:', err.message);
    res.status(500).json({ message: 'Error al actualizar aula' });
  }
};

// Eliminar aula y sus relaciones
exports.deleteAula = async (req, res) => {
  const idAula = req.params.id;
  try {
    await pool.query('DELETE FROM asignatura_aula WHERE idAula = $1', [idAula]);
    await pool.query('DELETE FROM aulas WHERE idAula = $1', [idAula]);
    res.json({ message: 'Aula eliminada' });
  } catch (err) {
    console.error('Error al eliminar aula:', err.message);
    res.status(500).json({ message: 'Error al eliminar aula' });
  }
};

// Obtener asignaturas asignadas a un aula
exports.getAsignaturasPorAula = async (req, res) => {
  const idAula = req.params.id;
  try {
    const result = await pool.query(`
      SELECT a.idAsignatura, a.nombreAsignatura, aa.diaSemana, aa.horaInicio, aa.horaFin
      FROM asignatura_aula aa
      JOIN asignaturas a ON aa.idAsignatura = a.idAsignatura
      WHERE aa.idAula = $1
    `, [idAula]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener asignaturas por aula:', err.message);
    res.status(500).json({ message: 'Error al obtener asignaturas por aula' });
  }
};

// Asignar aula a una asignatura (con validación de traslape)
exports.asignarAsignatura = async (req, res) => {
  const idAula = req.params.id;
  const { idAsignatura, diaSemana, horaInicio, horaFin } = req.body;

  if (!idAsignatura || !diaSemana || !horaInicio || !horaFin) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    // Validar traslape
    const conflicto = await pool.query(`
      SELECT 1 FROM asignatura_aula
      WHERE idAula = $1 AND diaSemana = $2
      AND horaInicio < $4 AND horaFin > $3
    `, [idAula, diaSemana, horaInicio, horaFin]);

    if (conflicto.rows.length > 0) {
      return res.status(409).json({ message: 'El aula ya está ocupada en ese horario.' });
    }

    await pool.query(`
      INSERT INTO asignatura_aula (idAsignatura, idAula, diaSemana, horaInicio, horaFin)
      VALUES ($1, $2, $3, $4, $5)
    `, [idAsignatura, idAula, diaSemana, horaInicio, horaFin]);

    // Retornar asignaciones actualizadas
    const result = await pool.query(`
      SELECT a.idAsignatura, a.nombreAsignatura, aa.diaSemana, aa.horaInicio, aa.horaFin
      FROM asignatura_aula aa
      JOIN asignaturas a ON aa.idAsignatura = a.idAsignatura
      WHERE aa.idAula = $1
    `, [idAula]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error al asignar aula:', err.message);
    res.status(500).json({ error: 'Error al asignar aula' });
  }
};

// Quitar una asignatura de un aula
exports.quitarAsignatura = async (req, res) => {
  const { idAula, idAsignatura } = req.params;
  try {
    await pool.query(
      'DELETE FROM asignatura_aula WHERE idAula = $1 AND idAsignatura = $2',
      [idAula, idAsignatura]
    );

    const result = await pool.query(`
      SELECT a.idAsignatura, a.nombreAsignatura, aa.diaSemana, aa.horaInicio, aa.horaFin
      FROM asignatura_aula aa
      JOIN asignaturas a ON aa.idAsignatura = a.idAsignatura
      WHERE aa.idAula = $1
    `, [idAula]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error al quitar asignatura:', err.message);
    res.status(500).json({ error: 'Error al quitar asignatura del aula' });
  }
};
