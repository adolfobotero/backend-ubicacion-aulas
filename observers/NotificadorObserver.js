class NotificadorObserver {
  constructor(usuariosRepository, emailService) {
    this.usuariosRepository = usuariosRepository;
    this.emailService = emailService;
  }

  async notificar(asignatura, docente, aulaNueva, horarioNuevo) {
    const usuarios = await this.usuariosRepository.obtenerUsuariosNotificados();

    for (const usuario of usuarios) {
      await this.emailService.send(
        usuario.mailusuario,
        `Cambio de aula - ${asignatura}`,
        `Tu asignatura ${asignatura}, dictada por ${docente}, ha sido movida al aula ${aulaNueva}, en el horario: ${horarioNuevo}.`
      );
    }
  }
}

module.exports = NotificadorObserver;
