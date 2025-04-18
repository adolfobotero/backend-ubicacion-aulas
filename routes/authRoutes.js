const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { loginLocal } = require('../controllers/authController');
//const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sistema-ubicacion-aulas.onrender.com/';

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
      return res.redirect(`${FRONTEND_URL}/`);
    }

    // Generar token JWT (igual que loginLocal)
    const token = jwt.sign(
      { idusuario: req.user.idusuario, rol: req.user.rolusuario },
      process.env.JWT_SECRET
    );

    console.log('Autenticación con Google exitosa. Redirigiendo con token...');

    // Redirige al frontend con el token en la URL
    res.redirect(`${FRONTEND_URL}/chatbot?token=${token}`);
  }
);

// Ruta para manejar errores de autenticación de Google
router.get('/auth/google/failure', (req, res) => {
  res.redirect(`${FRONTEND_URL}/?error=google`);
});

module.exports = router;
