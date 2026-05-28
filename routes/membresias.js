const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');

/* =========================
   MULTER
========================= */

const storage = multer.diskStorage({

    destination: 'uploads/',

    filename: (req, file, cb) => {

        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({

    storage,

    fileFilter: (req, file, cb) => {

        const tipos = [

            "image/jpeg",
            "image/png",
            "application/pdf"
        ];

        if (tipos.includes(file.mimetype)) {

            cb(null, true);

        } else {

            cb(new Error("Archivo no permitido"));
        }
    }
});

function actualizarEstadoMembresias() {
    db.query(`
        UPDATE membresias
        SET estado = 
            CASE
                WHEN tipo = 'mensual' 
                     AND fecha_inicio <= CURDATE() 
                     AND fecha_fin >= CURDATE() 
                THEN 'activa'

                WHEN tipo = 'chequera' 
                     AND dias_restantes > 0 
                THEN 'activa'

                ELSE 'inactiva'
            END
    `, (err) => {
        if (err) console.error("Error actualizando estados:", err);
    });
}


router.get('/historial/:id', (req, res) => {

    const id = req.params.id;

    db.query(`
        SELECT fecha_hora, metodo_ingreso
        FROM registros_ingreso
        WHERE persona_id = ?
        ORDER BY fecha_hora DESC
        LIMIT 10
    `, [id], (err, result) => {

        if (err) return res.status(500).json({ mensaje: 'Error' });

        res.json(result);
    });
});

/* ================== LISTAR MEMBRESIAS ================== */
router.get('/', (req, res) => {

    actualizarEstadoMembresias();

    db.query(`
    
        SELECT
        
            m.*,

            p.nombre_completo,
            p.numero_documento,
            p.tipo_persona,

            CASE

                WHEN m.tipo = 'mensual'
                     AND CURDATE()
                     BETWEEN m.fecha_inicio
                     AND m.fecha_fin

                THEN 'activa'

                WHEN m.tipo = 'chequera'
                     AND m.dias_restantes > 0

                THEN 'activa'

                ELSE 'vencida'

            END AS estado

         FROM membresias m
         INNER JOIN (
           SELECT
        persona_id,
        MAX(id) AS ultima_membresia FROM membresias
        GROUP BY persona_id) ultimas ON m.id = ultimas.ultima_membresia 
        INNER JOIN personas p ON p.id = m.persona_id
        ORDER BY m.id DESC
        `, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                mensaje: 'Error al obtener membresías'
            });
        }

        res.json(results);
    });
});

/* ================== CREAR ================== */
router.post('/', upload.single('comprobante'), (req, res) => {
    actualizarEstadoMembresias(); // 
    const {
        persona_id,
        tipo,
        fecha_inicio,
        dias
    } = req.body;

    const comprobante = req.file
        ? req.file.filename
        : null;

    db.query(`
        SELECT * FROM membresias 
        WHERE persona_id = ?
        AND estado = 'activa'
        AND (
            (tipo = 'mensual' AND CURDATE() BETWEEN fecha_inicio AND fecha_fin)
            OR
            (tipo = 'chequera' AND dias_restantes > 0)
        )
    `, [persona_id], (err, activa) => {

        if (err) return res.status(500).json({ mensaje: 'Error servidor' });

        if (activa.length > 0) {
            return res.json({ mensaje: '⚠️ Ya tiene una membresía activa' });
        }

        if (tipo === 'mensual') {
            db.query(`
            INSERT INTO membresias ( persona_id,
            tipo,
            fecha_inicio,
            fecha_fin, 
            estado,
            comprobante)VALUES (?,'mensual',?,DATE_ADD(?, INTERVAL 30 DAY),'activa',?)
            `, [persona_id, fecha_inicio, fecha_inicio, comprobante], (err) => {

                if (err) return res.status(500).json({ mensaje: 'Error' });

                res.json({ mensaje: 'Membresía mensual creada (30 días)' });
            });
        }

        else if (tipo === 'chequera') {
            db.query(` INSERT INTO membresias (
                 persona_id,
                 tipo,
                  fecha_inicio,
                   fecha_fin,
                   dias_restantes,
                   estado,
                   comprobante) VALUES (?,'chequera',?,NULL,?,'activa',?)
               `, [persona_id, fecha_inicio, fecha_inicio, dias, comprobante], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        mensaje: 'Error'
                    });
                }
                res.json({
                    mensaje: `Chequera creada con ${dias} días`
                });
            });
        }
    });
});

/* ================== CONSULTA ================== */
router.get('/consulta/:documento', (req, res) => {
    actualizarEstadoMembresias(); // 🔥 ACTUALIZA ESTADO
    const doc = req.params.documento;

    db.query(`
        SELECT 
            p.id,
            p.nombre_completo,
            p.numero_documento,
            p.tipo_persona,
            m.id AS membresia_id,
            m.fecha_inicio,
            m.fecha_fin,
            CASE 
                WHEN m.id IS NULL THEN 'Sin membresía'
                WHEN CURDATE() BETWEEN m.fecha_inicio AND m.fecha_fin THEN 'Activa'
                ELSE 'Inactiva'
            END AS estado
        FROM personas p
        LEFT JOIN membresias m ON p.id = m.persona_id
        WHERE p.numero_documento = ?
        ORDER BY m.fecha_fin DESC
    `, [doc], (err, result) => {

        if (err) return res.status(500).json({ mensaje: 'Error en la consulta' });

        res.json(result);
    });
});

/* ================== VER POR ID ================== */
router.get('/:id', (req, res) => {
    const id = req.params.id;

    db.query(`
        SELECT 
        id,
        tipo,
        fecha_inicio,
        fecha_fin,
        dias_restantes,
        comprobante,
        CASE 
         WHEN tipo = 'mensual' AND CURDATE() BETWEEN fecha_inicio AND fecha_fin THEN 'Activa'
         WHEN tipo = 'chequera' AND dias_restantes > 0 THEN 'Activa'
         ELSE 'Inactiva'
       END AS estado
     FROM membresias
     WHERE persona_id = ?
     ORDER BY fecha_fin DESC
     LIMIT 1
    `, [id], (err, result) => {

        if (err) return res.status(500).json({ mensaje: 'Error' });

        if (result.length === 0) {
            return res.json({ mensaje: 'Sin membresía' });
        }

        res.json(result[0]);
    });
});

/* ================== INGRESO ================== */
router.post('/ingreso/:documento', (req, res) => {
    actualizarEstadoMembresias();

    const doc = req.params.documento;

    db.query('SELECT * FROM personas WHERE numero_documento = ?', [doc], (err, result) => {

        if (err) return res.status(500).json({ mensaje: 'Error servidor' });
        if (result.length === 0) return res.json({ mensaje: 'Usuario no encontrado' });

        const user = result[0];

        db.query(`
        SELECT * FROM membresias 
        WHERE persona_id = ?
        AND (
            (tipo = 'mensual' AND fecha_inicio <= CURDATE() AND fecha_fin >= CURDATE())
            OR
            (tipo = 'chequera' AND dias_restantes > 0)
        )
    `, [user.id], (err, membresias) => {

            if (err) return res.status(500).json({ mensaje: 'Error servidor' });
            if (membresias.length === 0) return res.json({ mensaje: 'No tiene membresía activa' });

            const membresia = membresias[0];
            const hoy = new Date();

            const fechaFin =
                new Date(membresia.fecha_fin);

            const diferencia =
                fechaFin - hoy;

            const diasRestantes =
                Math.ceil(
                    diferencia /
                    (1000 * 60 * 60 * 24)
                );

            membresia.dias_restantes =
                diasRestantes > 0
                    ? diasRestantes
                    : 0;

            membresia.estado =
                membresia.dias_restantes > 0
                    ? "Activa"
                    : "Vencida";

            db.query(`
                SELECT * FROM registros_ingreso
                WHERE persona_id = ?
                AND DATE(fecha_hora) = CURDATE()
            `, [user.id], (err, ingresosHoy) => {

                if (err) return res.status(500).json({ mensaje: 'Error ingresos' });

                if (ingresosHoy.length > 0) {
                    return res.json({ mensaje: `⚠️ ${user.nombre_completo} ya ingresó hoy` });
                }

                if (membresia.tipo === 'chequera') {
                    db.query(`
                        UPDATE membresias 
                        SET dias_restantes = dias_restantes - 1
                        WHERE id = ?
                    `, [membresia.id]);
                }

                db.query(`
                    INSERT INTO registros_ingreso (persona_id, fecha_hora, metodo_ingreso)
                    VALUES (?, NOW(), 'recepcion')
                `, [user.id], (err) => {

                    if (err) return res.status(500).json({ mensaje: 'Error al registrar ingreso' });

                    res.json({ mensaje: `Ingreso registrado: ${user.nombre_completo}` });
                });
            });
        });
    });
});

/* ================== SUBIR COMPROBANTE ================== */
router.post('/comprobante/:id', upload.single('comprobante'), (req, res) => {

    if (!req.file) {
        return res.status(400).json({ mensaje: 'No se envió archivo' });
    }

    const file = req.file.filename;
    const id = req.params.id;

    db.query(`
        UPDATE membresias SET comprobante = ? WHERE id = ?
    `, [file, id], (err) => {

        if (err) return res.status(500).json({ mensaje: 'Error' });

        res.json({ mensaje: 'Comprobante cargado' });
    });
});

module.exports = router;