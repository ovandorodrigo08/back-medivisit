// src/db/schema.js
// Prueba la conexión y crea las tablas que FALTEN a partir de los modelos.
// sequelize.sync() sin opciones nunca borra ni modifica tablas existentes.
// ⚠️ No uses sync({ force: true }) ni sync({ alter: true }) con la base real.
const sequelize = require('./sequelize');
require('../models'); // registra los modelos antes de hacer sync()

const setupDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL correctamente');
    await sequelize.sync();
    console.log('✅ Tablas verificadas/creadas correctamente');
  } catch (err) {
    console.error('❌ Error de base de datos:', err.message);
    console.error('   Verificá las variables de entorno (URL_NEON o DB_*).');
  }
};

module.exports = setupDatabase;
