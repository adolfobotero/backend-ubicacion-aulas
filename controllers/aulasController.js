const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');

// Obtener aulas con nombre de la sede
exports.getAulas = async (req, res) => {
  const { pagina = 1, limite = 5, busqueda = '' } = req.query;
  const offset = (pagina - 1) * limite;

  try {
    const result = await pool.query(`
      SELECT a.*, s.nombreSede
      FROM aulas a
      JOIN sedes s ON a.idSedeActual = s.idSede
      WHERE 
        LOWER(a.codeAula) LIKE LOWER($1) OR
        LOWER(a.nombreAula) LIKE LOWER($1) OR
        LOWER(s.nombreSede) LIKE LOWER($1)
      ORDER BY a.codeAula
      LIMIT $2 OFFSET $3
    `, [`%${busqueda}%`, limite, offset]);

    const totalRes = await pool.query(`
      SELECT COUNT(*) FROM aulas a
      JOIN sedes s ON a.idSedeActual = s.idSede
      WHERE 
        LOWER(a.codeAula) LIKE LOWER($1) OR
        LOWER(a.nombreAula) LIKE LOWER($1) OR
        LOWER(s.nombreSede) LIKE LOWER($1)
    `, [`%${busqueda}%`]);

    const total = parseInt(totalRes.rows[0].count, 10);

    res.json({ registros: result.rows, total });
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

  try {
    // Verificar si el aula existe
    const actual = await pool.query(`
      SELECT * FROM aulas WHERE idAula = $1
    `, [idAula]);

    if (actual.rows.length === 0) {
      return res.status(404).json({ message: 'Aula no encontrada' });
    }

    // Actualizar aula directamente
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
      SELECT 
        a.idAsignatura, 
        a.nombreAsignatura, 
        aa.diaSemana, 
        aa.horaInicio, 
        aa.horaFin,
        p.idProfesor,
        p.nombreProfesor,
        p.mailProfesor
      FROM asignatura_aula aa
      JOIN asignaturas a ON aa.idAsignatura = a.idAsignatura
      LEFT JOIN profesores p ON aa.idProfesor = p.idProfesor
      WHERE aa.idAula = $1
    `, [idAula]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener asignaturas por aula:', err.message);
    res.status(500).json({ message: 'Error al obtener asignaturas por aula' });
  }
};

// Asignar aula a una asignatura incluyendo profesor y validación de traslape
exports.asignarAsignatura = async (req, res) => {
  const idAulaNueva = req.params.id;
  const { idAsignatura, idProfesor, diaSemana, horaInicio, horaFin } = req.body;
  const idUsuarioCambio = req.user?.idusuario || null;

  if (!idAsignatura || !idProfesor || !diaSemana || !horaInicio || !horaFin) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    // Validar si el aula ya tiene asignación en ese horario
    const conflicto = await pool.query(`
      SELECT 1 FROM asignatura_aula
      WHERE idAula = $1 AND diaSemana = $2
        AND horaInicio < $4 AND horaFin > $3
    `, [idAulaNueva, diaSemana, horaInicio, horaFin]);

    if (conflicto.rows.length > 0) {
      return res.status(409).json({ message: 'El aula ya está ocupada en ese horario.' });
    }

    // Verificar si la asignatura ya estaba asignada en otro aula ese mismo día
    const previa = await pool.query(`
      SELECT * FROM asignatura_aula
      WHERE idAsignatura = $1 AND diaSemana = $2
    `, [idAsignatura, diaSemana]);

    // Si había una asignación previa, registrar en historial y eliminarla
    if (previa.rows.length > 0) {
      const anterior = previa.rows[0];

      await pool.query(`
        INSERT INTO historial_asignatura_aula (
          idAsignatura,
          idAulaAnterior,
          idAulaNueva,
          diaSemanaAnterior,
          horaInicioAnterior,
          horaFinAnterior,
          diaSemanaNuevo,
          horaInicioNuevo,
          horaFinNuevo,
          idUsuarioCambio,
          motivo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        idAsignatura,
        anterior.idaula,
        idAulaNueva,
        anterior.diasemana,
        anterior.horainicio,
        anterior.horafin,
        diaSemana,
        horaInicio,
        horaFin,
        idUsuarioCambio,
        'Reubicación de aula'
      ]);

      await pool.query(
        'DELETE FROM asignatura_aula WHERE idAsignatura = $1 AND diaSemana = $2',
        [idAsignatura, diaSemana]
      );
    }

    // Nueva asignación incluyendo idProfesor
    await pool.query(`
      INSERT INTO asignatura_aula (idAsignatura, idAula, idProfesor, diaSemana, horaInicio, horaFin)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [idAsignatura, idAulaNueva, idProfesor, diaSemana, horaInicio, horaFin]);

    // Devolver nuevas asignaciones
    const result = await pool.query(`
      SELECT 
        a.idAsignatura, 
        a.nombreAsignatura, 
        aa.diaSemana, 
        aa.horaInicio, 
        aa.horaFin,
        p.nombreProfesor,
        p.mailProfesor
      FROM asignatura_aula aa
      JOIN asignaturas a ON aa.idAsignatura = a.idAsignatura
      LEFT JOIN profesores p ON aa.idProfesor = p.idProfesor
      WHERE aa.idAula = $1
    `, [idAulaNueva]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error al asignar aula:', err.message);
    res.status(500).json({ error: 'Error al asignar aula' });
  }
};

// Obtener todas las asignaturas actualmente asignadas a un aula (para mover)
exports.getAsignaturasAsignadas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.idAsignatura AS idasignatura,
        a.nombreAsignatura AS nombreasignatura,
        aa.idAula AS idaula,
        au.nombreAula AS nombreaula,
        aa.diaSemana AS diasemana,
        aa.horaInicio AS horainicio,
        aa.horaFin AS horafin,
        p.nombreProfesor,
        p.mailProfesor
      FROM asignatura_aula aa
      JOIN asignaturas a ON aa.idAsignatura = a.idAsignatura
      JOIN aulas au ON aa.idAula = au.idAula
      LEFT JOIN profesores p ON aa.idProfesor = p.idProfesor
      ORDER BY A.nombreAsignatura
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener asignaturas asignadas:', err.message);
    res.status(500).json({ message: 'Error al obtener asignaturas asignadas' });
  }
};

// Mover asignatura a otra aula y registrar en historial
exports.moverAsignatura = async (req, res) => {
  const { idaula } = req.params;

  const {
    idAsignatura,
    idProfesor,
    nuevoDia,
    nuevaHoraInicio,
    nuevaHoraFin,
    aulaAnterior,
    diaAnterior,
    horaInicioAnterior,
    horaFinAnterior
  } = req.body;

  // Validación básica
  if (!idaula || !idAsignatura || !idProfesor || !nuevoDia || !nuevaHoraInicio || !nuevaHoraFin) {
    return res.status(400).json({ message: 'Faltan datos obligatorios para mover la asignatura.' });
  }

  try {
    // Decodificar usuario del token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const idUsuarioCambio = decoded.idusuario;

    // Verificar existencia de la asignación actual
    const asignacionActual = await pool.query(
      `SELECT * FROM asignatura_aula
       WHERE idAsignatura = $1 AND idAula = $2 AND diaSemana = $3 AND horaInicio = $4 AND horaFin = $5`,
      [idAsignatura, aulaAnterior, diaAnterior, horaInicioAnterior, horaFinAnterior]
    );

    if (asignacionActual.rows.length === 0) {
      return res.status(404).json({ message: 'Asignación anterior no encontrada.' });
    }

    // Validar conflictos en la nueva aula
    const conflicto = await pool.query(
      `SELECT 1 FROM asignatura_aula
       WHERE idAula = $1 AND diaSemana = $2 AND horaInicio < $3 AND horaFin > $4`,
      [idaula, nuevoDia, nuevaHoraFin, nuevaHoraInicio]
    );

    if (conflicto.rows.length > 0) {
      return res.status(409).json({ message: 'El aula ya está ocupada en ese horario.' });
    }

    // Eliminar la asignación anterior
    await pool.query(
      `DELETE FROM asignatura_aula
       WHERE idAsignatura = $1 AND idAula = $2 AND diaSemana = $3 AND horaInicio = $4 AND horaFin = $5`,
      [idAsignatura, aulaAnterior, diaAnterior, horaInicioAnterior, horaFinAnterior]
    );

    // Insertar nueva asignación con profesor
    await pool.query(
      `INSERT INTO asignatura_aula (idAsignatura, idAula, idProfesor, diaSemana, horaInicio, horaFin)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [idAsignatura, idaula, idProfesor, nuevoDia, nuevaHoraInicio, nuevaHoraFin]
    );

    // Registrar historial
    await pool.query(
      `INSERT INTO historial_asignatura_aula (
        idAsignatura,
        idAulaAnterior,
        idAulaNueva,
        diaSemanaAnterior,
        horaInicioAnterior,
        horaFinAnterior,
        diaSemanaNuevo,
        horaInicioNuevo,
        horaFinNuevo,
        idUsuarioCambio,
        motivo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        idAsignatura,
        aulaAnterior,
        idaula,
        diaAnterior,
        horaInicioAnterior,
        horaFinAnterior,
        nuevoDia,
        nuevaHoraInicio,
        nuevaHoraFin,
        idUsuarioCambio,
        'Cambio manual desde botón Mover'
      ]
    );

    // Retornar asignaciones actualizadas de la nueva aula
    const nuevasAsignaciones = await pool.query(
      `SELECT a.idAsignatura, a.nombreAsignatura, aa.diaSemana, aa.horaInicio, aa.horaFin
       FROM asignatura_aula aa
       JOIN asignaturas a ON aa.idAsignatura = a.idAsignatura
       WHERE aa.idAula = $1`,
      [idaula]
    );

    res.json(nuevasAsignaciones.rows);
  } catch (err) {
    console.error('Error al mover asignatura:', err.message);
    res.status(500).json({ message: 'Error al mover asignatura' });
  }
};

// Importar aulas desde Excel
exports.importarAulas = async (req, res) => {
  const { aulas } = req.body;

  let insertados = 0;
  let ignorados = 0;

  try {
    for (const a of aulas) {
      const { codeAula, nombreAula, capAula, edificioAula, pisoAula, codeSede } = a;

      if (!codeAula || !nombreAula || !codeSede) {
        ignorados++;
        continue;
      }

      // Buscar la sede
      const sedeRes = await pool.query('SELECT idSede FROM sedes WHERE codeSede = $1', [codeSede]);
      if (sedeRes.rows.length === 0) {
        ignorados++;
        continue;
      }

      const idSedeActual = sedeRes.rows[0].idsede;

      const result = await pool.query(
        `INSERT INTO aulas (codeAula, nombreAula, capAula, edificioAula, pisoAula, idSedeActual)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (codeAula) DO NOTHING`,
        [codeAula, nombreAula, capAula || null, edificioAula || null, pisoAula || null, idSedeActual]
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
    console.error('Error al importar aulas:', err);
    res.status(500).json({ message: 'Error al importar aulas' });
  }
};

// Importar asignaciones de aulas
exports.importarAsignaciones = async (req, res) => {
  const { asignaciones } = req.body;

  let insertados = 0;
  let ignorados = 0;
  const conflictos = []; // aquí se guardan los conflictos de importación

  try {
    for (const item of asignaciones) {
      const { codeAula, codeAsignatura, codeProfesor, diaSemana, horaInicio, horaFin } = item;

      if (!codeAula || !codeAsignatura || !codeProfesor || !diaSemana || !horaInicio || !horaFin) {
        ignorados++;
        conflictos.push({ ...item, razon: 'Datos incompletos' });
        continue;
      }

      const aulaRes = await pool.query('SELECT idAula FROM aulas WHERE codeAula = $1', [codeAula]);
      const asignaturaRes = await pool.query('SELECT idAsignatura FROM asignaturas WHERE codeAsignatura = $1', [codeAsignatura]);
      const profesorRes = await pool.query('SELECT idProfesor FROM profesores WHERE codeProfesor = $1', [codeProfesor]);

      if (aulaRes.rows.length === 0 || asignaturaRes.rows.length === 0 || profesorRes.rows.length === 0) {
        ignorados++;
        conflictos.push({ ...item, razon: 'Código inválido (aula/asignatura/profesor)' });
        continue;
      }

      const idAula = aulaRes.rows[0].idaula;
      const idAsignatura = asignaturaRes.rows[0].idasignatura;
      const idProfesor = profesorRes.rows[0].idprofesor;

      // Verificar traslapes
      const traslape = await pool.query(`
        SELECT 1 FROM asignatura_aula
        WHERE idAula = $1 AND diaSemana = $2
          AND horaInicio < $4 AND horaFin > $3
      `, [idAula, diaSemana, horaInicio, horaFin]);

      if (traslape.rows.length > 0) {
        ignorados++;
        conflictos.push({ ...item, razon: 'Horario traslapado con otra asignación en la misma aula' });
        continue;
      }

      const result = await pool.query(`
        INSERT INTO asignatura_aula (idAsignatura, idAula, idProfesor, diaSemana, horaInicio, horaFin)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (idAsignatura, idAula, diaSemana, horaInicio, horaFin) DO NOTHING
      `, [idAsignatura, idAula, idProfesor, diaSemana, horaInicio, horaFin]);

      if (result.rowCount > 0) {
        insertados++;
      } else {
        ignorados++;
        conflictos.push({ ...item, razon: 'Registro duplicado' });
      }
    }

    res.status(200).json({
      message: 'Importación completada',
      insertados,
      ignorados,
      conflictos
    });

  } catch (err) {
    console.error('Error al importar asignaciones:', err);
    res.status(500).json({ message: 'Error al importar asignaciones' });
  }
};

//Exportar aulas a Excel con las asignaciones
exports.exportarAulas = async (req, res) => {
  try {
    // Hoja 1: Datos de aulas
    const aulasRes = await pool.query(`
      SELECT 
        a.codeAula,
        a.nombreAula,
        a.capAula,
        a.edificioAula,
        a.pisoAula,
        s.codeSede,
        s.nombreSede
      FROM aulas a
      JOIN sedes s ON a.idSedeActual = s.idSede
      ORDER BY s.nombreSede, a.nombreAula;
    `);
    const aulasData = aulasRes.rows;

    // Hoja 2: Asignaturas asignadas a cada aula
    const asignacionesRes = await pool.query(`
      SELECT 
        au.codeAula,
        asg.codeAsignatura,
        asg.nombreAsignatura,
        p.codeProfesor,
        p.nombreProfesor,
        aa.diaSemana,
        aa.horaInicio,
        aa.horaFin
      FROM asignatura_aula aa
      JOIN aulas au ON aa.idAula = au.idAula
      JOIN asignaturas asg ON aa.idAsignatura = asg.idAsignatura
      JOIN profesores p ON aa.idProfesor = p.idProfesor
      ORDER BY au.codeAula, aa.diaSemana, aa.horaInicio;
    `);
    const asignacionesData = asignacionesRes.rows;

    // Crear hojas
    const wb = XLSX.utils.book_new();

    const wsAulas = XLSX.utils.json_to_sheet(aulasData);
    XLSX.utils.book_append_sheet(wb, wsAulas, 'Aulas');

    const wsAsignaciones = XLSX.utils.json_to_sheet(asignacionesData);
    XLSX.utils.book_append_sheet(wb, wsAsignaciones, 'Asignaciones');

    // Enviar archivo
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=aulas.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Error al exportar aulas con asignaciones:', err);
    res.status(500).json({ error: 'Error al exportar aulas' });
  }
};
