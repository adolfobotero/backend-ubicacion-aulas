const AulasService = require('../services/AulasService');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');
const UsuariosRepository = require('../repositories/UsuariosRepository');
const EmailService = require('../services/EmailService');
const NotificadorObserver = require('../observers/NotificadorObserver');


// Listar aulas
exports.getAulas = async (req, res) => {
  try {
    const { pagina = 1, limite = 5, busqueda = '' } = req.query;
    const resultado = await AulasService.listarAulas(pagina, limite, busqueda);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener aulas' });
  }
};

// Crear aula
exports.createAula = async (req, res) => {
  try {
    const nueva = await AulasService.crearAula(req.body);
    res.status(201).json(nueva);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Actualizar aula
exports.updateAula = async (req, res) => {
  try {
    const actualizada = await AulasService.actualizarAula(req.params.id, req.body);
    res.json(actualizada);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Eliminar aula
exports.deleteAula = async (req, res) => {
  try {
    await AulasService.eliminarAula(req.params.id);
    res.json({ message: 'Aula eliminada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar aula' });
  }
};

// Obtener asignaturas por aula
exports.getAsignaturasPorAula = async (req, res) => {
  try {
    const resultado = await AulasService.obtenerAsignaturasPorAula(req.params.id);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener asignaturas por aula' });
  }
};

// Asignar nueva asignación
exports.asignarAsignatura = async (req, res) => {
  try {
    const resultado = await AulasService.asignarAsignatura(req.params.id, req.body, req.user);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Quitar asignación
exports.quitarAsignacion = async (req, res) => {
  try {
    const resultado = await AulasService.quitarAsignacion(req.params.id, req.body);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ message: 'Error al quitar la asignación' });
  }
};

// Asignaturas actualmente asignadas (para mover)
exports.getAsignaturasAsignadas = async (req, res) => {
  try {
    const resultado = await AulasService.obtenerAsignaturasAsignadas();
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener asignaciones' });
  }
};

// Mover asignatura entre aulas
exports.moverAsignatura = async (req, res) => {
  const { idaula } = req.params;
  const {
    idAsignatura,
    idProfesor,
    nuevoDia,
    nuevaHoraInicio,
    nuevaHoraFin,
    aulaAnterior,
    diaAnterior,
    horaInicioAnterior,
    horaFinAnterior
  } = req.body;

  if (!idaula || !idAsignatura || !idProfesor || !nuevoDia || !nuevaHoraInicio || !nuevaHoraFin) {
    return res.status(400).json({ message: 'Faltan datos obligatorios para mover la asignatura.' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const idUsuarioCambio = decoded.idusuario;

    const resultado = await AulasService.moverAsignatura({
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
    });

    // Obtener datos necesarios para el mensaje (puedes mejorarlo con JOIN si lo deseas)
    const nombreAsignatura = resultado.nombreAsignatura || 'Asignatura';
    const nombreDocente = resultado.nombreDocente || 'Nombre del docente';
    const nombreAula = resultado.nombreAula || 'Aula';
    const horario = `${nuevoDia} de ${nuevaHoraInicio} a ${nuevaHoraFin}`;

    // Notificar estudiantes observadores
    const usuariosRepo = UsuariosRepository;
    const emailService = new EmailService();
    const observer = new NotificadorObserver(usuariosRepo, emailService);
    
    await observer.notificar(nombreAsignatura, nombreDocente, nombreAula, horario);

    res.json(resultado);
  } catch (err) {
    console.error('Error al mover asignatura:', err.message);
    res.status(500).json({ message: err.message || 'Error al mover asignatura' });

  }
};

// Importar aulas desde Excel
exports.importarAulas = async (req, res) => {
  try {
    const resultado = await AulasService.importarAulas(req.body.aulas);
    res.json({ message: 'Importación completada', ...resultado });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Importar asignaciones desde Excel
exports.importarAsignaciones = async (req, res) => {
  try {
    const resultado = await AulasService.importarAsignaciones(req.body.asignaciones);
    res.json({ message: 'Importación completada', ...resultado });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Exportar aulas y asignaciones a Excel
exports.exportarAulas = async (req, res) => {
  try {
    const { aulas, asignaciones } = await AulasService.exportarAulas();

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(aulas);
    const ws2 = XLSX.utils.json_to_sheet(asignaciones);

    XLSX.utils.book_append_sheet(wb, ws1, 'Aulas');
    XLSX.utils.book_append_sheet(wb, ws2, 'Asignaciones');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=aulas.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: 'Error al exportar aulas' });
  }
};
