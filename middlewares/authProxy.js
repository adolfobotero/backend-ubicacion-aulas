// Este middleware verifica si el usuario tiene el rol de 'admin' para acceder a ciertas rutas
// Importamos el paquete jsonwebtoken para verificar el token
const jwt = require('jsonwebtoken');

function verificarAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  // Validar existencia de header y token
  if (!authHeader) {
    return res.status(403).json({ message: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1] || authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.rol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. No tiene permisos.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

module.exports = { verificarAdmin };
