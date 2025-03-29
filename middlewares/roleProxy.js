const jwt = require('jsonwebtoken');

function roleProxy(rolPermitido) {
  return (req, res, next) => {
    // Espera el token en el header Authorization en formato "Bearer <token>"
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.rol !== rolPermitido) {
        return res.status(403).json({ message: 'Acceso denegado. No tiene permisos.' });
      }
      // Guarda datos decodificados en req para usar luego
      req.usuario = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  };
}

module.exports = roleProxy;