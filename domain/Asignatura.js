class Asignatura {
  constructor({ codeAsignatura, nombreAsignatura }) {
    if (!codeAsignatura || !nombreAsignatura) {
      throw new Error('Todos los campos son obligatorios');
    }

    this.codeAsignatura = codeAsignatura;
    this.nombreAsignatura = nombreAsignatura;
  }

  toJSON() {
    return {
      codeAsignatura: this.codeAsignatura,
      nombreAsignatura: this.nombreAsignatura
    };
  }
}

module.exports = Asignatura;
