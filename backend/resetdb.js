// resetdb.js — Borra y recrea las tablas con la estructura correcta
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'medivisit',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
});

async function reset() {
  console.log('🗑️  Eliminando tablas antiguas...');
  await pool.query('DROP TABLE IF EXISTS visitas CASCADE');
  await pool.query('DROP TABLE IF EXISTS pacientes CASCADE');
  console.log('✅ Tablas eliminadas.');

  console.log('🔨 Creando tablas nuevas...');
  await pool.query(`
    CREATE TABLE pacientes (
      id               SERIAL PRIMARY KEY,
      nombre           VARCHAR(150)  NOT NULL,
      documento        VARCHAR(20)   NOT NULL UNIQUE,
      fecha_nacimiento DATE,
      genero           VARCHAR(20),
      sangre           VARCHAR(5),
      telefono         VARCHAR(30),
      email            VARCHAR(100),
      direccion        VARCHAR(200)  NOT NULL DEFAULT '',
      habitacion       VARCHAR(10),
      cama             VARCHAR(5),
      alergias         TEXT,
      notas            TEXT,
      created_at       TIMESTAMP     DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE visitas (
      id                  SERIAL        PRIMARY KEY,
      paciente_nombre     VARCHAR(150)  NOT NULL,
      nombre_visitante    VARCHAR(100)  NOT NULL,
      apellido_visitante  VARCHAR(100)  NOT NULL,
      dni                 VARCHAR(20)   NOT NULL,
      telefono            VARCHAR(30),
      domicilio           VARCHAR(200)  NOT NULL DEFAULT '',
      parentesco          VARCHAR(50),
      fecha               DATE,
      hora_ingreso        TIME,
      hora_salida         TIME,
      tipo                VARCHAR(20)   DEFAULT 'Temporal',
      observaciones       TEXT,
      created_at          TIMESTAMP     DEFAULT NOW()
    )
  `);

  console.log('✅ Tablas creadas correctamente.');
  console.log('🎉 Listo. Ahora podés correr: npm start');
  await pool.end();
}

reset().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
