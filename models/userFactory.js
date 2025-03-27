class Usuario {
  constructor({ codeusuario, nombrecompleto, mailusuario, rolusuario, metodologin }) {
    this.codeusuario = codeusuario;
    this.nombrecompleto = nombrecompleto;
    this.mailusuario = mailusuario;
    this.rolusuario = rolusuario;
    this.metodologin = metodologin;
  }
}

class UsuarioFactory {
  static crearUsuario(tipo, datos) {
    switch (tipo) {
      case 'local':
        return new Usuario({
          ...datos,
          metodologin: 'local',
          rolusuario: 'admin'
        });
      case 'google':
        return new Usuario({
          ...datos,
          metodologin: 'google',
          rolusuario: 'estudiante'
        });
      default:
        throw new Error('Tipo de usuario no soportado');
    }
  }
}

module.exports = UsuarioFactory;
