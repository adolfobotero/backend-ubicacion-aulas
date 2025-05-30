const bcrypt = require('bcryptjs');
const UsuariosRepository = require('../repositories/UsuariosRepository');
const Usuario = require('../domain/Usuario');

class UsuariosService {
  async listarUsuarios(pagina, limite, busqueda) {
    return await UsuariosRepository.getUsuarios(pagina, limite, busqueda);
  }

  async crearUsuario(data) {
    const usuario = new Usuario(data);

    const hash = await bcrypt.hash(data.passUsuario, 10);

    return await UsuariosRepository.createUsuario({
      ...usuario.toJSON(),
      passUsuario: hash
    });
  }

  async actualizarUsuario(id, data) {
    const usuario = new Usuario(data);
    const hashed = data.passUsuario
      ? await bcrypt.hash(data.passUsuario, 10)
      : null;

    return await UsuariosRepository.updateUsuario(id, {
      ...usuario.toJSON(),
      passUsuario: hashed
    });
  }

  async eliminarUsuario(id) {
    return await UsuariosRepository.deleteUsuario(id);
  }
}

module.exports = new UsuariosService();

/*
const bcrypt = require('bcryptjs');
const UsuariosRepository = require('../repositories/usuariosRepository');

class UsuariosService {
  async listarUsuarios(pagina, limite, busqueda) {
    return await UsuariosRepository.getUsuarios(pagina, limite, busqueda);
  }

  async crearUsuario(data) {
    const { codeUsuario, nombreCompleto, mailUsuario, passUsuario, rolUsuario, metodoLogin } = data;

    if (!nombreCompleto || !mailUsuario || !passUsuario || !rolUsuario || !metodoLogin) {
      throw new Error('Todos los campos son obligatorios');
    }

    const hash = await bcrypt.hash(passUsuario, 10);
    return await UsuariosRepository.createUsuario({
      codeUsuario,
      nombreCompleto,
      mailUsuario,
      passUsuario: hash,
      rolUsuario,
      metodoLogin
    });
  }

  async actualizarUsuario(id, data) {
    const { nombreCompleto, mailUsuario, passUsuario, rolUsuario } = data;

    const hash = passUsuario ? await bcrypt.hash(passUsuario, 10) : null;
    return await UsuariosRepository.updateUsuario(id, {
      nombreCompleto,
      mailUsuario,
      passUsuario: hash,
      rolUsuario
    });
  }

  async eliminarUsuario(id) {
    return await UsuariosRepository.deleteUsuario(id);
  }
}

module.exports = new UsuariosService();
*/