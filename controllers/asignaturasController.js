const AsignaturasService = require('../services/AsignaturasService');
const XLSX = require('xlsx');

// Listar asignaturas con profesores
exports.getAsignaturas = async (req, res) => {
  try {
    const { pagina = 1, limite = 5, busqueda = '' } = req.query;
    const resultado = await AsignaturasService.listarAsignaturas(pagina, limite, busqueda);
    res.json(resultado);
  } catch (err) {
    console.error('Error al obtener asignaturas:', err.message);
    res.status(500).json({ message: 'Error al obtener asignaturas' });
  }
};

// Crear nueva asignatura
exports.createAsignatura = async (req, res) => {
  try {
    const nueva = await AsignaturasService.crearAsignatura(req.body);
    res.status(201).json(nueva);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Actualizar asignatura
exports.updateAsignatura = async (req, res) => {
  try {
    const actualizada = await AsignaturasService.actualizarAsignatura(req.params.id, req.body);
    res.json(actualizada);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar asignatura' });
  }
};

// Eliminar asignatura
exports.deleteAsignatura = async (req, res) => {
  try {
    await AsignaturasService.eliminarAsignatura(req.params.id);
    res.json({ message: 'Asignatura eliminada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar asignatura' });
  }
};

// Detalle de asignatura con aula y horario
exports.getDetalleAsignatura = async (req, res) => {
  try {
    const data = await AsignaturasService.obtenerDetalle(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener detalle' });
  }
};

// Obtener profesores asignados
exports.getProfesoresPorAsignatura = async (req, res) => {
  try {
    const data = await AsignaturasService.obtenerProfesoresPorAsignatura(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener profesores por asignatura' });
  }
};

// Asignar profesor
exports.asignarProfesor = async (req, res) => {
  try {
    const data = await AsignaturasService.asignarProfesor(req.params.id, req.body.idProfesor);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Quitar profesor
exports.quitarProfesor = async (req, res) => {
  try {
    const { idAsignatura, idProfesor } = req.params;
    const data = await AsignaturasService.quitarProfesor(idAsignatura, idProfesor);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error al quitar profesor' });
  }
};

// Historial de movimientos
exports.getHistorialAsignatura = async (req, res) => {
  try {
    const { pagina = 1, limite = 10 } = req.query;
    const data = await AsignaturasService.obtenerHistorial(req.params.id, pagina, limite);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener historial' });
  }
};

// Importar asignaturas con profesores desde Excel
exports.importarAsignaturas = async (req, res) => {
  try {
    const { asignaturas } = req.body;
    const resultado = await AsignaturasService.importarAsignaturas(asignaturas);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Exportar asignaturas con profesores a Excel
exports.exportarAsignaturas = async (req, res) => {
  try {
    const datos = await AsignaturasService.exportarAsignaturas();
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asignaturas');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=asignaturas.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Error al exportar asignaturas:', err);
    res.status(500).json({ error: 'Error al exportar asignaturas' });
  }
};
