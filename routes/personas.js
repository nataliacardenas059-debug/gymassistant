const express = require('express');
const router = express.Router();
const db = require('../db');

// 🔹 FUNCIÓN PARA GENERAR CORREO
function generarCorreo(nombreCompleto, numeroDocumento, tipoPersona) {
    const partes = nombreCompleto.toLowerCase().split(" ");

    let nombre = partes[0];
    let apellido = partes[1] || "";

    // profesor → solo inicial del nombre
    if (tipoPersona === "profesor") {
        nombre = nombre.charAt(0);
    }

    const ultimos = numeroDocumento.slice(-3);

    return `${nombre}${apellido}${ultimos}@pascualbravo.edu.co`;
}

// LISTAR PERSONAS
router.get('/', (req, res) => {
    db.query("SELECT * FROM personas WHERE estado = 'activo'"
        , (err, results) => {
            if (err) return res.status(500).json({ mensaje: 'Error al obtener personas' });
            res.json(results);
        });
});

// CREAR PERSONA
router.post('/', (req, res) => {

    const {
        nombre_completo,
        numero_documento,
        tipo_documento,
        tipo_persona,
        tipo_profesor,
        horas_semana
    } = req.body;

    const sql = `
        INSERT INTO personas 
        (nombre_completo, numero_documento, tipo_documento, tipo_persona, estado)
        VALUES (?, ?, ?, ?, 'activo')
    `;

    db.query(sql, [nombre_completo, numero_documento, tipo_documento, tipo_persona], (err, result) => {

        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ mensaje: 'El documento ya está registrado' });
            }
            return res.status(500).json({ mensaje: 'Error al crear persona' });
        }

        const personaId = result.insertId;

        // 🔥 SI ES PROFESOR → INSERTAR EN OTRA TABLA
        if (tipo_persona === "profesor") {

            db.query(`
                INSERT INTO profesores 
                (persona_id, tipo_profesor, horas_semana, cumple_horas)
                VALUES (?, ?, ?, false)
            `, [personaId, tipo_profesor, horas_semana || 0], (err) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({ mensaje: 'Error al guardar profesor' });
                }

                return res.json({ mensaje: 'Profesor registrado correctamente' });
            });

        } else {
            res.json({ mensaje: 'Persona creada correctamente' });
        }
    });
});

// ELIMINAR (LÓGICO)
router.put('/eliminar/:id', (req, res) => {
    const id = req.params.id;

    db.query(
        "UPDATE personas SET estado = 'inactivo' WHERE id = ?",
        [id],
        (err) => {
            if (err) return res.status(500).json({ mensaje: 'Error' });

            res.json({ mensaje: 'Usuario eliminado' });
        }
    );
});

// BUSCAR POR DOCUMENTO
router.get('/:documento', (req, res) => {
    const doc = req.params.documento;

    db.query(
        'SELECT * FROM personas WHERE numero_documento = ?',
        [doc],
        (err, result) => {
            if (err) return res.status(500).json({ mensaje: 'Error en la búsqueda' });

            if (result.length === 0) {
                return res.json(null);
            }

            res.json(result[0]);
        }
    );
});

// ELIMINAR USUARIO COMPLETO (CONDICIONES)
router.delete('/:id', (req, res) => {

    const id = req.params.id;

    // 1. validar membresía activa
    db.query(`
        SELECT * FROM membresias
        WHERE persona_id = ?
        AND (
            (tipo = 'mensual' AND CURDATE() BETWEEN fecha_inicio AND fecha_fin)
            OR
            (tipo = 'chequera' AND dias_restantes > 0)
        )
    `, [id], (err, membresias) => {

        if (err) return res.status(500).json({ mensaje: 'Error servidor' });

        if (membresias.length > 0) {
            return res.json({
                mensaje: '❌ No se puede eliminar: tiene membresía activa'
            });
        }

        // 2. validar última asistencia (6 meses)
        db.query(`
            SELECT 
                MAX(fecha_hora) AS ultima
            FROM registros_ingreso
            WHERE persona_id = ?
        `, [id], (err, result) => {

            if (err) return res.status(500).json({ mensaje: 'Error servidor' });

            const ultima = result[0].ultima;

            if (ultima) {
                const fechaUltima = new Date(ultima);
                const hoy = new Date();

                const diffMeses = (hoy - fechaUltima) / (1000 * 60 * 60 * 24 * 30);

                if (diffMeses < 6) {
                    return res.json({
                        mensaje: '⚠️ No se puede eliminar: usuario activo recientemente'
                    });
                }
            }

            // 3. eliminar registros primero (FK)
            db.query(`DELETE FROM registros_ingreso WHERE persona_id = ?`, [id]);

            db.query(`DELETE FROM membresias WHERE persona_id = ?`, [id]);

            // 4. eliminar persona
            db.query(`DELETE FROM personas WHERE id = ?`, [id], (err) => {

                if (err) return res.status(500).json({ mensaje: 'Error al eliminar' });

                res.json({ mensaje: '✅ Usuario eliminado correctamente' });
            });
        });
    });
});

module.exports = router;