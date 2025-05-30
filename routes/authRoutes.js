const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { loginLocal } = require('../controllers/authController');

// Login local
router.post('/login', loginLocal);

// Login con Google
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback de Google
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/google/failure', session: false }),
  (req, res) => {
    // Verifica si se autenticó correctamente
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL}/`);
    }

    // Generar token JWT (igual que loginLocal)
    const token = jwt.sign({
      idusuario: req.user.idusuario,
      nombreUsuario: req.user.nombrecompleto,
      mailUsuario: req.user.mailusuario,
      rol: req.user.rolusuario,
      recibir_notificaciones: req.user.recibir_notificaciones ?? false
    }, process.env.JWT_SECRET, { expiresIn: '2h' });

    //console.log('Token con Google:', jwt.decode(token));
    //console.log('Ruta actual:', process.env.FRONTEND_URL)

    // Redirige al frontend con el token en la URL
    res.redirect(`${process.env.FRONTEND_URL}/chatbot?token=${token}`);
  }
);

// Ruta para manejar errores de autenticación de Google
router.get('/auth/google/failure', (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/?error=google`);
});

module.exports = router;
