// Este middleware verifica si el usuario tiene el rol de 'admin' para acceder a ciertas rutas
// Importamos el paquete jsonwebtoken para verificar el token
const jwt = require('jsonwebtoken');

function verificarAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).send('Token requerido');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.rol !== 'admin') {
      return res.status(403).send('Acceso denegado. No tiene permisos.');
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send('Token inválido');
  }
}

module.exports = { verificarAdmin };
