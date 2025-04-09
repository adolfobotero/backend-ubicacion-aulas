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
  const { codeAula, nombreAula, capAula, edificioAula, pisoAula, idSedeActual } = req.body;
  if (!codeAula || !nombreAula || !capAula || !edificioAula || !pisoAula || !idSedeActual) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO aulas (codeAula, nombreAula, capAula, edificioAula, pisoAula, idSedeActual)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [codeAula, nombreAula, capAula, edificioAula, pisoAula, idSedeActual]
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
  const {
    codeAula,
    nombreAula,
    capAula,
    edificioAula,
    pisoAula,
    idSedeActual
  } = req.body;

  const usuarioCambio = req.user?.mailUsuario || 'desconocido';
  const observacion = 'Actualización de datos del aula';

  try {
    // Obtener datos actuales del aula y su sede
    const actual = await pool.query(`
      SELECT a.*, s.nombreSede
      FROM aulas a
      JOIN sedes s ON a.idSedeActual = s.idSede
      WHERE a.idAula = $1
    `, [idAula]);

    if (actual.rows.length === 0) {
      return res.status(404).json({ message: 'Aula no encontrada' });
    }

    const aulaActual = actual.rows[0];

    // Obtener nombre de la nueva sede
    const sedeNuevaRes = await pool.query(`SELECT * FROM sedes WHERE idSede = $1`, [idSedeActual]);
    const sedeNueva = sedeNuevaRes.rows[0];
    //console.log('Usuario autenticado:', req.user);

    // Guardar en historial antes de actualizar
    await pool.query(`
      INSERT INTO historial_ubicacion (
        idAula, codeAula,
        sedeAnterior, sedeNueva,
        nombreSedeAnterior, nombreSedeNueva,
        edificioAnterior, edificioNuevo,
        pisoAnterior, pisoNuevo,
        usuarioCambio, observacion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      idAula,
      aulaActual.codeaula,
      aulaActual.idsedeactual,
      idSedeActual,
      aulaActual.nombresede,
      sedeNueva?.nombresede || '',
      aulaActual.edificioaula,
      edificioAula,
      aulaActual.pisoaula,
      pisoAula,
      usuarioCambio,
      observacion
    ]);

    // Actualizar aula
    const result = await pool.query(`
      UPDATE aulas
      SET codeAula = $1,
          nombreAula = $2,
          capAula = $3,
          edificioAula = $4,
          pisoAula = $5,
          idSedeActual = $6
      WHERE idAula = $7
      RETURNING *
    `, [codeAula, nombreAula, capAula, edificioAula, pisoAula, idSedeActual, idAula]);

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

// Obtener el historial de ubicaciones de un aula
// Se agrega paginación y se ordena por fecha de cambio (fechaCambio) de manera descendente
exports.getHistorialUbicacion = async (req, res) => {
  const idAula = req.params.id;
  const { pagina = 1, limite = 10 } = req.query;
  const offset = (pagina - 1) * limite;

  try {
    const result = await pool.query(`
      SELECT * FROM historial_ubicacion
      WHERE idAula = $1
      ORDER BY fechaCambio DESC
      LIMIT $2 OFFSET $3
    `, [idAula, limite, offset]);

    const totalRes = await pool.query(
      `SELECT COUNT(*) FROM historial_ubicacion WHERE idAula = $1`,
      [idAula]
    );

    const total = parseInt(totalRes.rows[0].count, 10);

    res.json({ registros: result.rows, total });
  } catch (err) {
    console.error('Error al obtener historial:', err.message);
    res.status(500).json({ message: 'Error al obtener historial de ubicación' });
  }
};

