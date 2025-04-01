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

### 1. Clona el repositorio

```bash
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

Crea la base de datos con nombre `ubicacion_aulas` en PostgreSQL con la tabla `usuarios`.

```sql
-- Eliminar la tabla si ya existe
DROP TABLE IF EXISTS usuarios;

-- Crear tabla
CREATE TABLE usuarios (
    idUsuario SERIAL PRIMARY KEY,
    codeUsuario VARCHAR(50) NOT NULL,
    nombreCompleto VARCHAR(100) NOT NULL,
    mailUsuario VARCHAR(100) UNIQUE NOT NULL,
    passUsuario TEXT,
    rolUsuario VARCHAR(50) NOT NULL DEFAULT 'admin',
    metodoLogin VARCHAR(50) NOT NULL DEFAULT 'local'
);

-- Insertar usuarios administrativos (login con correo y contraseña)
-- Contraseñas hasheadas con bcrypt (clave original: admin25)
INSERT INTO usuarios (codeUsuario, nombreCompleto, mailUsuario, passUsuario, rolUsuario, metodoLogin)
VALUES 
('ADM001', 'Administrador', 'admin@ucaldas.edu.co', '$2b$10$YcIPq/KvskKCasmI3u567OV721fZRP/xdXjjJUCfPVHr92y3XokVW', 'admin', 'local');
```

Luego ejecuta:

```bash
node server.js
```

---
## 👨‍💻 Autor

- **Luis Adolfo Botero** – Universidad de Caldas
- Contacto: [GitHub](https://github.com/adolfobotero)
