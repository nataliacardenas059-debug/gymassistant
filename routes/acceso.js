const express = require('express');
const router = express.Router();
const db = require('../db');
/* =========================
   HORARIO ADMINISTRATIVOS
========================= */

function horarioAdministrativo() {

    const ahora = new Date();

    const hora = ahora.getHours();

    const minutos =
        ahora.getMinutes();

    const totalMin =
        (hora * 60) + minutos;

    // 12:00 - 13:00
    const bloque1 =
        totalMin >= 720 &&
        totalMin <= 780;

    // 17:00 - 18:00
    const bloque2 =
        totalMin >= 1020 &&
        totalMin <= 1080;

    return bloque1 || bloque2;
}

/* =========================================
   FUNCIÓN CENTRAL VALIDAR INGRESO
========================================= */
async function validarIngreso(documento) {

    return new Promise((resolve, reject) => {

        // BUSCAR USUARIO
        db.query(`
            SELECT *
            FROM personas
            WHERE numero_documento = ?
            AND estado = 'activo'
        `, [documento], (err, personas) => {

            if (err) return reject(err);

            if (personas.length === 0) {
                return resolve({
                    permitido: false,
                    mensaje: '❌ Usuario no encontrado'
                });
            }

            const user = personas[0];
            /* =========================
              BLOQUE HORARIO ADMIN
            ========================= */

            const ahora = new Date();

            const hora = ahora.getHours();

            const horarioAdministrativo =
                (hora >= 12 && hora < 13) ||
                (hora >= 17 && hora < 18);

            // SI NO ES ADMIN → BLOQUEAR
            if (

                horarioAdministrativo &&

                user.tipo_persona !== 'administrativo'

            ) {

                return resolve({

                    permitido: false,

                    mensaje:
                        '⛔ Horario exclusivo administrativos (12-1 y 5-6)'

                });
            }

            // VALIDAR AFORO
            db.query(`
                SELECT COUNT(*) AS total
                FROM registros_ingreso
                WHERE estado = 'dentro'
            `, (err, aforoResult) => {

                if (err) return reject(err);

                const aforo = aforoResult[0].total;

                if (aforo >= 30) {
                    return resolve({
                        permitido: false,
                        mensaje: '🚫 Gimnasio lleno',
                        aforo
                    });
                }

                // VALIDAR DOBLE INGRESO
                db.query(`
                    SELECT *
                    FROM registros_ingreso
                    WHERE persona_id = ?
                    AND estado = 'dentro'
                `, [user.id], (err, ingresoActivo) => {

                    if (err) return reject(err);

                    if (ingresoActivo.length > 0) {
                        return resolve({
                            permitido: false,
                            mensaje: '⚠️ Usuario ya está dentro'
                        });
                    }

                    // ADMINISTRATIVO
                    if (user.tipo_persona === 'administrativo') {

                        const permitidoHorario =
                            (hora >= 12 && hora < 13) ||
                            (hora >= 17 && hora < 18);

                        if (!permitidoHorario) {
                            return resolve({
                                permitido: false,
                                mensaje: '⏰ Solo permitido de 12-1 y 5-6'
                            });
                        }

                        return resolve({
                            permitido: true,
                            tipo: 'beneficio',
                            user,
                            mensaje: '✅ Acceso administrativo permitido'
                        });
                    }

                    // PROFESOR
                    if (user.tipo_persona === 'profesor') {

                        db.query(`
                            SELECT *
                            FROM profesores
                            WHERE persona_id = ?
                        `, [user.id], (err, profes) => {

                            if (err) return reject(err);

                            if (profes.length > 0) {

                                const profesor = profes[0];

                                // SOLO VINCULADOS
                                if (profesor.tipo_profesor === 'vinculado') {

                                    const semanaActual = obtenerSemanaActual();

                                    // REINICIAR SEMANA
                                    if (profesor.semana_control !== semanaActual) {

                                        db.query(`
                                            UPDATE profesores
                                            SET minutos_acumulados = 0,
                                                semana_control = ?
                                            WHERE persona_id = ?
                                        `, [semanaActual, user.id]);
                                    }

                                    if (profesor.minutos_acumulados >= 120) {

                                        // SI AGOTÓ BENEFICIO
                                        // VALIDAR SI TIENE MEMBRESÍA NORMAL

                                        return validarMembresia(
                                            user,
                                            resolve,
                                            reject
                                        );
                                    }

                                    return resolve({
                                        permitido: true,
                                        tipo: 'beneficio',
                                        user,
                                        profesor,
                                        mensaje: '✅ Profesor vinculado autorizado'
                                    });
                                }
                            }

                            // SI NO ES VINCULADO → VALIDAR MEMBRESÍA
                            validarMembresia(user, resolve, reject);
                        });

                        return;
                    }

                    // ESTUDIANTE → MEMBRESÍA
                    validarMembresia(user, resolve, reject);
                });
            });
        });
    });
}

/* =========================================
   VALIDAR MEMBRESÍA
========================================= */
function validarMembresia(user, resolve, reject) {

    db.query(`
        SELECT *
        FROM membresias
        WHERE persona_id = ?
        AND estado = 'activa'
        AND (
            (tipo = 'mensual'
                AND CURDATE() BETWEEN fecha_inicio AND fecha_fin)
            OR
            (tipo = 'chequera'
                AND dias_restantes > 0)
        )
        ORDER BY id DESC
        LIMIT 1
    `, [user.id], (err, membresias) => {

        if (err) return reject(err);

        if (membresias.length === 0) {
            return resolve({
                permitido: false,
                mensaje: '❌ No tiene membresía activa'
            });
        }

        return resolve({
            permitido: true,
            tipo: 'membresia',
            user,
            membresia: membresias[0],
            mensaje: '✅ Membresía válida'
        });
    });
}

/* =========================================
   OBTENER SEMANA
========================================= */
function obtenerSemanaActual() {

    const hoy = new Date();

    const inicio = new Date(hoy.getFullYear(), 0, 1);

    const dias = Math.floor((hoy - inicio) / 86400000);

    return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

/* =========================================
   CONSULTAR ACCESO
========================================= */
router.get('/consulta/:documento', async (req, res) => {

    try {

        const data = await validarIngreso(req.params.documento);

        res.json(data);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error servidor'
        });
    }
});

/* =========================================
   REGISTRAR INGRESO
========================================= */
router.post('/ingresar/:documento', async (req, res) => {

    try {

        const data = await validarIngreso(req.params.documento);

        if (!data.permitido) {
            return res.json(data);
        }

        const user = data.user;

        db.query(`
            INSERT INTO registros_ingreso
            (
                persona_id,
                fecha_hora,
                metodo_ingreso,
                estado
            )
            VALUES (?, NOW(), 'recepcion', 'dentro')
        `, [user.id], (err) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    mensaje: 'Error registrando ingreso'
                });
            }

            //  DESCONTAR CHEQUERA
            if (
                data.tipo === 'membresia' &&
                data.membresia.tipo === 'chequera'
            ) {

                db.query(`
                    UPDATE membresias
                    SET dias_restantes = dias_restantes - 1
                    WHERE id = ?
                `, [data.membresia.id]);
            }
            res.json({

                permitido: true,

                mensaje: `✅ Ingreso registrado`,

                user: {

                    id: user.id,

                    nombre: user.nombre_completo,

                    documento: user.numero_documento,

                    tipo: user.tipo_persona

                },

                acceso: {

                    tipo: data.tipo || "beneficio",

                    membresia:

                        data.membresia
                            ? data.membresia.tipo
                            : "Beneficio institucional",

                    dias_restantes:

                        data.membresia
                            ? data.membresia.dias_restantes
                            : null,

                    minutos_usados:

                        data.profesor
                            ? data.profesor.minutos_acumulados
                            : null,

                    minutos_disponibles:

                        data.profesor
                            ? 120 - data.profesor.minutos_acumulados
                            : null
                }
            });
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error servidor'
        });
    }
});

/* =========================================
   REGISTRAR SALIDA
========================================= */
router.post('/salida/:documento', (req, res) => {

    const documento = req.params.documento;

    db.query(`
        SELECT *
        FROM personas
        WHERE numero_documento = ?
    `, [documento], (err, personas) => {

        if (err) {
            return res.status(500).json({
                mensaje: 'Error servidor'
            });
        }

        if (personas.length === 0) {
            return res.json({
                permitido: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        const user = personas[0];


        db.query(`
            SELECT *
            FROM registros_ingreso
            WHERE persona_id = ?
            AND estado = 'dentro'
            ORDER BY id DESC
            LIMIT 1
        `, [user.id], (err, ingresos) => {

            if (err) {
                return res.status(500).json({
                    mensaje: 'Error servidor'
                });
            }

            if (ingresos.length === 0) {
                return res.json({
                    permitido: false,
                    mensaje: '⚠️ Usuario no tiene ingreso activo'
                });
            }

            const ingreso = ingresos[0];

            const entrada = new Date(ingreso.fecha_hora);

            const salida = new Date();

            const minutos = Math.floor(
                (salida - entrada) / 60000
            );

            db.query(`
                UPDATE registros_ingreso
                SET
                    hora_salida = NOW(),
                    tiempo_total = ?,
                    estado = 'finalizado'
                WHERE id = ?
            `, [minutos, ingreso.id], (err) => {

                if (err) {
                    return res.status(500).json({
                        mensaje: 'Error actualizando salida'
                    });
                }

                // SUMAR MINUTOS PROFESORES
                if (user.tipo_persona === 'profesor') {

                    db.query(`SELECT * FROM profesores WHERE persona_id = ? AND tipo_profesor = 'vinculado'
                     `, [user.id], (err, profesores) => {

                        if (
                            err ||
                            profesores.length === 0
                        ) {

                            return;
                        }

                        db.query(` UPDATE profesores
                            SET minutos_acumulados = minutos_acumulados + ?
                            WHERE persona_id = ?
                            `,
                            [minutos, user.id],
                            (err) => {

                                if (err) {

                                    console.error(
                                        "Error actualizando minutos:",
                                        err
                                    );
                                }
                            });
                    });
                }

                res.json({
                    permitido: true,
                    mensaje: `✅ Salida registrada (${minutos} min)`,
                    user: {

                        nombre: user.nombre_completo,

                        documento: user.numero_documento,

                        tipo: user.tipo_persona

                    }

                });
            });
        });
    });
});

/* =========================================
   AFORO ACTUAL
========================================= */

router.get('/aforo', (req, res) => {

    db.query(`

        SELECT COUNT(*) AS total
        FROM registros_ingreso
        WHERE estado = 'dentro'

    `, (err, result) => {

        if (err) {

            return res.status(500).json({

                mensaje: 'Error obteniendo aforo'

            });
        }

        res.json({

            total: result[0].total

        });
    });
});

//HISTORIAL USUARIOS
router.get('/historial/:id', (req, res) => {
    const id = req.params.id;
    db.query(
        `
        SELECT
            fecha_hora,
            fecha_salida,
            estado
        FROM registros_ingreso
        WHERE persona_id = ?
        ORDER BY fecha_hora DESC
        `,
        [id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    mensaje:
                        'Error obteniendo historial'
                });
            }
            res.json(result);
        }
    );
});

router.put('/salida/:id', (req, res) => {

    const id = req.params.id;

    db.query(

        `

        SELECT tipo_persona

        FROM personas

        WHERE id = ?

        `,

        [id],

        (err, result) => {

            if (err || !result.length) {

                return res.status(500).json({

                    mensaje:
                        'Usuario no encontrado'
                });
            }

            const tipo =
                result[0].tipo_persona;

            // ❌ ADMINISTRATIVOS

            if (tipo === 'administrativo') {

                return res.json({

                    mensaje:
                        'Los administrativos no registran salida'
                });
            }

            // 🔍 VALIDAR SI ESTÁ DENTRO

            db.query(
                `
                SELECT *
                FROM registros_ingreso
                WHERE
                    persona_id = ?
                    AND estado = 'dentro'
                    AND fecha_salida IS NULL
                ORDER BY id DESC
                LIMIT 1
                `,
                [id],
                (err2, registros) => {

                    if (err2) {

                        return res.status(500).json({

                            mensaje:
                                'Error validando salida'
                        });
                    }

                    // ❌ NO HAY SALIDA

                    if (!registros.length) {

                        return res.json({

                            mensaje:
                                'No hay salida pendiente por registrar'
                        });
                    }

                    // ✅ REGISTRAR SALIDA

                    db.query(
                        `
                     UPDATE registros_ingreso
                     SET estado = 'fuera',
                     fecha_salida = NOW()
                     WHERE
                     persona_id = ?
                     AND estado = 'dentro'
                     AND fecha_salida IS NULL
                     ORDER BY id DESC
                     LIMIT 1
                        `,

                        [registros[0].id],

                        (err3) => {

                            if (err3) {

                                console.error(err3);

                                return res.status(500).json({

                                    mensaje:
                                        'Error registrando salida'
                                });
                            }

                            res.json({

                                success: true,

                                mensaje:
                                    'Salida registrada correctamente'
                            });
                        }
                    );
                }
            );
        }
    );
});

module.exports = router;