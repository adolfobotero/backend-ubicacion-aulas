class Profesor {
  constructor({ codeProfesor, nombreProfesor, mailProfesor }) {
    if (!codeProfesor || !nombreProfesor || !mailProfesor) {
      throw new Error('Todos los campos son obligatorios');
    }

    if (!mailProfesor.endsWith('@ucaldas.edu.co')) {
      throw new Error('El correo debe ser institucional (@ucaldas.edu.co)');
    }

    this.codeProfesor = codeProfesor;
    this.nombreProfesor = nombreProfesor;
    this.mailProfesor = mailProfesor;
  }

  toJSON() {
    return {
      codeProfesor: this.codeProfesor,
      nombreProfesor: this.nombreProfesor,
      mailProfesor: this.mailProfesor
    };
  }
}

module.exports = Profesor;
