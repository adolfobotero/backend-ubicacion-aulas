const express = require('express');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();
require('./passport/google');

const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const sedeRoutes = require('./routes/sedesRoutes');
const profesoresRoutes = require('./routes/profesoresRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use(session({ secret: 'clave_super_secreta', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Rutas principales
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/sedes', sedeRoutes);
app.use('/api/profesores', profesoresRoutes);

// Redirección a chatbot
app.get('/chatbot', (req, res) => {
  res.redirect('http://localhost:3000/chatbot');
});

// Middleware de errores
app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Servidor iniciado en puerto ${process.env.PORT}`);
});
