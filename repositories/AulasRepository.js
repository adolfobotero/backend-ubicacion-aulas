const pool = require('../config/Db');

class AulasRepository {
  async getAulas(pagina = 1, limite = 5, busqueda = '') {
    const offset = (pagina - 1) * limite;

    const result = await pool.query(`
      SELECT a.*, s.nombreSede
      FROM aulas a
      JOIN sedes s ON a.idSedeActual = s.idSede
      WHERE LOWER(a.codeAula) LIKE LOWER($1)
        OR LOWER(a.nombreAula) LIKE LOWER($1)
        OR LOWER(s.nombreSede) LIKE LOWER($1)
      ORDER BY a.codeAula
      LIMIT $2 OFFSET $3
    `, [`%${busqueda}%`, limite, offset]);

    const totalRes = await pool.query(`
      SELECT COUNT(*) FROM aulas a
      JOIN sedes s ON a.idSedeActual = s.idSede
      WHERE LOWER(a.codeAula) LIKE LOWER($1)
        OR LOWER(a.nombreAula) LIKE LOWER($1)
        OR LOWER(s.nombreSede) LIKE LOWER($1)
    `, [`%${busqueda}%`]);

    return {
      registros: result.rows,
      total: parseInt(totalRes.rows[0].count, 10)
    };
  }

  async createAula(data) {
    const { codeAula, nombreAula, capAula, edificioAula, pisoAula, idSedeActual } = data;

    const result = await pool.query(`
      INSERT INTO aulas (codeAula, nombreAula, capAula, edificioAula, pisoAula, idSedeActual)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [codeAula, nombreAula, capAula, edificioAula, pisoAula, idSedeActual]);

    return result.rows[0];
  }

  async updateAula(id, data) {
    const { codeAula, nombreAula, capAula, edificioAula, pisoAula, idSedeActual } = data;

    const result = await pool.query(`
      UPDATE aulas
      SET codeAula = $1, nombreAula = $2, capAula = $3, edificioAula = $4,
          pisoAula = $5, idSedeActual = $6
      WHERE idAula = $7
      RETURNING *
    `, [codeAula, nombreAula, capAula, edificioAula, pisoAula, idSedeActual, id]);

    return result.rows[0];
  }

  async deleteAula(id) {
    await pool.query('DELETE FROM asignatura_aula WHERE idAula = $1', [id]);
    await pool.query('DELETE FROM aulas WHERE idAula = $1', [id]);
    return true;
  }

  async getAsignaturasPorAula(idAula) {
    const result = await pool.query(`
      SELECT 
        a.idAsignatura, a.nombreAsignatura,
        aa.diaSemana, aa.horaInicio, aa.horaFin,
        p.idProfesor, p.nombreProfesor, p.mailProfesor
      FROM asignatura_aula aa
      JOIN asignaturas a ON aa.idAsignatura = a.idAsignatura
      LEFT JOIN profesores p ON aa.idProfesor = p.idProfesor
      WHERE aa.idAula = $1
    `, [idAula]);

    return result.rows;
  }

  async asignarAsignatura(idAulaNueva, datos, usuario) {
    const { idAsignatura, idProfesor, diaSemana, horaInicio, horaFin } = datos;

    if (!idAsignatura || !idProfesor || !diaSemana || !horaInicio || !horaFin) {
      throw new Error('Todos los campos son obligatorios');
    }

    const idUsuarioCambio = usuario?.idusuario || null;

    // Verificar conflicto de horario
    const conflicto = await pool.query(`
      SELECT 1 FROM asignatura_aula
      WHERE idAula = $1 AND diaSemana = $2
        AND horaInicio < $4 AND horaFin > $3
    `, [idAulaNueva, diaSemana, horaInicio, horaFin]);

    if (conflicto.rows.length > 0) {
      throw new Error('El aula ya está ocupada en ese horario.');
    }

    // Buscar si ya estaba asignada
    const previa = await pool.query(`
      SELECT * FROM asignatura_aula
      WHERE idAsignatura = $1 AND diaSemana = $2
    `, [idAsignatura, diaSemana]);

    if (previa.rows.length > 0) {
      const anterior = previa.rows[0];

      await pool.query(`
        INSERT INTO historial_asignatura_aula (
          idAsignatura, idAulaAnterior, idAulaNueva,
          diaSemanaAnterior, horaInicioAnterior, horaFinAnterior,
          diaSemanaNuevo, horaInicioNuevo, horaFinNuevo,
          idUsuarioCambio, motivo
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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

    await pool.query(`
      INSERT INTO asignatura_aula (idAsignatura, idAula, idProfesor, diaSemana, horaInicio, horaFin)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [idAsignatura, idAulaNueva, idProfesor, diaSemana, horaInicio, horaFin]);

    const resultado = await this.getAsignaturasPorAula(idAulaNueva);
    return resultado;
  }

  async quitarAsignacion(idAula, datos) {
    const { idAsignatura, diaSemana, horaInicio, horaFin } = datos;

    await pool.query(`
      DELETE FROM asignatura_aula
      WHERE idAula = $1 AND idAsignatura = $2 AND diaSemana = $3 AND horaInicio = $4 AND horaFin = $5
    `, [idAula, idAsignatura, diaSemana, horaInicio, horaFin]);

    const result = await this.getAsignaturasPorAula(idAula);
    return result;
  }

  async getAsignaturasAsignadas() {
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
      ORDER BY a.nombreAsignatura ASC, aa.diaSemana, aa.horaInicio
    `);
    return result.rows;
  }

  async moverAsignatura({
    idaula,
    idAsignatura,
    idProfesor,
    nuevoDia,
    nuevaHoraInicio,
    nuevaHoraFin,
    aulaAnterior,
    diaAnterior,
    horaInicioAnterior,
    horaFinAnterior,
    idUsuarioCambio
  }) {
    const asignacionActual = await pool.query(
      `SELECT * FROM asignatura_aula
       WHERE idAsignatura = $1 AND idAula = $2 AND diaSemana = $3 
       AND horaInicio = $4 AND horaFin = $5`,
      [idAsignatura, aulaAnterior, diaAnterior, horaInicioAnterior, horaFinAnterior]
    );

    if (asignacionActual.rows.length === 0) {
      throw new Error('Asignación anterior no encontrada.');
    }

    const conflicto = await pool.query(
      `SELECT 1 FROM asignatura_aula
       WHERE idAula = $1 AND diaSemana = $2 AND horaInicio < $3 AND horaFin > $4`,
      [idaula, nuevoDia, nuevaHoraFin, nuevaHoraInicio]
    );

    if (conflicto.rows.length > 0) {
      throw new Error('El aula ya está ocupada en ese horario.');
    }

    await pool.query(
      `DELETE FROM asignatura_aula
       WHERE idAsignatura = $1 AND idAula = $2 AND diaSemana = $3 AND horaInicio = $4 AND horaFin = $5`,
      [idAsignatura, aulaAnterior, diaAnterior, horaInicioAnterior, horaFinAnterior]
    );

    await pool.query(
      `INSERT INTO asignatura_aula (idAsignatura, idAula, idProfesor, diaSemana, horaInicio, horaFin)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [idAsignatura, idaula, idProfesor, nuevoDia, nuevaHoraInicio, nuevaHoraFin]
    );

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

    /*const result = await pool.query(
      `SELECT a.idAsignatura, a.nombreAsignatura, aa.diaSemana, aa.horaInicio, aa.horaFin
       FROM asignatura_aula aa
       JOIN asignaturas a ON aa.idAsignatura = a.idAsignatura
       WHERE aa.idAula = $1`,
      [idaula]
    );*/
    const result = await pool.query(
      `SELECT 
        a.nombreAsignatura, 
        p.nombreProfesor, 
        au.nombreAula,
        aa.diaSemana, 
        aa.horaInicio, 
        aa.horaFin
      FROM asignatura_aula aa
      JOIN asignaturas a ON aa.idAsignatura = a.idAsignatura
      JOIN profesores p ON aa.idProfesor = p.idProfesor
      JOIN aulas au ON aa.idAula = au.idAula
      WHERE aa.idAsignatura = $1 AND aa.idAula = $2
        AND aa.diaSemana = $3 AND aa.horaInicio = $4 AND aa.horaFin = $5
      LIMIT 1
      `,
      [idAsignatura, idaula, nuevoDia, nuevaHoraInicio, nuevaHoraFin]
    );

    //return result.rows;
    if (result.rows.length === 0) {
      return {
        nombreAsignatura: 'Asignatura',
        nombreDocente: 'Nombre del docente',
        nombreAula: 'Aula'
      };
    }

    const {
      nombreasignatura,
      nombreprofesor,
      nombreaula
    } = result.rows[0];

    return {
      nombreAsignatura: nombreasignatura,
      nombreDocente: nombreprofesor,
      nombreAula: nombreaula
    };
  }

  async importarAulas(aulas) {
    let insertados = 0, ignorados = 0;

    for (const a of aulas) {
      const { codeAula, nombreAula, capAula, edificioAula, pisoAula, codeSede } = a;

      if (!codeAula || !nombreAula || !codeSede) {
        ignorados++;
        continue;
      }

      const sede = await pool.query('SELECT idSede FROM sedes WHERE codeSede = $1', [codeSede]);
      if (sede.rows.length === 0) {
        ignorados++;
        continue;
      }

      const idSedeActual = sede.rows[0].idsede;

      const result = await pool.query(
        `INSERT INTO aulas (codeAula, nombreAula, capAula, edificioAula, pisoAula, idSedeActual)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (codeAula) DO NOTHING`,
        [codeAula, nombreAula, capAula || null, edificioAula || null, pisoAula || null, idSedeActual]
      );

      if (result.rowCount > 0) insertados++;
      else ignorados++;
    }

    return { insertados, ignorados };
  }

  async importarAsignaciones(asignaciones) {
    let insertados = 0, ignorados = 0, conflictos = [];

    for (const item of asignaciones) {
      const { codeAula, codeAsignatura, codeProfesor, diaSemana, horaInicio, horaFin } = item;

      if (!codeAula || !codeAsignatura || !codeProfesor || !diaSemana || !horaInicio || !horaFin) {
        ignorados++;
        conflictos.push({ ...item, razon: 'Datos incompletos' });
        continue;
      }

      const aulaRes = await pool.query('SELECT idAula FROM aulas WHERE codeAula = $1', [codeAula]);
      const asigRes = await pool.query('SELECT idAsignatura FROM asignaturas WHERE codeAsignatura = $1', [codeAsignatura]);
      const profRes = await pool.query('SELECT idProfesor FROM profesores WHERE codeProfesor = $1', [codeProfesor]);

      if (aulaRes.rows.length === 0 || asigRes.rows.length === 0 || profRes.rows.length === 0) {
        ignorados++;
        conflictos.push({ ...item, razon: 'Código inválido' });
        continue;
      }

      const idAula = aulaRes.rows[0].idaula;
      const idAsignatura = asigRes.rows[0].idasignatura;
      const idProfesor = profRes.rows[0].idprofesor;

      const traslape = await pool.query(`
        SELECT 1 FROM asignatura_aula
        WHERE idAula = $1 AND diaSemana = $2 AND horaInicio < $4 AND horaFin > $3
      `, [idAula, diaSemana, horaInicio, horaFin]);

      if (traslape.rows.length > 0) {
        ignorados++;
        conflictos.push({ ...item, razon: 'Traslape de horario' });
        continue;
      }

      const result = await pool.query(`
        INSERT INTO asignatura_aula (idAsignatura, idAula, idProfesor, diaSemana, horaInicio, horaFin)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (idAsignatura, idAula, diaSemana, horaInicio, horaFin) DO NOTHING
      `, [idAsignatura, idAula, idProfesor, diaSemana, horaInicio, horaFin]);

      if (result.rowCount > 0) insertados++;
      else {
        ignorados++;
        conflictos.push({ ...item, razon: 'Registro duplicado' });
      }
    }

    return { insertados, ignorados, conflictos };
  }

  async exportarAulas() {
    const aulas = await pool.query(`
      SELECT a.codeAula, a.nombreAula, a.capAula, a.edificioAula, a.pisoAula, s.codeSede, s.nombreSede
      FROM aulas a JOIN sedes s ON a.idSedeActual = s.idSede
      ORDER BY s.nombreSede, a.nombreAula;
    `);

    const asignaciones = await pool.query(`
      SELECT au.codeAula, asg.codeAsignatura, asg.nombreAsignatura, p.codeProfesor,
             p.nombreProfesor, aa.diaSemana, aa.horaInicio, aa.horaFin
      FROM asignatura_aula aa
      JOIN aulas au ON aa.idAula = au.idAula
      JOIN asignaturas asg ON aa.idAsignatura = asg.idAsignatura
      JOIN profesores p ON aa.idProfesor = p.idProfesor
      ORDER BY au.codeAula, aa.diaSemana, aa.horaInicio;
    `);

    return {
      aulas: aulas.rows,
      asignaciones: asignaciones.rows
    };
  }
}

  module.exports = new AulasRepository();