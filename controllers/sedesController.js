const pool = require('../config/db');
const XLSX = require('xlsx');

// Listar todas las sedes
exports.getSedes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sedes ORDER BY idSede');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar sedes:', error.message);
    res.status(500).json({ message: 'Error al obtener las sedes' });
  }
};

// Agregar nueva sede
exports.addSede = async (req, res) => {
  const { codeSede, nombreSede, direccionSede, latitudSede, longitudSede } = req.body;

  // Validación simple
  if (!codeSede || !nombreSede || !direccionSede || latitudSede === undefined || longitudSede === undefined) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO sedes (codeSede, nombreSede, direccionSede, latitudSede, longitudSede) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [codeSede, nombreSede, direccionSede, latitudSede, longitudSede]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al agregar sede:', error.message);
    res.status(500).json({ message: 'Error al agregar la sede' });
  }
};

// Editar sede
exports.updateSede = async (req, res) => {
  const { id } = req.params;
  const { codeSede, nombreSede, direccionSede, latitudSede, longitudSede } = req.body;

  if (!codeSede || !nombreSede || !direccionSede || latitudSede === undefined || longitudSede === undefined) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const result = await pool.query(
      'UPDATE sedes SET codeSede=$1, nombreSede=$2, direccionSede=$3, latitudSede=$4, longitudSede=$5 WHERE idSede=$6 RETURNING *',
      [codeSede, nombreSede, direccionSede, latitudSede, longitudSede, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sede no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar sede:', error.message);
    res.status(500).json({ message: 'Error al actualizar la sede' });
  }
};

// Eliminar sede
exports.deleteSede = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM sedes WHERE idSede = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sede no encontrada' });
    }
    res.json({ message: 'Sede eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar sede:', error.message);
    res.status(500).json({ message: 'Error al eliminar la sede' });
  }
};

//Importar sedes
exports.importarSedes = async (req, res) => {
  const { sedes } = req.body;

  let insertados = 0;
  let ignorados = 0;

  try {
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
    console.error('Error al importar sedes:', err);
    res.status(500).json({ message: 'Error al importar sedes' });
  }
};

// Exportar sedes
exports.exportarSedes = async (req, res) => {
  try {
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

    const data = result.rows;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sedes');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=sedes.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Error al exportar sedes:', err);
    res.status(500).json({ error: 'Error al exportar sedes' });
  }
};
