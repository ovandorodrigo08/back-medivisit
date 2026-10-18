// src/routes/pacientes.js
const express = require('express');
const router = express.Router();
const { Paciente } = require('../models');

// Mapear columnas snake_case → camelCase para el frontend
function mapPaciente(p) {
  return {
    id: p.id,
    nombre: p.nombre,
    documento: p.documento,
    fechaNacimiento: p.fecha_nacimiento || '',
    genero: p.genero,
    sangre: p.sangre,
    telefono: p.telefono,
    email: p.email,
    direccion: p.direccion,
    habitacion: p.habitacion,
    cama: p.cama,
    alergias: p.alergias,
    notas: p.notas,
  };
}

// Convierte el body del frontend (camelCase) a columnas de la tabla
function datosPaciente(body) {
  const { nombre, documento, fechaNacimiento, genero, sangre,
          telefono, email, direccion, habitacion, cama, alergias, notas } = body;
  return {
    nombre,
    documento,
    fecha_nacimiento: fechaNacimiento || null,
    genero,
    sangre,
    telefono,
    email,
    direccion,
    habitacion,
    cama,
    alergias,
    notas,
  };
}

// ¿Violó una restricción UNIQUE? (documento, email o teléfono repetido)
function esDuplicado(err) {
  return err.name === 'SequelizeUniqueConstraintError' ||
         (err.parent && err.parent.code === '23505');
}

// GET /api/pacientes — listar todos
router.get('/', async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({ order: [['created_at', 'DESC']] });
    res.json(pacientes.map(mapPaciente));
  } catch (err) {
    console.error('GET /pacientes error:', err.message);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
});

// GET /api/pacientes/:id — obtener uno
router.get('/:id', async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(mapPaciente(paciente));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener paciente' });
  }
});

// POST /api/pacientes — crear
router.post('/', async (req, res) => {
  const { nombre, documento, direccion } = req.body;

  if (!nombre || !documento || !direccion) {
    return res.status(400).json({ error: 'nombre, documento y direccion son obligatorios' });
  }

  try {
    const creado = await Paciente.create(datosPaciente(req.body));
    // Se vuelve a leer para devolver exactamente lo que quedó guardado en la base
    const paciente = await Paciente.findByPk(creado.id);
    res.status(201).json(mapPaciente(paciente));
  } catch (err) {
    if (esDuplicado(err)) {
      return res.status(400).json({ error: 'Ya existe un paciente con ese documento o gmail o telefono. prueba cambiar esos datos' });
    }
    console.error('POST /pacientes error:', err.message);
    res.status(500).json({ error: 'Error al crear paciente' });
  }
});

// PUT /api/pacientes/:id — actualizar
router.put('/:id', async (req, res) => {
  const { nombre, documento, direccion } = req.body;

  if (!nombre || !documento || !direccion) {
    return res.status(400).json({ error: 'nombre, documento y direccion son obligatorios' });
  }

  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

    await paciente.update(datosPaciente(req.body));
    res.json({ mensaje: 'Paciente actualizado', id: req.params.id });
  } catch (err) {
    console.error('PUT /pacientes error:', err.message);
    res.status(500).json({ error: 'Error al actualizar paciente' });
  }
});

// DELETE /api/pacientes/:id — eliminar
router.delete('/:id', async (req, res) => {
  try {
    const borrados = await Paciente.destroy({ where: { id: req.params.id } });
    if (borrados === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json({ mensaje: 'Paciente eliminado', id: req.params.id });
  } catch (err) {
    console.error('DELETE /pacientes error:', err.message);
    res.status(500).json({ error: 'Error al eliminar paciente' });
  }
});

module.exports = router;