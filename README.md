# MediVisit – Backend (API REST)

API REST del sistema **MediVisit**, para el control de visitas del **Hospital Luis A. Güemes** (Aguaray, Salta).
Proyecto de la Tecnicatura Superior en Análisis de Sistemas y Desarrollo de Software – IES N° 6.039.

- **Frontend:** https://medivisit-final.vercel.app
- **API en producción:** https://medivisit-final-1.onrender.com

## Tecnologías

| Parte | Tecnología |
|---|---|
| Servidor | Node.js + Express 4 |
| Base de datos | **PostgreSQL** (Neon en producción) |
| ORM | Sequelize 6 (`pg`, `pg-hstore`) |
| Fotos de visitantes | Cloudinary |
| Informe semanal | pdfkit (PDF) |
| Desarrollo | nodemon |
| Hosting | Render (API) · Neon (base de datos) |

## Estructura

```
back-medivisit/
├── README.md
├── docs/
│   └── DER-MediVisit.png        # Diagrama entidad-relación (generado desde la base real)
└── backend/
    ├── index.js                 # Arranque de Express, CORS, rutas y 404
    ├── package.json
    ├── migrations/
    │   └── 001-agregar-paciente-id.sql   # Relación Paciente 1:N Visita
    └── src/
        ├── config/cloudinary.js
        ├── db/
        │   ├── sequelize.js     # Conexión a PostgreSQL
        │   └── schema.js        # authenticate() + sync()
        ├── models/index.js      # Paciente, Visita, Usuario y relaciones
        ├── routes/
        │   ├── pacientes.js
        │   ├── visitas.js
        │   └── usuarios.js
        └── assets/logo.jpeg     # Logo del PDF
```

## Base de datos PostgreSQL

### Modelo de datos

| Tabla | Descripción | Campos principales |
|---|---|---|
| `pacientes` | Pacientes internados | id, nombre, documento (único), teléfono (único), email (único), dirección, habitación, cama, alergias, notas |
| `visitas` | Visitas a un paciente | id, **paciente_id (FK)**, paciente_nombre, nombre/apellido_visitante, dni, parentesco, fecha, hora_ingreso, hora_salida, tipo, foto |
| `usuarios` | Usuarios autenticados con Firebase | id, firebase_uid (único), nombre, email, fecha_registro |

### Diagrama entidad-relación

![DER de MediVisit](docs/DER-MediVisit.png)

### Relación

**Paciente 1 ──── N Visita**: un paciente tiene muchas visitas; cada visita pertenece a un paciente mediante `visitas.paciente_id → pacientes.id` (`ON DELETE SET NULL`).

```js
Paciente.hasMany(Visita,   { foreignKey: 'paciente_id', as: 'visitas' });
Visita.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
```

### Crear la base en Neon (u otro PostgreSQL)

1. Crear un proyecto en https://neon.tech y copiar la *connection string*.
2. Pegarla en `URL_NEON` dentro del archivo `.env` (ver más abajo).
3. Al iniciar el servidor, `sequelize.sync()` **crea las tablas que no existan** (nunca modifica las existentes).

### Migración (solo si la base ya existía sin `paciente_id`)

`sync()` no altera tablas existentes, por eso hay que ejecutar este SQL una vez en el *SQL Editor* de Neon (está guardado en `backend/migrations/001-agregar-paciente-id.sql`):

```sql
BEGIN;
ALTER TABLE visitas
  ADD COLUMN IF NOT EXISTS paciente_id INTEGER REFERENCES pacientes(id) ON DELETE SET NULL;

UPDATE visitas v
SET paciente_id = p.id
FROM pacientes p
WHERE p.nombre = v.paciente_nombre AND v.paciente_id IS NULL;

SELECT COUNT(*) AS visitas_sin_paciente FROM visitas WHERE paciente_id IS NULL;
COMMIT;
```

Rollback de la migración: `ALTER TABLE visitas DROP COLUMN paciente_id;`

### Usar PostgreSQL local (opcional)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medivisit
DB_USER=postgres
DB_PASSWORD=tu_clave
DB_SSL=false
```

## Variables de entorno

Crear el archivo **`backend/.env`** (no se sube a Git, está en `.gitignore`):

| Variable | Obligatoria | Descripción |
|---|---|---|
| `URL_NEON` | Sí* | Connection string de PostgreSQL (Neon). Si existe, se usa en lugar de `DB_*` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Sí* | Alternativa a `URL_NEON` |
| `DB_SSL` | No | `false` para desactivar SSL (PostgreSQL local). Por defecto activo |
| `PORT` | No | Puerto del servidor (por defecto 3000) |
| `FRONTEND_ORIGIN` | No | Origen permitido por CORS (por defecto `*`) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Sí | Credenciales para subir fotos |

\* Una de las dos opciones.

Ejemplo:

```env
URL_NEON=postgresql://usuario:clave@host.neon.tech/neondb?sslmode=require
PORT=3000
FRONTEND_ORIGIN=https://medivisit-final.vercel.app
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
```

> 🔒 **Nunca subas el `.env` ni muestres tu contraseña.** Si se filtra, rotala desde el panel de Neon.

## Instalación y ejecución

```bash
git clone https://github.com/ovandorodrigo08/back-medivisit.git
cd back-medivisit/backend
npm install
npm run dev      # desarrollo (nodemon)
npm start        # producción
```

Si todo está bien, la consola muestra:

```
✅ Conectado a PostgreSQL correctamente
✅ Tablas verificadas/creadas correctamente
```

## Endpoints

Base: `/api`

### Pacientes

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/pacientes` | Listar |
| GET | `/pacientes/:id` | Obtener uno |
| POST | `/pacientes` | Crear (obligatorios: nombre, documento, direccion) |
| PUT | `/pacientes/:id` | Actualizar (sincroniza el nombre en sus visitas) |
| DELETE | `/pacientes/:id` | Eliminar |

### Visitas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/visitas` | Listar |
| GET | `/visitas/informe-semanal` | Resumen semanal (JSON) |
| GET | `/visitas/informe-semanal/pdf` | Informe semanal en PDF |
| GET | `/visitas/visitante/:dni` | Historial de un visitante |
| GET | `/visitas/:id` | Obtener una |
| POST | `/visitas` | Registrar visita |
| PUT | `/visitas/:id` | Modificar |
| DELETE | `/visitas/:id` | Eliminar |

### Usuarios

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/usuarios/sync` | Sincroniza el usuario de Firebase (`firebaseUid`, `nombre`, `email`) |
| GET | `/usuarios` | Listar |

### Códigos de respuesta

`200` OK · `201` creado · `400` datos inválidos o duplicado · `404` no encontrado · **`409` el paciente ya tiene 2 visitantes simultáneos** · `500` error interno.

## Reglas de negocio

- **Máximo 2 visitantes al mismo tiempo por paciente.** Se calcula por superposición de `hora_ingreso`/`hora_salida` (zona horaria Argentina). Cuando termina la hora de una visita, el cupo se libera y puede entrar otra persona.
- Documento, email y teléfono del paciente son únicos.
- Campos obligatorios validados en el servidor.

## Despliegue (Render)

| Ajuste | Valor |
|---|---|
| Branch | `master` |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Auto-Deploy | On Commit |

Cargar las variables de entorno en *Environment* de Render. Si algo falla, el botón **Rollback** en *Deploys* vuelve a la versión anterior.

## Flujo de trabajo con Git

```bash
git checkout -b feature/mi-cambio
git add .
git commit -m "feat: descripción"
git push origin feature/mi-cambio
# Abrir Pull Request hacia master → al hacer merge, Render despliega solo
```

## Autor

Rodrigo Ovando y Florencia Vera – IES N° 6.039, Aguaray, Salta.
