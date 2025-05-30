class Sede {
  constructor({ codeSede, nombreSede, direccionSede, latitudSede, longitudSede }) {
    if (!codeSede || !nombreSede || !direccionSede || latitudSede === undefined || longitudSede === undefined) {
      throw new Error('Todos los campos son obligatorios');
    }

    this.codeSede = codeSede;
    this.nombreSede = nombreSede;
    this.direccionSede = direccionSede;
    this.latitudSede = latitudSede;
    this.longitudSede = longitudSede;
  }

  toJSON() {
    return {
      codeSede: this.codeSede,
      nombreSede: this.nombreSede,
      direccionSede: this.direccionSede,
      latitudSede: this.latitudSede,
      longitudSede: this.longitudSede
    };
  }
}

module.exports = Sede;