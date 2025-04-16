const pool = require('../config/db');
const XLSX = require('xlsx');

// GET - listar todos los profesores
exports.getProfesores = async (req, res) => {
  const { pagina = 1, limite = 5, busqueda = '' } = req.query;
  const offset = (pagina - 1) * limite;

  try {
    const result = await pool.query(`
      SELECT * FROM profesores
      WHERE LOWER(nombreProfesor) LIKE LOWER($1) OR LOWER(mailProfesor) LIKE LOWER($1)
      ORDER BY idProfesor
      LIMIT $2 OFFSET $3
    `, [`%${busqueda}%`, limite, offset]);

    const totalRes = await pool.query(`
      SELECT COUNT(*) FROM profesores
      WHERE LOWER(nombreProfesor) LIKE LOWER($1) OR LOWER(mailProfesor) LIKE LOWER($1)
    `, [`%${busqueda}%`]);

    const total = parseInt(totalRes.rows[0].count, 10);

    res.json({ registros: result.rows, total });
  } catch (err) {
    console.error(err);
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

// Importar profesores desde Excel
exports.importarProfesores = async (req, res) => {
  const { profesores } = req.body;

  let insertados = 0;
  let ignorados = 0;

  try {
    for (const p of profesores) {
      const { codeProfesor, nombreProfesor, mailProfesor } = p;

      if (!codeProfesor || !nombreProfesor || !mailProfesor || !mailProfesor.endsWith('@ucaldas.edu.co')) {
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
};


// Exportar profesores a Excel
exports.exportarProfesores = async (req, res) => {
  try {
    const result = await pool.query('SELECT codeProfesor, nombreProfesor, mailProfesor FROM profesores ORDER BY nombreProfesor');

    const data = result.rows;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profesores');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=profesores.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Error al exportar profesores:', err);
    res.status(500).json({ error: 'Error al exportar profesores' });
  }
};
