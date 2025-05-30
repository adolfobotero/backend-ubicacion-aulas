const ProfesoresService = require('../services/ProfesoresService');
const XLSX = require('xlsx');

// GET - listar todos los profesores
exports.getProfesores = async (req, res) => {
  const { pagina = 1, limite = 5, busqueda = '' } = req.query;

  try {
    const resultado = await ProfesoresService.listarProfesores(pagina, limite, busqueda);
    res.json(resultado);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener los profesores' });
  }
};

// POST - agregar nuevo profesor
exports.createProfesor = async (req, res) => {
  try {
    const nuevo = await ProfesoresService.crearProfesor(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT - actualizar un profesor
exports.updateProfesor = async (req, res) => {
  try {
    const actualizado = await ProfesoresService.actualizarProfesor(req.params.id, req.body);
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE - eliminar un profesor
exports.deleteProfesor = async (req, res) => {
  try {
    await ProfesoresService.eliminarProfesor(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el profesor' });
  }
};

// Importar profesores desde Excel
exports.importarProfesores = async (req, res) => {
  try {
    const { profesores } = req.body;
    const resultado = await ProfesoresService.importarProfesores(profesores);
    res.status(200).json({
      message: 'Importación completada',
      ...resultado
    });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ message: err.message });
  }
};

// Exportar profesores a Excel
exports.exportarProfesores = async (req, res) => {
  try {
    const data = await ProfesoresService.exportarProfesores();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profesores');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=profesores.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Error al exportar profesores:', err);
    res.status(500).json({ error: 'Error al exportar profesores' });
  }
};
