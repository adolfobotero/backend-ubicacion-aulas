class Usuario {
  constructor({ codeusuario, codeUsuario, nombrecompleto, nombreCompleto, mailusuario, mailUsuario, rolusuario, rolUsuario, metodologin, metodoLogin, recibirnotificaciones, recibirNotificaciones }) {
    this.codeUsuario = codeUsuario || codeusuario;
    this.nombreCompleto = nombreCompleto || nombrecompleto;
    this.mailUsuario = mailUsuario || mailusuario;
    this.rolUsuario = rolUsuario || rolusuario;
    this.metodoLogin = metodoLogin || metodologin;
    this.recibirNotificaciones = recibirNotificaciones ?? recibirnotificaciones ?? false;

    if (!this.codeUsuario || !this.nombreCompleto || !this.mailUsuario || !this.rolUsuario || !this.metodoLogin) {
      throw new Error('Todos los campos son obligatorios');
    }

    if (!this.mailUsuario.endsWith('@ucaldas.edu.co')) {
      throw new Error('El correo debe ser institucional');
    }
  }

  toJSON() {
    return {
      codeUsuario: this.codeUsuario,
      nombreCompleto: this.nombreCompleto,
      mailUsuario: this.mailUsuario,
      rolUsuario: this.rolUsuario,
      metodoLogin: this.metodoLogin,
      recibirNotificaciones: this.recibirNotificaciones
    };
  }
}

module.exports = Usuario;
