const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json({ message: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1] || authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // << Aquí se guarda el usuario completo en req
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

function verificarAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json({ message: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1] || authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.rol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. No tiene permisos.' });
    }

    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

module.exports = { verificarAdmin, verificarToken };

/*const jwt = require('jsonwebtoken');

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
*/