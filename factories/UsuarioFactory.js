const Usuario = require('../domain/Usuario');

class UsuarioFactory {
  static crearUsuario(tipo, datos) {
    switch (tipo) {
      case 'local':
        return new Usuario({
          ...datos,
          rolusuario: 'admin',
          metodologin: 'local'
        });
      case 'google':
        return new Usuario({
          ...datos,
          rolusuario: 'estudiante',          
          metodologin: 'google'
        });
      default:
        throw new Error('Tipo de usuario no soportado');
    }
  }
}

module.exports = UsuarioFactory;