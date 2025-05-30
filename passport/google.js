const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../config/Db');
const UsuarioFactory = require('../factories/UsuarioFactory');
require('dotenv').config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;

  //console.log('Perfil recibido de Google:', profile);
  
  // Validar dominio institucional
  if (!email.endsWith('@ucaldas.edu.co')) {
    return done(null, false, { message: 'Solo se permiten correos @ucaldas.edu.co' });
  }

  try {
    // Buscar si ya existe en BD
    const result = await pool.query('SELECT * FROM usuarios WHERE mailusuario = $1', [email]);
    let user = result.rows[0];

    if (!user) {
      const nuevoUsuario = UsuarioFactory.crearUsuario('google', {
        codeusuario: profile.id,
        nombrecompleto: profile.displayName,
        mailusuario: email
      });

      const insert = await pool.query(`
        INSERT INTO usuarios (codeusuario, nombrecompleto, mailusuario, rolusuario, metodologin, recibirnotificaciones)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
      `, [
        nuevoUsuario.codeUsuario,
        nuevoUsuario.nombreCompleto,
        nuevoUsuario.mailUsuario,
        nuevoUsuario.rolUsuario,
        nuevoUsuario.metodoLogin,
        false
      ]);

      user = insert.rows[0];
    }

    return done(null, user);

  } catch (err) {
    console.error('Error en login con Google:', err.message);
    return done(null, false, {
      message: 'No se pudo conectar con el servidor. Intente más tarde.'
    });
  }
}));

// Manejo de Sesiones
passport.serializeUser((user, done) => done(null, user.idusuario));

passport.deserializeUser(async (id, done) => {
  try {
    const res = await pool.query('SELECT * FROM usuarios WHERE idusuario = $1', [id]);
    done(null, res.rows[0]);
  } catch (err) {
    console.error('Error en deserializeUser:', err.message);
    done(err, null);
  }
});
