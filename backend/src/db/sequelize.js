// src/db/sequelize.js
// Conexión a PostgreSQL (Neon) usando Sequelize.
// Usa las MISMAS variables de entorno que antes (URL_NEON o DB_*),
// así que en Render no hace falta cambiar nada.
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Neon exige SSL. Para una base local sin SSL poné DB_SSL=false en tu .env
const usarSSL = process.env.DB_SSL !== 'false';

const opciones = {
  dialect: 'postgres',
  logging: false, // cambiá a console.log para ver las consultas SQL
  dialectOptions: usarSSL
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  // Neon (plan gratis) duerme la base y corta conexiones inactivas:
  // idle bajo + acquire largo evitan errores al "despertarla".
  pool: { max: 5, min: 0, acquire: 60000, idle: 10000 },
};

const sequelize = process.env.URL_NEON
  ? new Sequelize(process.env.URL_NEON, opciones)
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        ...opciones,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 5432,
      }
    );

module.exports = sequelize;
