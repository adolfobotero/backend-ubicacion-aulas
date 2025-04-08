// controllers/asignaturasController.js
const pool = require('../config/db');

// Obtener todas las asignaturas con profesores asignados (pueden ser varios)
exports.getAsignaturas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, 
        COALESCE(
          string_agg(DISTINCT p.nombreProfesor, ', '), 'No asignado'
        ) AS profesores
      FROM asignaturas a
      LEFT JOIN profesor_asignatura pa ON a.idAsignatura = pa.idAsignatura
      LEFT JOIN profesores p ON pa.idProfesor = p.idProfesor
      GROUP BY a.idAsignatura
      ORDER BY a.idAsignatura
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener asignaturas:', err.message);
    res.status(500).json({ message: 'Error al obtener asignaturas' });
  }
};

// Crear una nueva asignatura
exports.createAsignatura = async (req, res) => {
  const { codeAsignatura, nombreAsignatura } = req.body;
  if (!codeAsignatura || !nombreAsignatura) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO asignaturas (codeAsignatura, nombreAsignatura)
       VALUES ($1, $2) RETURNING *`,
      [codeAsignatura, nombreAsignatura]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear asignatura:', err.message);
    res.status(500).json({ message: 'Error al crear asignatura' });
  }
};

// Actualizar una asignatura existente
exports.updateAsignatura = async (req, res) => {
  const idAsignatura = req.params.id;
  const { codeAsignatura, nombreAsignatura } = req.body;

  try {
    const result = await pool.query(
      `UPDATE asignaturas SET codeAsignatura = $1, nombreAsignatura = $2
       WHERE idAsignatura = $3 RETURNING *`,
      [codeAsignatura, nombreAsignatura, idAsignatura]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar asignatura:', err.message);
    res.status(500).json({ message: 'Error al actualizar asignatura' });
  }
};

// Eliminar una asignatura y sus relaciones
exports.deleteAsignatura = async (req, res) => {
  const idAsignatura = req.params.id;
  try {
    await pool.query('DELETE FROM profesor_asignatura WHERE idAsignatura = $1', [idAsignatura]);
    await pool.query('DELETE FROM asignaturas WHERE idAsignatura = $1', [idAsignatura]);
    res.json({ message: 'Asignatura eliminada' });
  } catch (err) {
    console.error('Error al eliminar asignatura:', err.message);
    res.status(500).json({ message: 'Error al eliminar asignatura' });
  }
};

// Obtener profesores asignados a una asignatura específica
exports.getProfesoresPorAsignatura = async (req, res) => {
  const idAsignatura = req.params.id;
  try {
    const result = await pool.query(
      `SELECT p.idProfesor, p.nombreProfesor, pa.horarioAsignatura
       FROM profesor_asignatura pa
       JOIN profesores p ON pa.idProfesor = p.idProfesor
       WHERE pa.idAsignatura = $1`,
      [idAsignatura]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener profesores por asignatura:', err.message);
    res.status(500).json({ message: 'Error al obtener profesores por asignatura' });
  }
};

// Asignar un profesor con horario a una asignatura
exports.asignarProfesor = async (req, res) => {
  const idAsignatura = req.params.id;
  const { idProfesor, horarioAsignatura } = req.body;

  if (!idProfesor || !horarioAsignatura) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  try {
    // Verifica si ya existe esa asignación exacta
    const existente = await pool.query(`
      SELECT * FROM profesor_asignatura
      WHERE idProfesor = $1 AND idAsignatura = $2 AND horarioAsignatura = $3
    `, [idProfesor, idAsignatura, horarioAsignatura]);

    if (existente.rows.length > 0) {
      return res.status(400).json({ message: 'Ya existe esta asignación con ese horario' });
    }

    // Inserta nueva asignación
    await pool.query(`
      INSERT INTO profesor_asignatura (idProfesor, idAsignatura, horarioAsignatura)
      VALUES ($1, $2, $3)
    `, [idProfesor, idAsignatura, horarioAsignatura]);

    // Devuelve lista actualizada
    const nuevos = await pool.query(`
      SELECT p.idProfesor, p.nombreProfesor, pa.horarioAsignatura
      FROM profesor_asignatura pa
      JOIN profesores p ON pa.idProfesor = p.idProfesor
      WHERE pa.idAsignatura = $1
    `, [idAsignatura]);

    res.json(nuevos.rows);
  } catch (err) {
    console.error('Error al asignar profesor:', err.message);
    res.status(500).json({ error: 'Error al asignar profesor' });
  }
};


// Quitar un profesor de una asignatura
// y devolver la lista actualizada de profesores asignados a esa asignatura
exports.quitarProfesor = async (req, res) => {
  const { idAsignatura, idProfesor } = req.params;
  const horarioAsignatura = decodeURIComponent(req.params.horarioAsignatura);

  try {
    await pool.query(
      `DELETE FROM profesor_asignatura
       WHERE idAsignatura = $1 AND idProfesor = $2 AND horarioAsignatura = $3`,
      [idAsignatura, idProfesor, horarioAsignatura]
    );

    const nuevos = await pool.query(
      `SELECT p.idProfesor, p.nombreProfesor, pa.horarioAsignatura
       FROM profesor_asignatura pa
       JOIN profesores p ON pa.idProfesor = p.idProfesor
       WHERE pa.idAsignatura = $1`,
      [idAsignatura]
    );

    res.json(nuevos.rows);
  } catch (err) {
    console.error('Error al quitar profesor:', err.message);
    res.status(500).json({ error: 'Error al quitar profesor' });
  }
};

