const express = require('express');
const router = express.Router();
const db = require('../db');

// FUNCIÓN PARA GENERAR CORREO
function limpiarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

function generarCorreo(nombreCompleto, numeroDocumento, tipoPersona) {
    const limpio = limpiarTexto(nombreCompleto);
    const partes = limpio.split(" ");

    let nombre = partes[0] || "";
    let apellido = partes[1] || "";

    if (tipoPersona === "profesor") {
        nombre = nombre.charAt(0);
    }

    const ultimos = numeroDocumento.slice(-3);

    return `${nombre}.${apellido}${ultimos}@pascualbravo.edu.co`;
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
    } = req.body;

    // GENERAR CORREO
    const correo = generarCorreo(nombre_completo, numero_documento, tipo_persona);

    const sql = `
        INSERT INTO personas 
        (nombre_completo, numero_documento, tipo_documento, tipo_persona, correo, estado)
        VALUES (?, ?, ?, ?, ?, 'activo')
    `;

    db.query(sql, [nombre_completo, numero_documento, tipo_documento, tipo_persona, correo], (err, result) => {

        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ mensaje: 'El documento ya está registrado' });
            }
            return res.status(500).json({ mensaje: 'Error al crear persona' });
        }

        const personaId = result.insertId;
        /* =====================================
           MEMBRESÍA AUTOMÁTICA ADMINISTRATIVOS
        ===================================== */
        if (tipo_persona === "administrativo") {
            db.query(`INSERT INTO membresias (
                persona_id,
                tipo,
                fecha_inicio,
                fecha_fin,
                estado) VALUES ( ?,'beneficio',
                CURDATE(),
                DATE_ADD(CURDATE(), INTERVAL 100 YEAR),'activa' )
             `, [personaId], (err) => {
                if (err) {
                    console.error(
                        "Error creando beneficio administrativo:",
                        err
                    );
                }
            });
        }

        // SI ES PROFESOR
        if (tipo_persona === "profesor") {

            const minutosAsignados =

                tipo_profesor === "vinculado"

                    ? 120

                    : 0;

            db.query(` INSERT INTO profesores (
                persona_id, tipo_profesor, horas_semana, cumple_horas)
                VALUES (?,?,?,false)
                `, [personaId, tipo_profesor, minutosAsignados], (err) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({ mensaje: 'Error al guardar profesor' });
                }

                return res.json({ mensaje: 'Profesor registrado correctamente', correo });
            });

        } else {
            res.json({ mensaje: 'Persona creada correctamente', correo });
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

    // VALIDAR MEMBRESÍAS
    db.query(`

        SELECT *
        FROM membresias
        WHERE persona_id = ?

    `, [id], (err, membresias) => {

        if (err) {

            return res.status(500).json({

                mensaje: 'Error validando membresías'
            });
        }

        // SI TIENE MEMBRESÍAS O BENEFICIOS
        if (membresias.length > 0) {

            return res.json({

                permitido: false,

                mensaje:
                    '❌ No se puede eliminar: el usuario tiene membresías o beneficios'
            });
        }

        // VALIDAR INGRESOS
        db.query(`

            SELECT *
            FROM registros_ingreso
            WHERE persona_id = ?

        `, [id], (err, ingresos) => {

            if (err) {

                return res.status(500).json({

                    mensaje: 'Error validando historial'
                });
            }

            // SI TIENE HISTORIAL
            if (ingresos.length > 0) {

                return res.json({

                    permitido: false,

                    mensaje:
                        '❌ No se puede eliminar: el usuario tiene historial de ingresos'
                });
            }

            // ELIMINAR
            db.query(`

                DELETE FROM personas
                WHERE id = ?

            `, [id], (err) => {

                if (err) {

                    return res.status(500).json({

                        mensaje: 'Error eliminando usuario'
                    });
                }

                res.json({

                    permitido: true,

                    mensaje: '✅ Usuario eliminado correctamente'
                });
            });
        });
    });
});

/* =========================
   EDITAR USUARIO
========================= */

router.put('/:id', (req, res) => {

    const id = req.params.id;

    const {
        nombre_completo,
        numero_documento,
        tipo_documento,
        tipo_persona
    } = req.body;

    db.query(`
    
        UPDATE personas
        SET
            nombre_completo = ?,
            numero_documento = ?,
            tipo_documento = ?,
            tipo_persona = ?
        WHERE id = ?
    
    `, [

        nombre_completo,
        numero_documento,
        tipo_documento,
        tipo_persona,
        id

    ], (err) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                mensaje: 'Error al actualizar usuario'
            });
        }

        res.json({
            mensaje: '✅ Usuario actualizado correctamente'
        });
    });
});

module.exports = router;