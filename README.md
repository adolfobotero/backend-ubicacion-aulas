# 🏫 Sistema de Ubicación de Aulas – U. de Caldas

Este proyecto es un sistema inteligente que permite a estudiantes y administrativos encontrar la ubicación de aulas en la Universidad de Caldas mediante un panel de administración y un chatbot asistido con IA.

## 🔧 Tecnologías utilizadas

- **Frontend:** React, CSS
- **Backend:** Node.js, Express
- **Base de datos:** PostgreSQL
- **Autenticación:** Login con Google (OAuth2) y usuario/contraseña
- **Patrones aplicados:** Factory Method, Proxy

## 📁 Estructura del proyecto

```
/frontend
├── src
│   ├── assets/              # imágenes
│   ├── components/          # componentes reutilizables
│   ├── views/               # vistas/páginas como login, dashboard, chatbot
│   ├── styles/              # CSS por vista
│   └── App.js
```

```
/backend
├── routes/                 # rutas de autenticación y administración
├── controllers/            # lógica de login
├── passport/               # estrategia de login con Google
├── middlewares/            # proxy de roles
├── models/                 # Factory Method para usuarios
├── config/db.js            # conexión con PostgreSQL
└── server.js
```

## 🚀 Instalación

### 1. Clona los repositorios

```bash
git clone https://github.com/adolfobotero/sistema-ubicacion-aulas.git
git clone https://github.com/adolfobotero/backend-ubicacion-aulas.git
```

---

### 2. Backend

```bash
cd backend-ubicacion-aulas
npm install
```

Crea un archivo `.env`:

```
PORT=3001
JWT_SECRET=clave_super_secreta
GOOGLE_CLIENT_ID=TU_CLIENT_ID
GOOGLE_CLIENT_SECRET=TU_CLIENT_SECRET
GOOGLE_CALLBACK=http://localhost:3001/auth/google/callback
```

En pgAdmin, crea la base de datos con nombre `ubicacion_aulas` en PostgreSQL y conéctate a la base de datos para ejecutar esta instrucción SQL:

```sql
-- Habilitar la extensión uuid-ossp en PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Ejecuta el siguente script SQL para crear el usuario Adminitrador.

```sql
-- Insertar usuario administrativo (login con correo y contraseña)
-- Contraseña hasheada con bcrypt (clave original: admin25)
INSERT INTO usuarios (codeUsuario, nombreCompleto, mailUsuario, passUsuario, rolUsuario, metodoLogin)
VALUES 
('ADM001', 'Administrador', 'admin@ucaldas.edu.co', '$2b$10$YcIPq/KvskKCasmI3u567OV721fZRP/xdXjjJUCfPVHr92y3XokVW', 'admin', 'local');
```

Luego ejecuta:

```bash
node server.js
```

---

### 3. Frontend

```bash
cd sistema-ubicacion-aulas
npm install
npm start
```

---

## 🔐 Accesos protegidos

- Solo los usuarios con rol `"admin"` acceden a `/admin/dashboard`
- Los estudiantes o administradores pueden entrar a `/chatbot`
- Se usa `PrivateRoute` con JWT y Proxy en backend para proteger rutas

---

## 👨‍💻 Autor

- **Luis Adolfo Botero** – Universidad de Caldas
- Contacto: [GitHub](https://github.com/adolfobotero)
- **Juan Estaban** – Universidad de Caldas
- **Yulay Andrea Castaño** – Universidad de Caldas
- **Magreth Quintero** – Universidad de Caldas
- **Camilo Osorio Latorre** – Universidad de Caldas

---

## 📌 Licencia

- Universidad de Caldas
- Manizales - Colombia