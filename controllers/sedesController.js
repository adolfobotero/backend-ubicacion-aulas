const SedesService = require('../services/SedesService');
const XLSX = require('xlsx');

// Listar todas las sedes
exports.getSedes = async (req, res) => {
  try {
    const sedes = await SedesService.listarSedes();
    res.json(sedes);
  } catch (error) {
    console.error('Error al listar sedes:', error.message);
    res.status(500).json({ message: 'Error al obtener las sedes' });
  }
};

// Agregar nueva sede
exports.addSede = async (req, res) => {
  try {
    const nueva = await SedesService.crearSede(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    console.error('Error al agregar sede:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// Editar sede
exports.updateSede = async (req, res) => {
  try {
    const actualizada = await SedesService.actualizarSede(req.params.id, req.body);
    res.json(actualizada);
  } catch (error) {
    console.error('Error al actualizar sede:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// Eliminar sede
exports.deleteSede = async (req, res) => {
  try {
    await SedesService.eliminarSede(req.params.id);
    res.json({ message: 'Sede eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar sede:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// Importar sedes desde Excel
exports.importarSedes = async (req, res) => {
  try {
    const { sedes } = req.body;
    const resultado = await SedesService.importarSedes(sedes);
    res.status(200).json({
      message: 'Importación completada',
      ...resultado
    });
  } catch (err) {
    console.error('Error al importar sedes:', err.message);
    res.status(400).json({ message: err.message });
  }
};

// Exportar sedes a Excel
exports.exportarSedes = async (req, res) => {
  try {
    const data = await SedesService.exportarSedes();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sedes');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=sedes.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Error al exportar sedes:', err.message);
    res.status(500).json({ error: 'Error al exportar sedes' });
  }
};
