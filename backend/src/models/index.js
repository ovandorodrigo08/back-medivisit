// src/models/index.js
// Modelos Sequelize. Los nombres de columnas son EXACTAMENTE los de las
// tablas que ya existen en Neon (snake_case), por eso no se pierde ningún dato.
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../db/sequelize');

const ahora = Sequelize.literal('NOW()');

// ── pacientes ─────────────────────────────────
const Paciente = sequelize.define(
  'Paciente',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    documento: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    fecha_nacimiento: DataTypes.DATEONLY,
    genero: DataTypes.STRING(20),
    sangre: DataTypes.STRING(5),
    telefono: { type: DataTypes.STRING(30), unique: true },
    email: { type: DataTypes.STRING(100), unique: true },
    direccion: { type: DataTypes.STRING(200), allowNull: false },
    habitacion: DataTypes.STRING(10),
    cama: DataTypes.STRING(5),
    alergias: DataTypes.TEXT,
    notas: DataTypes.TEXT,
    created_at: { type: DataTypes.DATE, defaultValue: ahora },
  },
  { tableName: 'pacientes', timestamps: false }
);

// ── visitas ───────────────────────────────────
const Visita = sequelize.define(
  'Visita',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_nombre: { type: DataTypes.STRING(150), allowNull: false },
    nombre_visitante: { type: DataTypes.STRING(100), allowNull: false },
    apellido_visitante: { type: DataTypes.STRING(100), allowNull: false },
    dni: { type: DataTypes.STRING(20), allowNull: false },
    telefono: DataTypes.STRING(30),
    domicilio: { type: DataTypes.STRING(200), allowNull: false },
    parentesco: DataTypes.STRING(50),
    fecha: DataTypes.DATEONLY,
    hora_ingreso: DataTypes.TIME,
    hora_salida: DataTypes.TIME,
    tipo: { type: DataTypes.STRING(20), defaultValue: 'Temporal' },
    observaciones: DataTypes.TEXT,
    foto: DataTypes.TEXT, // URL de Cloudinary
    created_at: { type: DataTypes.DATE, defaultValue: ahora },
  },
  { tableName: 'visitas', timestamps: false }
);

// ── usuarios (Firebase) ───────────────────────
const Usuario = sequelize.define(
  'Usuario',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    firebase_uid: { type: DataTypes.STRING, allowNull: false, unique: true },
    nombre: DataTypes.STRING,
    email: { type: DataTypes.STRING, allowNull: false },
    fecha_registro: { type: DataTypes.DATE, defaultValue: ahora },
  },
  { tableName: 'usuarios', timestamps: false }
);

module.exports = { sequelize, Paciente, Visita, Usuario };
