// src/index.js
const setupDatabase = require('./src/db/schema');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const pacientesRouter = require('./src/routes/pacientes');
const visitasRouter = require('./src/routes/visitas');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ───────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({limit: '10mb'}));

// ── Rutas ─────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ mensaje: 'MediVisit API funcionando ✅', version: '1.0.0' });
});

app.use('/api/pacientes', pacientesRouter);
app.use('/api/visitas', visitasRouter);
app.use('/api/usuarios',require('./src/routes/usuarios'));

// ── Ruta no encontrada ────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.url} no encontrada` });
});

// ── Iniciar servidor ──────────────────────────
app.listen(PORT, async () => {
  await setupDatabase();
  console.log(`🚀 MediVisit backend corriendo en http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   GET    /api/pacientes`);
  console.log(`   POST   /api/pacientes`);
  console.log(`   PUT    /api/pacientes/:id`);
  console.log(`   DELETE /api/pacientes/:id`);
  console.log(`   GET    /api/visitas`);
  console.log(`   POST   /api/visitas`);
  console.log(`   PUT    /api/visitas/:id`);
  console.log(`   DELETE /api/visitas/:id`);
});
