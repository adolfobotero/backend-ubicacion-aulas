class Aula {
  constructor({ codeAula, nombreAula, capAula, edificioAula, pisoAula, idSedeActual }) {
    if (!codeAula || !nombreAula || !capAula || !edificioAula || !pisoAula || !idSedeActual) {
      throw new Error('Todos los campos son obligatorios');
    }

    this.codeAula = codeAula;
    this.nombreAula = nombreAula;
    this.capAula = capAula;
    this.edificioAula = edificioAula;
    this.pisoAula = pisoAula;
    this.idSedeActual = idSedeActual;
  }

  toJSON() {
    return {
      codeAula: this.codeAula,
      nombreAula: this.nombreAula,
      capAula: this.capAula,
      edificioAula: this.edificioAula,
      pisoAula: this.pisoAula,
      idSedeActual: this.idSedeActual
    };
  }
}

module.exports = Aula;
