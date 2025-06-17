const axios = require('axios');
const pool = require('../config/db');

const ASISTENTE_NOMBRE = 'Aulín';

// === 1️⃣ Función DeepSeek robusta y refinada ===
async function consultarDeepSeek(preguntaUsuario) {
  const prompt = `
Eres ${ASISTENTE_NOMBRE}, asistente de aulas de la Universidad de Caldas.

Tu tarea es analizar la pregunta y devolver SOLO un JSON con UNA de estas intenciones:
- buscar_aula
- buscar_asignatura
- buscar_asignaturas_por_aula
- buscar_materias_por_profesor
- buscar_profesor_por_asignatura
- desconocida

Ejemplos:
Pregunta: Dónde queda el aula U203
Respuesta:
{
  "saludo": "Hola",
  "intencion": "buscar_aula",
  "aula": "U203"
}

Pregunta: Dónde se dicta Arquitectura de Software
Respuesta:
{
  "saludo": "Hola",
  "intencion": "buscar_asignatura",
  "asignatura": "Arquitectura de Software"
}

Pregunta: Quién enseña Arquitectura de Software
Respuesta:
{
  "saludo": "Hola",
  "intencion": "buscar_profesor_por_asignatura",
  "asignatura": "Arquitectura de Software"
}

Pregunta: Qué asignaturas se dictan en la sala J
Respuesta:
{
  "saludo": "Hola",
  "intencion": "buscar_asignaturas_por_aula",
  "aula": "J"
}

Pregunta: Qué materias dicta Willington Londoño
Respuesta:
{
  "saludo": "Hola",
  "intencion": "buscar_materias_por_profesor",
  "profesor": "Willington Londoño"
}

Pregunta: (si no entiendes)
Respuesta:
{
  "saludo": "Hola",
  "intencion": "desconocida"
}

No escribas ningún texto adicional ni <think>.
Pregunta: ${preguntaUsuario}
`.trim();

  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'deepseek-r1:7b',
      prompt,
      stream: false
    });

    const texto = response.data.response.trim();
    console.log('DeepSeek RAW:', texto);

    const jsonBlocks = [...texto.matchAll(/{[\s\S]*?}/g)];
    if (jsonBlocks.length === 0) {
      throw new Error('DeepSeek no devolvió JSON válido.');
    }

    const cleanJson = JSON.parse(jsonBlocks[0][0]);

    // === Sanitización ===
    cleanJson.intencion = cleanJson.intencion.split(/[|,]/)[0].trim();
    const validIntenciones = [
      'buscar_aula',
      'buscar_asignatura',
      'buscar_asignaturas_por_aula',
      'buscar_materias_por_profesor',
      'buscar_profesor_por_asignatura',
      'desconocida'
    ];
    if (!validIntenciones.includes(cleanJson.intencion)) {
      cleanJson.intencion = 'desconocida';
    }

    return cleanJson;

  } catch (error) {
    console.error('DeepSeek Error:', error.message);
    return {
      saludo: 'Hola',
      intencion: 'desconocida'
    };
  }
}

// === 2️⃣ Controlador principal ===
exports.consultarUbicacion = async (req, res) => {
  const { pregunta } = req.body;

  try {
    const parsed = await consultarDeepSeek(pregunta);

    let respuesta = `${parsed.saludo}, soy ${ASISTENTE_NOMBRE}. `;
    let coordenadas = null;

    switch (parsed.intencion) {

      case 'buscar_aula': {
        const result = await pool.query(`
          SELECT a.nombreAula, a.edificioAula, a.pisoAula, s.nombreSede, s.latitudSede, s.longitudSede
          FROM aulas a
          JOIN sedes s ON a.idSedeActual = s.idSede
          WHERE a.nombreAula ILIKE $1;
        `, [`%${parsed.aula}%`]);

        if (result.rows.length === 0) {
          respuesta += `No encontré aulas que coincidan con "${parsed.aula}".`;
        } else {
          respuesta += `Encontré ${result.rows.length} aula(s): `;
          result.rows.forEach((aula, idx) => {
            respuesta += `\n${idx + 1}. Aula ${aula.nombreaula} en ${aula.edificioaula}, piso ${aula.pisoaula}, sede ${aula.nombresede}.`;
          });
          coordenadas = {
            lat: result.rows[0].latitudsede,
            lng: result.rows[0].longitudsede
          };
        }
        break;
      }

      case 'buscar_asignatura': {
        const result = await pool.query(`
          SELECT aa.diaSemana, aa.horaInicio, aa.horaFin,
                 a.nombreAula, a.edificioAula, a.pisoAula,
                 s.nombreSede, s.latitudSede, s.longitudSede,
                 asig.nombreAsignatura, p.nombreProfesor
          FROM asignatura_aula aa
          JOIN aulas a ON aa.idAula = a.idAula
          JOIN sedes s ON a.idSedeActual = s.idSede
          JOIN asignaturas asig ON aa.idAsignatura = asig.idAsignatura
          JOIN profesores p ON aa.idProfesor = p.idProfesor
          WHERE asig.nombreAsignatura ILIKE $1
          ORDER BY aa.horaInicio;
        `, [`%${parsed.asignatura}%`]);

        if (result.rows.length === 0) {
          respuesta += `No encontré coincidencias para la asignatura "${parsed.asignatura}".`;
        } else {
          respuesta += `Encontré ${result.rows.length} coincidencia(s): `;
          result.rows.forEach((data, idx) => {
            respuesta += `\n${idx + 1}. ${data.nombreasignatura} se dicta en aula ${data.nombreaula} (${data.edificioaula}, piso ${data.pisoaula}), sede ${data.nombresede}, con ${data.nombreprofesor}, los ${data.diasemana} de ${data.horainicio} a ${data.horafin}.`;
          });
          coordenadas = {
            lat: result.rows[0].latitudsede,
            lng: result.rows[0].longitudsede
          };
        }
        break;
      }

      case 'buscar_asignaturas_por_aula': {
        const result = await pool.query(`
          SELECT asig.nombreAsignatura, aa.diaSemana, aa.horaInicio, aa.horaFin, p.nombreProfesor
          FROM asignatura_aula aa
          JOIN aulas a ON aa.idAula = a.idAula
          JOIN asignaturas asig ON aa.idAsignatura = asig.idAsignatura
          JOIN profesores p ON aa.idProfesor = p.idProfesor
          WHERE a.nombreAula ILIKE $1
          ORDER BY aa.diaSemana, aa.horaInicio;
        `, [`%${parsed.aula}%`]);

        if (result.rows.length === 0) {
          respuesta += `No encontré asignaturas que se dicten en el aula "${parsed.aula}".`;
        } else {
          respuesta += `En el aula ${parsed.aula} se dictan ${result.rows.length} asignatura(s): `;
          result.rows.forEach((row, idx) => {
            respuesta += `\n${idx + 1}. ${row.nombreasignatura} con ${row.nombreprofesor}, los ${row.diasemana} de ${row.horainicio} a ${row.horafin}.`;
          });
        }
        break;
      }

      case 'buscar_materias_por_profesor': {
        const result = await pool.query(`
          SELECT DISTINCT asig.nombreAsignatura
          FROM profesores p
          JOIN profesor_asignatura pa ON p.idProfesor = pa.idProfesor
          JOIN asignaturas asig ON pa.idAsignatura = asig.idAsignatura
          WHERE p.nombreProfesor ILIKE $1;
        `, [`%${parsed.profesor}%`]);

        if (result.rows.length === 0) {
          respuesta += `No encontré materias para el profesor "${parsed.profesor}".`;
        } else {
          const materias = result.rows.map(r => r.nombreasignatura).join(', ');
          respuesta += `El profesor ${parsed.profesor} dicta: ${materias}.`;
        }
        break;
      }

      case 'buscar_profesor_por_asignatura': {
        const result = await pool.query(`
          SELECT DISTINCT p.nombreProfesor
          FROM asignaturas asig
          JOIN profesor_asignatura pa ON asig.idAsignatura = pa.idAsignatura
          JOIN profesores p ON pa.idProfesor = p.idProfesor
          WHERE asig.nombreAsignatura ILIKE $1;
        `, [`%${parsed.asignatura}%`]);

        if (result.rows.length === 0) {
          respuesta += `No encontré profesor para la asignatura "${parsed.asignatura}".`;
        } else {
          const profesores = result.rows.map(r => r.nombreprofesor).join(', ');
          respuesta += `La asignatura ${parsed.asignatura} la dicta(n): ${profesores}.`;
        }
        break;
      }

      default:
        respuesta += `No entendí bien tu pregunta. ¿Podrías reformularla?`;
    }

    res.json({ mensaje: respuesta, coordenadas });

  } catch (err) {
    console.error('Error chatbot:', err.message);
    res.status(500).json({ mensaje: 'Ocurrió un error al procesar tu pregunta.' });
  }
};
