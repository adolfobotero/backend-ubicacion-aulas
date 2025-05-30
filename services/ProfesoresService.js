const ProfesoresRepository = require('../repositories/ProfesoresRepository');
const Profesor = require('../domain/Profesor');

class ProfesoresService {
  async listarProfesores(pagina, limite, busqueda) {
    return await ProfesoresRepository.getProfesores(pagina, limite, busqueda);
  }

  async crearProfesor(data) {
    const profesor = new Profesor(data);
    return await ProfesoresRepository.createProfesor(profesor.toJSON());
  }

  async actualizarProfesor(id, data) {
    const profesor = new Profesor(data);
    return await ProfesoresRepository.updateProfesor(id, profesor.toJSON());
  }

  async eliminarProfesor(id) {
    return await ProfesoresRepository.deleteProfesor(id);
  }

  async importarProfesores(profesores) {
    if (!Array.isArray(profesores) || profesores.length === 0) {
      throw new Error('No se recibieron profesores válidos');
    }
    
    return await ProfesoresRepository.importarProfesores(profesores);
  }

  async exportarProfesores() {
    return await ProfesoresRepository.exportarProfesores();
  }
}

module.exports = new ProfesoresService();

/*
const ProfesoresRepository = require('../repositories/ProfesoresRepository');

class ProfesoresService {
  async listarProfesores(pagina, limite, busqueda) {
    return await ProfesoresRepository.getProfesores(pagina, limite, busqueda);
  }

  async crearProfesor(data) {
    const { codeProfesor, nombreProfesor, mailProfesor } = data;

    if (!codeProfesor || !nombreProfesor || !mailProfesor) {
      throw new Error('Todos los campos son obligatorios');
    }

    if (!mailProfesor.endsWith('@ucaldas.edu.co')) {
      throw new Error('El correo debe ser institucional (@ucaldas.edu.co)');
    }

    return await ProfesoresRepository.createProfesor(data);
  }

  async actualizarProfesor(id, data) {
    const { codeProfesor, nombreProfesor, mailProfesor } = data;

    if (!codeProfesor || !nombreProfesor || !mailProfesor) {
      throw new Error('Todos los campos son obligatorios');
    }

    if (!mailProfesor.endsWith('@ucaldas.edu.co')) {
      throw new Error('El correo debe ser institucional (@ucaldas.edu.co)');
    }

    return await ProfesoresRepository.updateProfesor(id, data);
  }

  async eliminarProfesor(id) {
    return await ProfesoresRepository.deleteProfesor(id);
  }

  async importarProfesores(profesores) {
    if (!Array.isArray(profesores) || profesores.length === 0) {
      throw new Error('No se recibieron profesores válidos');
    }

    return await ProfesoresRepository.importarProfesores(profesores);
  }

  async exportarProfesores() {
    return await ProfesoresRepository.exportarProfesores();
  }
}

module.exports = new ProfesoresService();
*/