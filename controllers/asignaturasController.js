const pool = require('../config/db');
const XLSX = require('xlsx');

// Obtener todas las asignaturas con profesores asignados (pueden ser varios)
exports.getAsignaturas = async (req, res) => {
  const { pagina = 1, limite = 5, busqueda = '' } = req.query;
  const offset = (pagina - 1) * limite;

  try {
    const result = await pool.query(`
      SELECT a.idAsignatura, a.codeAsignatura, a.nombreAsignatura,
        COALESCE(string_agg(DISTINCT p.nombreProfesor, ', '), '') AS profesores
      FROM asignaturas a
      LEFT JOIN profesor_asignatura pa ON a.idAsignatura = pa.idAsignatura
      LEFT JOIN profesores p ON pa.idProfesor = p.idProfesor
      WHERE 
        LOWER(a.codeAsignatura) LIKE LOWER($1) OR
        LOWER(a.nombreAsignatura) LIKE LOWER($1)
      GROUP BY a.idAsignatura
      ORDER BY a.codeAsignatura
      LIMIT $2 OFFSET $3
    `, [`%${busqueda}%`, limite, offset]);

    const totalRes = await pool.query(`
      SELECT COUNT(*) FROM asignaturas
      WHERE 
        LOWER(codeAsignatura) LIKE LOWER($1) OR
        LOWER(nombreAsignatura) LIKE LOWER($1)
    `, [`%${busqueda}%`]);

    const total = parseInt(totalRes.rows[0].count, 10);

    res.json({ registros: result.rows, total });
  } catch (err) {
    console.error('Error al obtener asignaturas:', err.message);
    res.status(500).json({ message: 'Error al obtener asignaturas' });
  }
};

// Obtener el detalle de la asignatura como el aula y horario
exports.getDetalleAsignatura = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT a.nombreasignatura, a.codeasignatura,
             au.codeaula, au.nombreaula,
             aa.diasemana, aa.horainicio, aa.horafin,
             p.nombreprofesor, p.mailprofesor
      FROM asignaturas a
      LEFT JOIN asignatura_aula aa ON a.idasignatura = aa.idasignatura
      LEFT JOIN aulas au ON aa.idaula = au.idaula
      LEFT JOIN profesores p ON aa.idprofesor = p.idprofesor
      WHERE a.idasignatura = $1
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener detalle de asignatura:', err.message);
    res.status(500).json({ message: 'Error al obtener detalle' });
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
      `SELECT p.idProfesor, p.nombreProfesor, p.mailProfesor
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

// Asignar un profesor a una asignatura
exports.asignarProfesor = async (req, res) => {
  const idAsignatura = req.params.id;
  const { idProfesor } = req.body;

  if (!idProfesor) {
    return res.status(400).json({ message: 'Falta el id del profesor' });
  }

  try {
    // Verifica si ya existe esa asignación exacta
    const existente = await pool.query(`
      SELECT * FROM profesor_asignatura
      WHERE idProfesor = $1 AND idAsignatura = $2
    `, [idProfesor, idAsignatura]);

    if (existente.rows.length > 0) {
      return res.status(400).json({ message: 'El profesor ya tiene una asignación al curso' });
    }

    // Inserta la relación
    await pool.query(`
      INSERT INTO profesor_asignatura (idProfesor, idAsignatura)
      VALUES ($1, $2)
    `, [idProfesor, idAsignatura]);

    // Devuelve lista actualizada
    const nuevos = await pool.query(`
      SELECT p.idProfesor, p.nombreProfesor, p.mailProfesor
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
exports.quitarProfesor = async (req, res) => {
  const { idAsignatura, idProfesor } = req.params;

  try {
    await pool.query(
      `DELETE FROM profesor_asignatura
       WHERE idAsignatura = $1 AND idProfesor = $2`,
      [idAsignatura, idProfesor]
    );

    const nuevos = await pool.query(
      `SELECT p.idProfesor, p.nombreProfesor, p.mailProfesor
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

// Obtener el historial de cambios de aula para una asignatura específica
// (incluyendo cambios de aula y asignación de profesores)
exports.getHistorialAsignatura = async (req, res) => {
  const idAsignatura = req.params.id;
  const { pagina = 1, limite = 10 } = req.query;
  const offset = (pagina - 1) * limite;

  try {
    const result = await pool.query(`
      SELECT h.*, 
        a1.nombreAula AS nombreAulaAnterior,
        a2.nombreAula AS nombreAulaNueva,
        u.mailUsuario AS usuarioCambio
      FROM historial_asignatura_aula h
      LEFT JOIN aulas a1 ON h.idAulaAnterior = a1.idAula
      LEFT JOIN aulas a2 ON h.idAulaNueva = a2.idAula
      LEFT JOIN usuarios u ON h.idUsuarioCambio = u.idUsuario
      WHERE h.idAsignatura = $1
      ORDER BY h.fechaCambio DESC
      LIMIT $2 OFFSET $3
    `, [idAsignatura, limite, offset]);

    const totalRes = await pool.query(
      `SELECT COUNT(*) FROM historial_asignatura_aula WHERE idAsignatura = $1`,
      [idAsignatura]
    );

    const total = parseInt(totalRes.rows[0].count, 10);

    res.json({
      registros: result.rows,
      total
    });
  } catch (err) {
    console.error('Error al obtener historial de asignatura:', err.message);
    res.status(500).json({ message: 'Error al obtener historial de asignatura' });
  }
};

//Importar asignaturas con profesores desde Excel
exports.importarAsignaturas = async (req, res) => {
  try {
    const { asignaturas } = req.body;
    if (!Array.isArray(asignaturas) || asignaturas.length === 0) {
      return res.status(400).json({ error: 'No se recibieron asignaturas válidas' });
    }

    let insertados = 0;
    let ignorados = 0;

    for (const a of asignaturas) {
      const { codeAsignatura, nombreAsignatura, codigosProfesores } = a;

      if (!codeAsignatura || !nombreAsignatura) {
        ignorados++;
        continue;
      }

      // Verificar si la asignatura ya existe
      const yaExiste = await pool.query('SELECT idAsignatura FROM asignaturas WHERE codeAsignatura = $1', [codeAsignatura]);
      let idAsignatura;

      if (yaExiste.rows.length > 0) {
        idAsignatura = yaExiste.rows[0].idasignatura;
      } else {
        const nueva = await pool.query(
          'INSERT INTO asignaturas (codeAsignatura, nombreAsignatura) VALUES ($1, $2) RETURNING idAsignatura',
          [codeAsignatura, nombreAsignatura]
        );
        idAsignatura = nueva.rows[0].idasignatura;
        insertados++;
      }

      // Relación con profesores
      if (codigosProfesores) {
        const codigos = codigosProfesores.split(';').map(c => c.trim());

        for (const code of codigos) {
          const prof = await pool.query('SELECT idProfesor FROM profesores WHERE codeProfesor = $1', [code]);
          if (prof.rows.length > 0) {
            const idProfesor = prof.rows[0].idprofesor;

            // Insertar relación única
            await pool.query(
              `INSERT INTO profesor_asignatura (idProfesor, idAsignatura)
               VALUES ($1, $2)
               ON CONFLICT (idProfesor, idAsignatura) DO NOTHING`,
              [idProfesor, idAsignatura]
            );
          }
        }
      }
    }

    res.json({ insertados, ignorados });
  } catch (err) {
    console.error('Error al importar asignaturas:', err);
    res.status(500).json({ error: 'Error al importar asignaturas' });
  }
};

// Exportar asignaturas a Excel con profesores asignados
exports.exportarAsignaturas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.codeAsignatura, a.nombreAsignatura,
        STRING_AGG(p.codeProfesor, ';') AS codigosProfesores
      FROM asignaturas a
      LEFT JOIN profesor_asignatura pa ON a.idAsignatura = pa.idAsignatura
      LEFT JOIN profesores p ON pa.idProfesor = p.idProfesor
      GROUP BY a.idAsignatura
      ORDER BY a.nombreAsignatura
    `);

    const data = result.rows;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asignaturas');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=asignaturas.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Error al exportar asignaturas:', err);
    res.status(500).json({ error: 'Error al exportar asignaturas' });
  }
};
