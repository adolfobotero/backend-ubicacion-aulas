const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getUsuarios = async (req, res) => {
  const { pagina = 1, limite = 5, busqueda = '' } = req.query;
  const offset = (pagina - 1) * limite;

  try {
    const result = await pool.query(`
      SELECT * FROM usuarios
      WHERE LOWER(nombreCompleto) LIKE LOWER($1) OR LOWER(mailUsuario) LIKE LOWER($1)
      ORDER BY idUsuario
      LIMIT $2 OFFSET $3
    `, [`%${busqueda}%`, limite, offset]);

    const totalRes = await pool.query(`
      SELECT COUNT(*) FROM usuarios
      WHERE LOWER(nombreCompleto) LIKE LOWER($1) OR LOWER(mailUsuario) LIKE LOWER($1)
    `, [`%${busqueda}%`]);

    const total = parseInt(totalRes.rows[0].count, 10);
    res.json({ registros: result.rows, total });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

exports.addUsuario = async (req, res) => {
  const { codeUsuario, nombreCompleto, mailUsuario, passUsuario, rolUsuario, metodoLogin } = req.body;

  if (!nombreCompleto || !mailUsuario || !passUsuario || !rolUsuario || !metodoLogin) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const hash = await bcrypt.hash(passUsuario, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (codeUsuario, nombreCompleto, mailUsuario, passUsuario, rolUsuario, metodoLogin)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [codeUsuario, nombreCompleto, mailUsuario, hash, rolUsuario, metodoLogin]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

exports.updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombreCompleto, mailUsuario, passUsuario, rolUsuario } = req.body;

  try {
    const hash = passUsuario ? await bcrypt.hash(passUsuario, 10) : null;

    const result = await pool.query(
      `UPDATE usuarios SET
         nombreCompleto = $1,
         mailUsuario = $2,
         ${hash ? 'passUsuario = $3,' : ''}
         rolUsuario = $4
       WHERE idUsuario = $5 RETURNING *`,
      hash
        ? [nombreCompleto, mailUsuario, hash, rolUsuario, id]
        : [nombreCompleto, mailUsuario, rolUsuario, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

exports.deleteUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE idUsuario = $1', [id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};
