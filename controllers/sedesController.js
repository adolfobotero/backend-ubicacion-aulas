const pool = require('../config/db');

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
  const { nombreSede, direccionSede, latitudSede, longitudSede } = req.body;

  // Validación simple
  if (!nombreSede || !direccionSede || latitudSede === undefined || longitudSede === undefined) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO sedes (nombreSede, direccionSede, latitudSede, longitudSede) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombreSede, direccionSede, latitudSede, longitudSede]
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
  const { nombreSede, direccionSede, latitudSede, longitudSede } = req.body;

  if (!nombreSede || !direccionSede || latitudSede === undefined || longitudSede === undefined) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const result = await pool.query(
      'UPDATE sedes SET nombreSede=$1, direccionSede=$2, latitudSede=$3, longitudSede=$4 WHERE idSede=$5 RETURNING *',
      [nombreSede, direccionSede, latitudSede, longitudSede, id]
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
