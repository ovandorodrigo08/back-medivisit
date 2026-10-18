// src/routes/usuarios.js
const express = require('express');
const router = express.Router();
const { Usuario } = require('../models');

// POST /api/usuarios/sync — crea o actualiza el usuario según su firebase_uid
router.post('/sync', async (req, res) => {
  const { firebaseUid, nombre, email } = req.body;

  if (!firebaseUid || !email) {
    return res.status(400).json({ error: 'firebaseUid y email son obligatorios' });
  }

  try {
    let usuario = await Usuario.findOne({ where: { firebase_uid: firebaseUid } });

    if (usuario) {
      await usuario.update({ nombre: nombre || null, email });
    } else {
      usuario = await Usuario.create({
        firebase_uid: firebaseUid,
        nombre: nombre || null,
        email,
      });
    }

    res.status(200).json(usuario);
  } catch (err) {
    console.error('POST /usuarios/sync error:', err.message);
    res.status(500).json({ error: 'Error al guardar usuario' });
  }
});

// GET /api/usuarios — listar todos
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nombre', 'email', 'fecha_registro'],
      order: [['fecha_registro', 'DESC']],
    });
    res.json(usuarios);
  } catch (err) {
    console.error('GET /usuarios error:', err.message);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;