const pool = require('../config/Db');

class AsignaturasRepository {
  async getAsignaturas(pagina = 1, limite = 5, busqueda = '') {
    const offset = (pagina - 1) * limite;

    const result = await pool.query(`
      SELECT a.idAsignatura, a.codeAsignatura, a.nombreAsignatura,
        COALESCE(string_agg(DISTINCT p.nombreProfesor, ', '), '') AS profesores
      FROM asignaturas a
      LEFT JOIN profesor_asignatura pa ON a.idAsignatura = pa.idAsignatura
      LEFT JOIN profesores p ON pa.idProfesor = p.idProfesor
      WHERE LOWER(a.codeAsignatura) LIKE LOWER($1) OR LOWER(a.nombreAsignatura) LIKE LOWER($1)
      GROUP BY a.idAsignatura
      ORDER BY a.codeAsignatura
      LIMIT $2 OFFSET $3
    `, [`%${busqueda}%`, limite, offset]);

    const totalRes = await pool.query(`
      SELECT COUNT(*) FROM asignaturas
      WHERE LOWER(codeAsignatura) LIKE LOWER($1) OR LOWER(nombreAsignatura) LIKE LOWER($1)
    `, [`%${busqueda}%`]);

    return {
      registros: result.rows,
      total: parseInt(totalRes.rows[0].count, 10)
    };
  }

  async createAsignatura({ codeAsignatura, nombreAsignatura }) {
    const result = await pool.query(
      `INSERT INTO asignaturas (codeAsignatura, nombreAsignatura)
       VALUES ($1, $2) RETURNING *`,
      [codeAsignatura, nombreAsignatura]
    );
    return result.rows[0];
  }

  async updateAsignatura(id, { codeAsignatura, nombreAsignatura }) {
    const result = await pool.query(
      `UPDATE asignaturas SET codeAsignatura = $1, nombreAsignatura = $2
       WHERE idAsignatura = $3 RETURNING *`,
      [codeAsignatura, nombreAsignatura, id]
    );
    return result.rows[0];
  }

  async deleteAsignatura(id) {
    await pool.query('DELETE FROM profesor_asignatura WHERE idAsignatura = $1', [id]);
    await pool.query('DELETE FROM asignaturas WHERE idAsignatura = $1', [id]);
    return true;
  }

  async getDetalleAsignatura(id) {
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
    return result.rows;
  }

  async getProfesoresPorAsignatura(idAsignatura) {
    const result = await pool.query(`
      SELECT p.idProfesor, p.nombreProfesor, p.mailProfesor
      FROM profesor_asignatura pa
      JOIN profesores p ON pa.idProfesor = p.idProfesor
      WHERE pa.idAsignatura = $1
    `, [idAsignatura]);
    return result.rows;
  }

  async asignarProfesor(idAsignatura, idProfesor) {
    // Verificar si ya existe
    const existe = await pool.query(`
      SELECT 1 FROM profesor_asignatura
      WHERE idProfesor = $1 AND idAsignatura = $2
    `, [idProfesor, idAsignatura]);

    if (existe.rows.length > 0) return false;

    await pool.query(`
      INSERT INTO profesor_asignatura (idProfesor, idAsignatura)
      VALUES ($1, $2)
    `, [idProfesor, idAsignatura]);

    return true;
  }

  async quitarProfesor(idAsignatura, idProfesor) {
    await pool.query(`
      DELETE FROM profesor_asignatura
      WHERE idAsignatura = $1 AND idProfesor = $2
    `, [idAsignatura, idProfesor]);
  }

  async getHistorialAsignatura(idAsignatura, pagina, limite) {
    const offset = (pagina - 1) * limite;

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

    const totalRes = await pool.query(`
      SELECT COUNT(*) FROM historial_asignatura_aula
      WHERE idAsignatura = $1
    `, [idAsignatura]);

    return {
      registros: result.rows,
      total: parseInt(totalRes.rows[0].count, 10)
    };
  }

  async importarAsignaturas(asignaturas) {
    let insertados = 0;
    let ignorados = 0;

    for (const a of asignaturas) {
      const { codeAsignatura, nombreAsignatura, codigosProfesores } = a;

      if (!codeAsignatura || !nombreAsignatura) {
        ignorados++;
        continue;
      }

      const existe = await pool.query('SELECT idAsignatura FROM asignaturas WHERE codeAsignatura = $1', [codeAsignatura]);
      let idAsignatura;

      if (existe.rows.length > 0) {
        idAsignatura = existe.rows[0].idasignatura;
      } else {
        const insert = await pool.query(`
          INSERT INTO asignaturas (codeAsignatura, nombreAsignatura)
          VALUES ($1, $2) RETURNING idAsignatura
        `, [codeAsignatura, nombreAsignatura]);
        idAsignatura = insert.rows[0].idasignatura;
        insertados++;
      }

      if (codigosProfesores) {
        const codigos = codigosProfesores.split(';').map(c => c.trim());
        for (const code of codigos) {
          const prof = await pool.query('SELECT idProfesor FROM profesores WHERE codeProfesor = $1', [code]);
          if (prof.rows.length > 0) {
            const idProfesor = prof.rows[0].idprofesor;
            await pool.query(`
              INSERT INTO profesor_asignatura (idProfesor, idAsignatura)
              VALUES ($1, $2) ON CONFLICT DO NOTHING
            `, [idProfesor, idAsignatura]);
          }
        }
      }
    }

    return { insertados, ignorados };
  }
  
  async exportarAsignaturas() {
    const result = await pool.query(`
      SELECT a.codeAsignatura, a.nombreAsignatura,
        STRING_AGG(p.codeProfesor, ';') AS codigosProfesores
      FROM asignaturas a
      LEFT JOIN profesor_asignatura pa ON a.idAsignatura = pa.idAsignatura
      LEFT JOIN profesores p ON pa.idProfesor = p.idProfesor
      GROUP BY a.idAsignatura
      ORDER BY a.nombreAsignatura
    `);
    return result.rows;
  }
}

module.exports = new AsignaturasRepository();
