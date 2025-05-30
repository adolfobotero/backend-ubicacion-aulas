const UsuariosService = require('../services/UsuariosService');
const UsuariosRepository = require('../repositories/UsuariosRepository');

// Listar usuarios con paginación y búsqueda
exports.getUsuarios = async (req, res) => {
  try {
    const { pagina = 1, limite = 5, busqueda = '' } = req.query;
    const resultado = await UsuariosService.listarUsuarios(pagina, limite, busqueda);
    res.json(resultado);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

// Crear usuario
exports.addUsuario = async (req, res) => {
  try {
    const nuevo = await UsuariosService.crearUsuario(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ error: err.message });
  }
};

// Actualizar usuario
exports.updateUsuario = async (req, res) => {
  try {
    const actualizado = await UsuariosService.actualizarUsuario(req.params.id, req.body);
    res.json(actualizado);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

// Eliminar usuario
exports.deleteUsuario = async (req, res) => {
  try {
    await UsuariosService.eliminarUsuario(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};

// Actualizar consentimiento de notificaciones del usuario - Patrón Observer
exports.actualizarConsentimiento = async (req, res) => {
  const { recibirnotificaciones } = req.body;
  const idUsuario = req.usuario?.idusuario;

  if (typeof recibirnotificaciones !== 'boolean') {
    return res.status(400).json({ message: 'Debe enviar un valor booleano (true o false)' });
  }

  try {
    await UsuariosRepository.actualizarConsentimiento(idUsuario, recibirnotificaciones);
    return res.status(200).json({ message: 'Preferencia actualizada correctamente.' });
  } catch (error) {
    console.error('Error completo al actualizar consentimiento:', error);
    res.status(500).json({
      error: 'Error al actualizar el usuario',
      detalle: error.message,
      stack: error.stack
    });
  }
};


