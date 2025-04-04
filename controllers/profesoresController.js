const pool = require('../config/db');

// GET - listar todos los profesores
exports.getProfesores = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profesores ORDER BY idProfesor');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los profesores' });
  }
};

// POST - agregar nuevo profesor
exports.createProfesor = async (req, res) => {
  const { codeProfesor, nombreProfesor, mailProfesor } = req.body;
  if (!codeProfesor || !nombreProfesor || !mailProfesor) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const insert = await pool.query(`
      INSERT INTO profesores (codeProfesor, nombreProfesor, mailProfesor)
      VALUES ($1, $2, $3) RETURNING *`,
      [codeProfesor, nombreProfesor, mailProfesor]
    );
    res.status(201).json(insert.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear el profesor' });
  }
};

// PUT - actualizar un profesor
exports.updateProfesor = async (req, res) => {
  const { id } = req.params;
  const { codeProfesor, nombreProfesor, mailProfesor } = req.body;

  try {
    const update = await pool.query(`
      UPDATE profesores SET
        codeProfesor = $1,
        nombreProfesor = $2,
        mailProfesor = $3
      WHERE idProfesor = $4 RETURNING *`,
      [codeProfesor, nombreProfesor, mailProfesor, id]
    );
    res.json(update.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el profesor' });
  }
};

// DELETE - eliminar un profesor
exports.deleteProfesor = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM profesores WHERE idProfesor = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el profesor' });
  }
};
