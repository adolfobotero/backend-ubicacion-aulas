const pool = require('../config/Db');

class ProfesoresRepository {
  async getProfesores(pagina = 1, limite = 5, busqueda = '') {
    const offset = (pagina - 1) * limite;

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

    return {
      registros: result.rows,
      total: parseInt(totalRes.rows[0].count, 10)
    };
  }

  async createProfesor({ codeProfesor, nombreProfesor, mailProfesor }) {
    const result = await pool.query(`
      INSERT INTO profesores (codeProfesor, nombreProfesor, mailProfesor)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [codeProfesor, nombreProfesor, mailProfesor]
    );
    return result.rows[0];
  }

  async updateProfesor(id, { codeProfesor, nombreProfesor, mailProfesor }) {
    const result = await pool.query(`
      UPDATE profesores SET
        codeProfesor = $1,
        nombreProfesor = $2,
        mailProfesor = $3
      WHERE idProfesor = $4
      RETURNING *`,
      [codeProfesor, nombreProfesor, mailProfesor, id]
    );
    return result.rows[0];
  }

  async deleteProfesor(id) {
    await pool.query('DELETE FROM profesores WHERE idProfesor = $1', [id]);
    return true;
  }

  async importarProfesores(profesores) {
    let insertados = 0;
    let ignorados = 0;

    for (const p of profesores) {
      const { codeProfesor, nombreProfesor, mailProfesor } = p;

      if (!codeProfesor || !nombreProfesor || !mailProfesor || !mailProfesor.endsWith('@ucaldas.edu.co')) {
        ignorados++;
        continue;
      }

      const result = await pool.query(`
        INSERT INTO profesores (codeProfesor, nombreProfesor, mailProfesor)
        VALUES ($1, $2, $3)
        ON CONFLICT (codeProfesor) DO NOTHING
      `, [codeProfesor, nombreProfesor, mailProfesor]);

      if (result.rowCount > 0) {
        insertados++;
      } else {
        ignorados++;
      }
    }

    return { insertados, ignorados };
  }

  async exportarProfesores() {
    const result = await pool.query(`
      SELECT codeProfesor, nombreProfesor, mailProfesor
      FROM profesores
      ORDER BY nombreProfesor
    `);
    return result.rows;
  }
}

module.exports = new ProfesoresRepository();