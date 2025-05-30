const SedesRepository = require('../repositories/SedesRepository');
const Sede = require('../domain/Sede');

class SedesService {
  async listarSedes() {
    return await SedesRepository.getSedes();
  }

  async crearSede(data) {
    const sede = new Sede(data);
    return await SedesRepository.addSede(sede.toJSON());
  }

  async actualizarSede(id, data) {
    const sede = new Sede(data);
    const actualizada = await SedesRepository.updateSede(id, sede.toJSON());
    if (!actualizada) {
      throw new Error('Sede no encontrada');
    }
    return actualizada;
  }

  async eliminarSede(id) {
    const eliminada = await SedesRepository.deleteSede(id);
    if (!eliminada) {
      throw new Error('Sede no encontrada');
    }
    return true;
  }

  async importarSedes(sedes) {
    if (!Array.isArray(sedes) || sedes.length === 0) {
      throw new Error('No se recibieron sedes válidas');
    }
    return await SedesRepository.importarSedes(sedes);
  }

  async exportarSedes() {
    return await SedesRepository.exportarSedes();
  }
}

module.exports = new SedesService();

/*
const SedesRepository = require('../repositories/sedesRepository');

class SedesService {
  async listarSedes() {
    return await SedesRepository.getSedes();
  }

  async crearSede(data) {
    const { codeSede, nombreSede, direccionSede, latitudSede, longitudSede } = data;

    if (!codeSede || !nombreSede || !direccionSede || latitudSede === undefined || longitudSede === undefined) {
      throw new Error('Todos los campos son obligatorios');
    }

    return await SedesRepository.addSede(data);
  }

  async actualizarSede(id, data) {
    const { codeSede, nombreSede, direccionSede, latitudSede, longitudSede } = data;

    if (!codeSede || !nombreSede || !direccionSede || latitudSede === undefined || longitudSede === undefined) {
      throw new Error('Todos los campos son obligatorios');
    }

    const actualizada = await SedesRepository.updateSede(id, data);
    if (!actualizada) {
      throw new Error('Sede no encontrada');
    }

    return actualizada;
  }

  async eliminarSede(id) {
    const eliminada = await SedesRepository.deleteSede(id);
    if (!eliminada) {
      throw new Error('Sede no encontrada');
    }
    return true;
  }

  async importarSedes(sedes) {
    if (!Array.isArray(sedes) || sedes.length === 0) {
      throw new Error('No se recibieron sedes válidas');
    }

    return await SedesRepository.importarSedes(sedes);
  }

  async exportarSedes() {
    return await SedesRepository.exportarSedes();
  }
}

module.exports = new SedesService();
*/