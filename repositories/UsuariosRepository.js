const pool = require('../config/Db');

class UsuariosRepository {
  async getUsuarios(pagina = 1, limite = 5, busqueda = '') {
    const offset = (pagina - 1) * limite;

    const result = await pool.query(`
      SELECT * FROM usuarios
      WHERE LOWER(nombreCompleto) LIKE LOWER($1) OR LOWER(mailUsuario) LIKE LOWER($1)
      ORDER BY idUsuario
      LIMIT $2 OFFSET $3
    `, [`%${busqueda}%`, limite, offset]);

    const totalRes = await pool.query(`
      SELECT COUNT(*) FROM usuarios
      WHERE LOWER(nombreCompleto) LIKE LOWER($1) OR LOWER(mailUsuario) LIKE LOWER($1)
    `, [`%${busqueda}%`]);

    return {
      registros: result.rows,
      total: parseInt(totalRes.rows[0].count, 10)
    };
  }

  async createUsuario({ codeUsuario, nombreCompleto, mailUsuario, passUsuario, rolUsuario, metodoLogin }) {
    const result = await pool.query(`
      INSERT INTO usuarios (codeUsuario, nombreCompleto, mailUsuario, passUsuario, rolUsuario, metodoLogin)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [codeUsuario, nombreCompleto, mailUsuario, passUsuario, rolUsuario, metodoLogin]);

    return result.rows[0];
  }

  async updateUsuario(id, { nombreCompleto, mailUsuario, passUsuario, rolUsuario }) {
    const query = passUsuario
      ? `
        UPDATE usuarios
        SET nombreCompleto = $1, mailUsuario = $2, passUsuario = $3, rolUsuario = $4
        WHERE idUsuario = $5 RETURNING *
      `
      : `
        UPDATE usuarios
        SET nombreCompleto = $1, mailUsuario = $2, rolUsuario = $3
        WHERE idUsuario = $4 RETURNING *
      `;

    const params = passUsuario
      ? [nombreCompleto, mailUsuario, passUsuario, rolUsuario, id]
      : [nombreCompleto, mailUsuario, rolUsuario, id];

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async deleteUsuario(id) {
    await pool.query('DELETE FROM usuarios WHERE idUsuario = $1', [id]);
    return true;
  }

  async actualizarConsentimiento(idUsuario, recibir) {
    const query = 'UPDATE usuarios SET recibirnotificaciones = $1 WHERE idusuario = $2';
    //console.log('Ejecutando UPDATE con:', { idUsuario, recibir });
    await pool.query(query, [recibir, idUsuario]);
  }

  async obtenerUsuariosNotificados() {
    const query = `
      SELECT mailusuario 
      FROM usuarios 
      WHERE rolusuario = 'estudiante' 
        AND recibirnotificaciones = TRUE
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = new UsuariosRepository();
