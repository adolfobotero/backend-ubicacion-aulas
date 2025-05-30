const pool = require('../config/Db');

class SedesRepository {
  async getSedes() {
    const result = await pool.query('SELECT * FROM sedes ORDER BY codeSede');
    return result.rows;
  }

  async addSede({ codeSede, nombreSede, direccionSede, latitudSede, longitudSede }) {
    const result = await pool.query(
      'INSERT INTO sedes (codeSede, nombreSede, direccionSede, latitudSede, longitudSede) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [codeSede, nombreSede, direccionSede, latitudSede, longitudSede]
    );
    return result.rows[0];
  }

  async updateSede(id, { codeSede, nombreSede, direccionSede, latitudSede, longitudSede }) {
    const result = await pool.query(
      'UPDATE sedes SET codeSede=$1, nombreSede=$2, direccionSede=$3, latitudSede=$4, longitudSede=$5 WHERE idSede=$6 RETURNING *',
      [codeSede, nombreSede, direccionSede, latitudSede, longitudSede, id]
    );
    return result.rows[0];
  }

  async deleteSede(id) {
    const result = await pool.query('DELETE FROM sedes WHERE idSede = $1 RETURNING *', [id]);
    return result.rowCount > 0;
  }

  async importarSedes(sedes) {
    let insertados = 0;
    let ignorados = 0;

    for (const s of sedes) {
      const { codeSede, nombreSede, direccionSede, latitudSede, longitudSede } = s;

      if (!codeSede || !nombreSede) {
        ignorados++;
        continue;
      }

      const result = await pool.query(
        `INSERT INTO sedes (codeSede, nombreSede, direccionSede, latitudSede, longitudSede)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (codeSede) DO NOTHING`,
        [codeSede, nombreSede, direccionSede || null, latitudSede || null, longitudSede || null]
      );

      if (result.rowCount > 0) insertados++;
      else ignorados++;
    }

    return { insertados, ignorados };
  }

  async exportarSedes() {
    const result = await pool.query(`
      SELECT 
        codeSede,
        nombreSede,
        direccionSede,
        latitudSede,
        longitudSede
      FROM sedes
      ORDER BY nombreSede
    `);
    return result.rows;
  }
}

module.exports = new SedesRepository();