# 🏫 Sistema de Ubicación de Aulas – Universidad de Caldas

Este proyecto es un sistema inteligente que permite a estudiantes y administrativos ubicar aulas y gestionar asignaciones académicas mediante un panel de administración **y un chatbot asistido con IA (DeepSeek)**.

---

## 🧠 Funcionalidades destacadas

- Panel administrativo con gestión de sedes, aulas, asignaturas, profesores y usuarios.
- Asignación de profesores y aulas a asignaturas con validación de traslapes.
- Historial de cambios en la ubicación de asignaturas.
- Sistema de notificaciones por correo (patrón Observer).
- Importación/exportación de aulas y asignaciones vía Excel.
- Chatbot de ayuda integrado con acceso restringido por autenticación.
- Estadísticas del sistema al inicio del dashboard.
- Arquitectura en capas con principios SOLID.

---

## 🤖 Chatbot inteligente Aulín

El asistente virtual **Aulín** está integrado en el sistema y es capaz de responder preguntas como:

| Intención | Ejemplos de preguntas |
|-----------|-----------------------|
| 📍 **Buscar aula** | *Dónde queda el aula U203*, *Dónde está la sala J* |
| 📚 **Buscar asignatura** | *Dónde se dicta Arquitectura de Software*, *Dónde es la clase de Bases de Datos* |
| 🏫 **Buscar asignaturas por aula** | *Qué asignaturas se dictan en la sala J*, *Qué materias hay en el aula U203* |
| 👨‍🏫 **Buscar materias por profesor** | *Qué materias dicta Willington Londoño* |
| 👨‍🏫 **Buscar profesor por asignatura** | *Quién enseña Arquitectura de Software*, *Qué profesor dicta Matemáticas Fundamentales* |

**Funcionamiento:**  
- Aulín analiza la pregunta con DeepSeek.
- Clasifica la intención.
- Extrae el aula, asignatura o profesor solicitado.
- Consulta la base de datos en tiempo real.
- Devuelve una respuesta detallada y coordenadas para ubicarla en el mapa.

**Intenciones soportadas por la IA:**
- `buscar_aula`
- `buscar_asignatura`
- `buscar_asignaturas_por_aula`
- `buscar_materias_por_profesor`
- `buscar_profesor_por_asignatura`
- `desconocida` (para preguntas fuera de contexto)

**Nota:** El backend aplica un filtro robusto para limpiar respuestas incorrectas de la IA, garantizando resultados coherentes.

---

## 🧱 Tecnologías utilizadas

- **Frontend:** React, Tailwind CSS, Axios
- **Backend:** Node.js, Express, PostgreSQL
- **Base de datos:** PostgreSQL
- **Autenticación:** OAuth2 (Google), login local con JWT
- **Patrones de diseño:** Factory Method, Proxy, Observer, Strategy
- **Otros:** Dotenv, Nodemailer, bcrypt, multer

---

## 🗂️ Estructura del proyecto

```
/frontend
├── src
│   ├── components/      # Botones, tablas, formularios reutilizables
│   ├── views/           # Vistas por módulo (Dashboard, Aulas, etc.)
│   ├── styles/          # Estilos por sección
│   └── App.js
```

```
/backend
├── controllers/         # Lógica de negocio organizada por módulo (coordinan servicios)
├── services/            # Reglas de negocio y orquestación entre repositorios y controladores
├── repositories/        # Acceso a datos: consultas SQL directas o mediante pool
├── domain/              # Modelos de dominio (clases como Usuario, Aula, etc.)
├── routes/              # Endpoints HTTP organizados por recurso (usuarios, aulas, etc.)
├── observers/           # Implementación del patrón Observer (ej. notificaciones por correo)
├── factories/           # Patrón Factory para creación de instancias (usuarios, login, etc.)
├── middlewares/         # Autenticación, validación de roles y otros middleware de Express
├── passport/            # Estrategias de autenticación (OAuth con Google, configuración de Passport)
├── config/db.js         # Configuración de conexión a PostgreSQL
├── database/            # Scripts de creación de tablas y relaciones, inserción de datos iniciales
└── server.js            # Punto de entrada de la aplicación Express
```

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/adolfobotero/sistema-ubicacion-aulas.git
git clone https://github.com/adolfobotero/backend-ubicacion-aulas.git
```

### 2. Configurar el backend

```bash
cd backend-ubicacion-aulas
npm install
```

Crear el archivo `.env` en el backend con la siguiente estructura:

```env
# Configuración de conexión a PostgreSQL
PG_USER=postgres
PG_HOST=localhost
PG_DATABASE=ubicacion_aulas
PG_PASSWORD=TU_CONTRASEÑA_DE_POSTGRES         # ← Reemplaza con tu contraseña local de PostgreSQL
PG_PORT=5432

# URL del frontend para permitir solicitudes (CORS)
FRONTEND_URL=http://localhost:3000

# Configuración del servidor y autenticación JWT
PORT=3001
JWT_SECRET=clave_super_secreta

# Credenciales de Google OAuth para inicio de sesión
GOOGLE_CLIENT_ID=TU_CLIENT_ID_GOOGLE          # ← Reemplaza con tu Client ID de Google
GOOGLE_CLIENT_SECRET=TU_CLIENT_SECRET_GOOGLE  # ← Reemplaza con tu Client Secret de Google
GOOGLE_CALLBACK=http://localhost:3001/auth/google/callback

# Configuración para envío de correos (notificaciones)
MAIL_USER=TU_CORREO@ucaldas.edu.co            # ← Reemplaza con el correo institucional desde el cual se enviarán notificaciones
MAIL_PASS=TU_CONTRASEÑA_DE_APLICACIÓN         # ← Reemplaza con la contraseña de aplicación generada en Gmail
```

### 3. Creación de la base de datos

Primero, asegúrate de tener PostgreSQL y PGAdmin instalados en tu equipo.
```
1. Abre **PGAdmin**.
2. En el panel izquierdo, haz clic derecho sobre `Databases` y selecciona **Create > Database**.
3. En el campo **Database name**, escribe: `ubicacion_aulas`.
4. Haz clic en **Save** para crear la base de datos.
```
Levantar el servidor:

```bash
node server.js
```

### 4. Configurar el frontend

```bash
cd sistema-ubicacion-aulas
npm install
```

Crear el archivo `.env` en el frontend con la siguiente estructura:

```env
# Rutas localhost BACKEND
REACT_APP_API_URL=http://localhost:3001
```

Iniciar el servidor de desarrollo:

```bash
npm start
```

### 5. Instalar y ejecutar Ollama con DeepSeek

Este proyecto usa **DeepSeek-R1** corriendo localmente mediante **Ollama** para alimentar el chatbot **Aulín**.

**Instalar Ollama (una vez):**  
Descargar e instalar desde [https://ollama.com/](https://ollama.com/)

**Descargar mediante la terminal PowerShell el modelo DeepSeek-R1:**

```bash
ollama pull deepseek-r1:7b
```

**Ejecutar el modelo:**

```bash
ollama run deepseek-r1:7b
```

Esto deja corriendo DeepSeek localmente en `http://localhost:11434`.

**Detener manualmente:**  
- Si lo ejecutaste con `ollama run`, presiona `Ctrl + C` en la terminal para detenerlo.
- También puedes gestionar modelos desde el dashboard de Ollama.

**Nota:** El backend del chatbot necesita que DeepSeek esté encendido para responder preguntas.


### 6. Verificar que el backend y frontend estén en servicio

```bash
# Backend
node server.js

# Frontend
npm start
```

---

## 🔒 Seguridad y acceso

- `/admin/dashboard`: solo accesible para administradores.
- `/chatbot`: accesible para usuarios autenticados con dominio `@ucaldas.edu.co`.
- Rutas protegidas con JWT y validación de roles mediante middlewares en el backend.

> El backend utiliza JWT para validar la sesión de los usuarios y un middleware tipo Proxy para restringir rutas según el rol del usuario.

---

## 👤 Autores

- **Luis Adolfo Botero** – Universidad de Caldas – [GitHub](https://github.com/adolfobotero)
- **Juan Esteban** – Universidad de Caldas
- **Yulay Andrea Castaño** – Universidad de Caldas
- **Magreth Quintero** – Universidad de Caldas
- **Camilo Osorio Latorre** – Universidad de Caldas

---

## 📜 Licencia

Proyecto académico – Universidad de Caldas – Manizales, Colombia.
