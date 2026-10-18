// src/routes/visitas.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const path = require('path');
const { Visita } = require('../models');
const cloudinary = require('../config/cloudinary');

// Helper: mapea fila DB → objeto frontend
function mapVisita(v) {
  return {
    id: v.id,
    paciente: v.paciente_nombre,
    nombreVisitante: v.nombre_visitante,
    apellidoVisitante: v.apellido_visitante,
    dni: v.dni,
    telefono: v.telefono,
    domicilio: v.domicilio,
    parentesco: v.parentesco,
    fecha: v.fecha || '',
    horaIngreso: v.hora_ingreso || '',
    horaSalida: v.hora_salida || '',
    tipo: v.tipo,
    observaciones: v.observaciones || '',
    foto: v.foto || '',
  };
}

// Convierte el body del frontend (camelCase) a columnas de la tabla
function datosVisita(body) {
  const { paciente, nombreVisitante, apellidoVisitante, dni, telefono,
    domicilio, parentesco, fecha, horaIngreso, horaSalida, tipo, observaciones } = body;
  return {
    paciente_nombre: paciente,
    nombre_visitante: nombreVisitante,
    apellido_visitante: apellidoVisitante,
    dni,
    telefono: telefono || null,
    domicilio,
    parentesco: parentesco || null,
    fecha: fecha || null,
    hora_ingreso: horaIngreso || null,
    hora_salida: horaSalida || null,
    tipo: tipo || 'Temporal',
    observaciones: observaciones || null,
  };
}

// Fecha local → 'YYYY-MM-DD'. (toISOString() convierte a UTC y corre un día
// cuando el servidor no está en UTC, por ejemplo en tu compu en Argentina.)
const aISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function getLunes(dateStr) {
  const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const dia = date.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(date);
  lunes.setDate(date.getDate() + diff);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

function getDomingo(lunes) {
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  return domingo;
}

// Visitas entre el lunes y el domingo de una semana, ordenadas por fecha y hora
async function visitasDeLaSemana(lunes, domingo) {
  const desde = aISO(lunes);
  const hasta = aISO(domingo);

  const filas = await Visita.findAll({
    where: { fecha: { [Op.between]: [desde, hasta] } },
    order: [['fecha', 'ASC'], ['hora_ingreso', 'ASC']],
  });
  return filas.map(mapVisita);
}

// GET /api/visitas — listar todas
router.get('/', async (req, res) => {
  try {
    const visitas = await Visita.findAll({ order: [['created_at', 'DESC']] });
    res.json(visitas.map(mapVisita));
  } catch (err) {
    console.error('GET /visitas error:', err.message);
    res.status(500).json({ error: 'Error al obtener visitas' });
  }
});

// GET /api/visitas/informe-semanal — ⚠️ tiene que ir ANTES de /:id
router.get('/informe-semanal', async (req, res) => {
  try {
    const lunes = getLunes(req.query.inicio);
    const domingo = getDomingo(lunes);

    const visitas = await visitasDeLaSemana(lunes, domingo);
    const pacientesUnicos = new Set(visitas.map(v => v.paciente)).size;

    res.json({
      fechaInicio: aISO(lunes),
      fechaFin: aISO(domingo),
      totalVisitas: visitas.length,
      pacientesUnicos,
      visitas,
    });
  } catch (err) {
    console.error('GET /visitas/informe-semanal error:', err.message);
    res.status(500).json({ error: 'Error al generar informe semanal' });
  }
});

// GET /api/visitas/informe-semanal/pdf — ⚠️ también ANTES de /:id
router.get('/informe-semanal/pdf', async (req, res) => {
  try {
    const lunes = getLunes(req.query.inicio);
    const domingo = getDomingo(lunes);

    const visitas = await visitasDeLaSemana(lunes, domingo);
    const pacientesUnicos = new Set(visitas.map(v => v.paciente)).size;

    const formatFecha = (iso) => {
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    };

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=informe-semanal-${aISO(lunes)}.pdf`
    );
    doc.pipe(res);

    const logoPath = path.join(__dirname, '../assets/logo.jpeg');
    try {
      doc.image(logoPath, 40, 35, { width: 55 });
    } catch (e) {
      console.warn('No se pudo cargar el logo:', e.message);
    }

    doc.fontSize(14).fillColor('#0c447c').text('Hospital Luis A. Güemes', 105, 40);
    doc.fontSize(10).fillColor('#4a4a4a').text('MediVisit - Informe semanal de visitas', 105, 58);
    doc.moveTo(40, 100).lineTo(555, 100).strokeColor('#185fa5').lineWidth(2).stroke();

    doc.fontSize(10).fillColor('#4a4a4a')
      .text(`Semana: ${formatFecha(aISO(lunes))} - ${formatFecha(aISO(domingo))}`, 40, 112)
      .text(`Generado: ${formatFecha(aISO(new Date()))}`, 400, 112);

    doc.fontSize(11).fillColor('#0c447c')
      .text(`Visitas totales: ${visitas.length}`, 40, 135)
      .text(`Pacientes distintos: ${pacientesUnicos}`, 250, 135);

    let y = 165;
    const col = { paciente: 40, visitante: 190, fecha: 340, ingreso: 420, tipo: 490 };

    doc.rect(40, y, 515, 20).fill('#185fa5');
    doc.fontSize(10).fillColor('#ffffff')
      .text('Paciente', col.paciente + 5, y + 5)
      .text('Visitante', col.visitante + 5, y + 5)
      .text('Fecha', col.fecha + 5, y + 5)
      .text('Ingreso', col.ingreso + 5, y + 5)
      .text('Tipo', col.tipo + 5, y + 5);
    y += 20;

    visitas.forEach((v, i) => {
      if (y > 780) {
        doc.addPage();
        y = 40;
      }
      if (i % 2 === 0) doc.rect(40, y, 515, 20).fill('#f7f7f7');
      doc.fillColor('#1a1a1a').fontSize(9)
        .text(v.paciente, col.paciente + 5, y + 6, { width: 145 })
        .text(`${v.nombreVisitante} ${v.apellidoVisitante}`, col.visitante + 5, y + 6, { width: 145 })
        .text(formatFecha(v.fecha), col.fecha + 5, y + 6, { width: 75 })
        .text(v.horaIngreso || '-', col.ingreso + 5, y + 6, { width: 65 })
        .text(v.tipo, col.tipo + 5, y + 6, { width: 60 });
      y += 20;
    });

    if (visitas.length === 0) {
      doc.fontSize(10).fillColor('#6b6b6b').text('Sin visitas registradas esta semana.', 40, y + 10);
    }

    doc.fontSize(8).fillColor('#9a9a9a')
      .text('Documento generado automáticamente por MediVisit', 40, 800, { align: 'center', width: 515 });

    doc.end();
  } catch (err) {
    console.error('GET /visitas/informe-semanal/pdf error:', err.message);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
});

// GET /api/visitas/:id — obtener una
router.get('/:id', async (req, res) => {
  try {
    const visita = await Visita.findByPk(req.params.id);
    if (!visita) return res.status(404).json({ error: 'Visita no encontrada' });
    res.json(mapVisita(visita));
  } catch (err) {
    console.error('GET /visitas/:id error:', err.message);
    res.status(500).json({ error: 'Error al obtener visita' });
  }
});

// POST /api/visitas — crear
router.post('/', async (req, res) => {
  const { paciente, nombreVisitante, apellidoVisitante, dni,
    domicilio, fecha, tipo, foto } = req.body;

  if (!paciente || !nombreVisitante || !apellidoVisitante || !dni || !domicilio) {
    return res.status(400).json({ error: 'paciente, nombre, apellido, dni y domicilio son obligatorios' });
  }

  try {
    // Un paciente no puede tener dos visitas el mismo día
    if (fecha) {
      const visitaExistente = await Visita.findOne({
        where: { paciente_nombre: paciente, fecha },
        attributes: ['id'],
      });

      if (visitaExistente) {
        return res.status(400).json({
          error: `Este paciente ya tiene una visita registrada para esa fecha.`
        });
      }
    }

    // Máximo 2 visitantes por tipo (Permanente / Temporal) por paciente
    if (tipo === 'Permanente' || tipo === 'Temporal') {
      const total = await Visita.count({
        where: { paciente_nombre: paciente, tipo },
      });

      if (total >= 2) {
        return res.status(400).json({
          error: tipo === 'Permanente'
            ? 'Máximo permitido: 2 visitantes por paciente.'
            : 'Máximo permitido: 2 visitantes temporales por paciente.'
        });
      }
    }

    // ── Subir la foto a Cloudinary (si vino una) ──
    let fotoUrl = null;
    if (foto) {
      try {
        const resultadoUpload = await cloudinary.uploader.upload(foto, {
          folder: 'medivisit',
        });
        fotoUrl = resultadoUpload.secure_url;
      } catch (errCloud) {
        console.error('Error al subir foto a Cloudinary:', errCloud.message);
      }
    }

    const creada = await Visita.create({ ...datosVisita(req.body), foto: fotoUrl });
    // Se vuelve a leer para devolver exactamente lo que quedó guardado en la base
    const visita = await Visita.findByPk(creada.id);
    res.status(201).json(mapVisita(visita));
  } catch (err) {
    console.error('POST /visitas error:', err.message);
    res.status(500).json({ error: 'Error al crear visita' });
  }
});

// PUT /api/visitas/:id — actualizar
router.put('/:id', async (req, res) => {
  const { paciente, nombreVisitante, apellidoVisitante, dni, domicilio, foto } = req.body;

  if (!paciente || !nombreVisitante || !apellidoVisitante || !dni || !domicilio) {
    return res.status(400).json({ error: 'paciente, nombre, apellido, dni y domicilio son obligatorios' });
  }

  try {
    const visita = await Visita.findByPk(req.params.id);
    if (!visita) return res.status(404).json({ error: 'Visita no encontrada' });

    const datos = datosVisita(req.body);
    // El formulario de edición no manda la foto: solo se cambia si viene una nueva.
    // (Antes, editar una visita borraba su foto.)
    if (foto) datos.foto = foto;

    await visita.update(datos);
    res.json({ mensaje: 'Visita actualizada', id: req.params.id });
  } catch (err) {
    console.error('PUT /visitas error:', err.message);
    res.status(500).json({ error: 'Error al actualizar visita' });
  }
});

// DELETE /api/visitas/:id — eliminar
router.delete('/:id', async (req, res) => {
  try {
    const borradas = await Visita.destroy({ where: { id: req.params.id } });
    if (borradas === 0) return res.status(404).json({ error: 'Visita no encontrada' });
    res.json({ mensaje: 'Visita eliminada', id: req.params.id });
  } catch (err) {
    console.error('DELETE /visitas error:', err.message);
    res.status(500).json({ error: 'Error al eliminar visita' });
  }
});

module.exports = router;