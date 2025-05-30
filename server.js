const iniciarBaseDeDatos = require('./database/Init');
const insertarUsuarioAdmin = require('./database/Seeds');

const express = require('express');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();
require('./passport/Google');

const session = require('express-session');
const authRoutes = require('./routes/AuthRoutes');
const adminRoutes = require('./routes/AdminRoutes');
const usuariosRoutes = require('./routes/UsuariosRoutes');
const sedeRoutes = require('./routes/SedesRoutes');
const profesoresRoutes = require('./routes/ProfesoresRoutes');
const asignaturasRoutes = require('./routes/AsignaturasRoutes');
const aulasRoutes = require('./routes/AulasRoutes');
const errorHandler = require('./middlewares/ErrorHandler');
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();
const allowedOrigins = [process.env.FRONTEND_URL];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origin (como Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

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
app.use('/api/asignaturas', asignaturasRoutes);
app.use('/api/aulas', aulasRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Redirección a chatbot
app.get('/chatbot', (req, res) => {
  res.redirect('http://localhost:3000/chatbot');
});

// Middleware de errores
app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Servidor iniciado en puerto ${process.env.PORT}`);
});


(async () => {
  await iniciarBaseDeDatos();
  await insertarUsuarioAdmin();
})();