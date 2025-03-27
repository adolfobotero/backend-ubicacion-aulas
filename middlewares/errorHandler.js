module.exports = (err, req, res, next) => {
    console.error('Error en la aplicación:', err.message);
  
    res.status(err.status || 500).json({
      error: true,
      message: err.message || 'Error interno del servidor'
    });
  };
  