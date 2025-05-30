const pool = require('../config/Db');

exports.consultarUbicacion = async (req, res) => {
  const { pregunta } = req.body;

  try {
    // Intentar extraer un código tipo G306
    const match = pregunta.match(/([A-Z]?\d{3})/i);

    let terminoBusqueda = '';

    if (match) {
      terminoBusqueda = match[1].toUpperCase(); // ejemplo: G306
    } else {
      // Si no hay código, usamos toda la frase para búsqueda amplia
      terminoBusqueda = pregunta.trim().toUpperCase();
    }

    console.log("Buscando aula con término:", terminoBusqueda);

    const resultado = await pool.query(`
      SELECT a.nombreAula, s.latitudSede AS latitud, s.longitudSede AS longitud, s.nombreSede
      FROM aulas a
      JOIN sedes s ON a.idSedeActual = s.idSede
      WHERE UPPER(a.nombreAula) ILIKE '%' || $1 || '%'
      LIMIT 1
    `, [terminoBusqueda]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: `No encontré un aula que coincida con "${terminoBusqueda}".` });
    }

    const aula = resultado.rows[0];

    res.json({
      mensaje: `Tu aula ${aula.nombreaula} está ubicada en la sede ${aula.nombresede}.`,
      coordenadas: {
        lat: aula.latitud,
        lng: aula.longitud
      }
    });

  } catch (error) {
    console.error('Error en consulta de aula:', error.message);
    res.status(500).json({ mensaje: 'Error al consultar la ubicación del aula.' });
  }
};
