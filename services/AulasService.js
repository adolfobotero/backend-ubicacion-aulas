const AulasRepository = require('../repositories/AulasRepository');
const Aula = require('../domain/Aula');

class AulasService {
  async listarAulas(pagina, limite, busqueda) {
    return await AulasRepository.getAulas(pagina, limite, busqueda);
  }

  async crearAula(data) {
    const aula = new Aula(data);
    return await AulasRepository.createAula(aula.toJSON());
  }

  async actualizarAula(id, data) {
    const aula = new Aula(data);
    return await AulasRepository.updateAula(id, aula.toJSON());
  }

  async eliminarAula(id) {
    return await AulasRepository.deleteAula(id);
  }

  async obtenerAsignaturasPorAula(idAula) {
    return await AulasRepository.getAsignaturasPorAula(idAula);
  }

  async asignarAsignatura(idAula, datos, usuario) {
    return await AulasRepository.asignarAsignatura(idAula, datos, usuario);
  }

  async quitarAsignacion(idAula, datos) {
    return await AulasRepository.quitarAsignacion(idAula, datos);
  }

  async obtenerAsignaturasAsignadas() {
    return await AulasRepository.getAsignaturasAsignadas();
  }

  async moverAsignatura(datos, token) {
    return await AulasRepository.moverAsignatura(datos, token);
  }

  async importarAulas(aulas) {
    return await AulasRepository.importarAulas(aulas);
  }

  async importarAsignaciones(asignaciones) {
    return await AulasRepository.importarAsignaciones(asignaciones);
  }

  async exportarAulas() {
    return await AulasRepository.exportarAulas();
  }
}

module.exports = new AulasService();

/*
const AulasRepository = require('../repositories/aulasRepository');
const pool = require('../config/Db');
const jwt = require('jsonwebtoken');

class AulasService {
  async listarAulas(pagina, limite, busqueda) {
    return await AulasRepository.getAulas(pagina, limite, busqueda);
  }

  async crearAula(data) {
    const { codeAula, nombreAula, capAula, edificioAula, pisoAula, idSedeActual } = data;

    if (!codeAula || !nombreAula || !capAula || !edificioAula || !pisoAula || !idSedeActual) {
      throw new Error('Todos los campos son obligatorios');
    }

    return await AulasRepository.createAula(data);
  }

  async actualizarAula(id, data) {
    return await AulasRepository.updateAula(id, data);
  }

  async eliminarAula(id) {
    return await AulasRepository.deleteAula(id);
  }

  async obtenerAsignaturasPorAula(id) {
    return await AulasRepository.getAsignaturasPorAula(id);
  }

  async asignarAsignatura(idAulaNueva, datos, usuario) {
    const { idAsignatura, idProfesor, diaSemana, horaInicio, horaFin } = datos;

    if (!idAsignatura || !idProfesor || !diaSemana || !horaInicio || !horaFin) {
      throw new Error('Todos los campos son obligatorios');
    }

    const idUsuarioCambio = usuario?.idusuario || null;

    // Verificar conflicto de horario
    const conflicto = await pool.query(`
      SELECT 1 FROM asignatura_aula
      WHERE idAula = $1 AND diaSemana = $2
        AND horaInicio < $4 AND horaFin > $3
    `, [idAulaNueva, diaSemana, horaInicio, horaFin]);

    if (conflicto.rows.length > 0) {
      throw new Error('El aula ya está ocupada en ese horario.');
    }

    // Buscar si ya estaba asignada
    const previa = await pool.query(`
      SELECT * FROM asignatura_aula
      WHERE idAsignatura = $1 AND diaSemana = $2
    `, [idAsignatura, diaSemana]);

    if (previa.rows.length > 0) {
      const anterior = previa.rows[0];

      await pool.query(`
        INSERT INTO historial_asignatura_aula (
          idAsignatura, idAulaAnterior, idAulaNueva,
          diaSemanaAnterior, horaInicioAnterior, horaFinAnterior,
          diaSemanaNuevo, horaInicioNuevo, horaFinNuevo,
          idUsuarioCambio, motivo
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      `, [
        idAsignatura,
        anterior.idaula,
        idAulaNueva,
        anterior.diasemana,
        anterior.horainicio,
        anterior.horafin,
        diaSemana,
        horaInicio,
        horaFin,
        idUsuarioCambio,
        'Reubicación de aula'
      ]);

      await pool.query(
        'DELETE FROM asignatura_aula WHERE idAsignatura = $1 AND diaSemana = $2',
        [idAsignatura, diaSemana]
      );
    }

    await pool.query(`
      INSERT INTO asignatura_aula (idAsignatura, idAula, idProfesor, diaSemana, horaInicio, horaFin)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [idAsignatura, idAulaNueva, idProfesor, diaSemana, horaInicio, horaFin]);

    const resultado = await AulasRepository.getAsignaturasPorAula(idAulaNueva);
    return resultado;
  }

  async quitarAsignacion(idAula, datos) {
    return await AulasRepository.quitarAsignacion(idAula, datos);
  }
  
  async obtenerAsignaturasAsignadas() {
    return await AulasRepository.getAsignaturasAsignadas();
  }

  async moverAsignatura(idaula, datos, token) {
    const {
      idAsignatura,
      idProfesor,
      nuevoDia,
      nuevaHoraInicio,
      nuevaHoraFin,
      aulaAnterior,
      diaAnterior,
      horaInicioAnterior,
      horaFinAnterior
    } = datos;

    if (!idaula || !idAsignatura || !idProfesor || !nuevoDia || !nuevaHoraInicio || !nuevaHoraFin) {
      throw new Error('Faltan datos obligatorios para mover la asignatura.');
    }

    if (!token) throw new Error('Token no proporcionado');
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    const idUsuarioCambio = decoded.idusuario;

    return await AulasRepository.moverAsignatura({
      idaula,
      idAsignatura,
      idProfesor,
      nuevoDia,
      nuevaHoraInicio,
      nuevaHoraFin,
      aulaAnterior,
      diaAnterior,
      horaInicioAnterior,
      horaFinAnterior,
      idUsuarioCambio
    });
  }

  async importarAulas(aulas) {
    if (!Array.isArray(aulas) || aulas.length === 0) {
      throw new Error('No se recibieron aulas válidas');
    }
    return await AulasRepository.importarAulas(aulas);
  }

  async importarAsignaciones(asignaciones) {
    if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
      throw new Error('No se recibieron asignaciones válidas');
    }
    return await AulasRepository.importarAsignaciones(asignaciones);
  }

  async exportarAulas() {
    return await AulasRepository.exportarAulas();
  }
}

module.exports = new AulasService();
*/