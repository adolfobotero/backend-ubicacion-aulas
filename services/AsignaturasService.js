const AsignaturasRepository = require('../repositories/AsignaturasRepository');
const Asignatura = require('../domain/Asignatura');

class AsignaturasService {
  async listarAsignaturas(pagina, limite, busqueda) {
    return await AsignaturasRepository.getAsignaturas(pagina, limite, busqueda);
  }

  async crearAsignatura(data) {
    const asignatura = new Asignatura(data);
    return await AsignaturasRepository.createAsignatura(asignatura.toJSON());
  }

  async actualizarAsignatura(id, data) {
    const asignatura = new Asignatura(data);
    return await AsignaturasRepository.updateAsignatura(id, asignatura.toJSON());
  }

  async eliminarAsignatura(id) {
    return await AsignaturasRepository.deleteAsignatura(id);
  }

  async obtenerDetalle(id) {
    return await AsignaturasRepository.getDetalleAsignatura(id);
  }

  async obtenerProfesoresPorAsignatura(idAsignatura) {
    return await AsignaturasRepository.getProfesoresPorAsignatura(idAsignatura);
  }

  async asignarProfesor(idAsignatura, idProfesor) {
    if (!idProfesor) throw new Error('Falta el id del profesor');
    const ok = await AsignaturasRepository.asignarProfesor(idAsignatura, idProfesor);
    if (!ok) throw new Error('El profesor ya está asignado a esta asignatura');
    return await AsignaturasRepository.getProfesoresPorAsignatura(idAsignatura);
  }

  async quitarProfesor(idAsignatura, idProfesor) {
    await AsignaturasRepository.quitarProfesor(idAsignatura, idProfesor);
    return await AsignaturasRepository.getProfesoresPorAsignatura(idAsignatura);
  }

  async obtenerHistorial(idAsignatura, pagina, limite) {
    return await AsignaturasRepository.getHistorialAsignatura(idAsignatura, pagina, limite);
  }

  async importarAsignaturas(asignaturas) {
  if (!Array.isArray(asignaturas) || asignaturas.length === 0) {
    throw new Error('No se recibieron asignaturas válidas');
  }

  return await AsignaturasRepository.importarAsignaturas(asignaturas);
}

  async exportarAsignaturas() {
    return await AsignaturasRepository.exportarAsignaturas();
  }
}

module.exports = new AsignaturasService();

/*
const AsignaturasRepository = require('../repositories/asignaturasRepository');

class AsignaturasService {
  async listarAsignaturas(pagina, limite, busqueda) {
    return await AsignaturasRepository.getAsignaturas(pagina, limite, busqueda);
  }

  async crearAsignatura(data) {
    const { codeAsignatura, nombreAsignatura } = data;
    if (!codeAsignatura || !nombreAsignatura) {
      throw new Error('Todos los campos son obligatorios');
    }
    return await AsignaturasRepository.createAsignatura(data);
  }

  async actualizarAsignatura(id, data) {
    return await AsignaturasRepository.updateAsignatura(id, data);
  }

  async eliminarAsignatura(id) {
    return await AsignaturasRepository.deleteAsignatura(id);
  }

  async obtenerDetalle(id) {
    return await AsignaturasRepository.getDetalleAsignatura(id);
  }

  async obtenerProfesoresPorAsignatura(idAsignatura) {
    return await AsignaturasRepository.getProfesoresPorAsignatura(idAsignatura);
  }

  async asignarProfesor(idAsignatura, idProfesor) {
    if (!idProfesor) throw new Error('Falta el id del profesor');
    const ok = await AsignaturasRepository.asignarProfesor(idAsignatura, idProfesor);
    if (!ok) throw new Error('El profesor ya está asignado a esta asignatura');
    return await AsignaturasRepository.getProfesoresPorAsignatura(idAsignatura);
  }

  async quitarProfesor(idAsignatura, idProfesor) {
    await AsignaturasRepository.quitarProfesor(idAsignatura, idProfesor);
    return await AsignaturasRepository.getProfesoresPorAsignatura(idAsignatura);
  }

  async obtenerHistorial(idAsignatura, pagina, limite) {
    return await AsignaturasRepository.getHistorialAsignatura(idAsignatura, pagina, limite);
  }

  async importarAsignaturas(asignaturas) {
    if (!Array.isArray(asignaturas) || asignaturas.length === 0) {
      throw new Error('No se recibieron asignaturas válidas');
    }
    return await AsignaturasRepository.importarAsignaturas(asignaturas);
  }

  async exportarAsignaturas() {
    return await AsignaturasRepository.exportarAsignaturas();
  }
}

module.exports = new AsignaturasService();
*/