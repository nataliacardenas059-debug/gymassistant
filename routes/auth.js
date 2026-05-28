const express = require('express');
const router = express.Router();
const db = require('../db');

const ADMIN_CORREO = "admin@gymassistant.com";
const ADMIN_PASSWORD = "123456";

router.post('/login', (req, res) => {

    const { correo, password } = req.body;

    if (!correo) {

        return res.status(400).json({
            mensaje: 'Correo requerido'
        });
    }

    // 🔴 ADMIN
    if (
        correo === ADMIN_CORREO
        &&
        password === ADMIN_PASSWORD
    ) {

        return res.json({

            id: 0,

            rol: "admin"
        });
    }

    // 🔵 USUARIOS
    db.query(

        'SELECT * FROM personas WHERE correo = ?',

        [correo],

        (err, result) => {

            if (err) {

                return res.status(500).json({

                    mensaje:
                        'Error servidor'
                });
            }

            if (result.length === 0) {

                return res.json({

                    mensaje:
                        'Usuario no encontrado'
                });
            }

            const user = result[0];

            // 🟡 PRIMER INGRESO
            // NO TIENE CONTRASEÑA

            if (!user.password) {

                return res.json({

                    primerIngreso: true,

                    id: user.id,

                    rol: "usuario"
                });
            }

            // 🔴 VALIDAR PASSWORD

            if (user.password !== password) {

                return res.json({

                    mensaje:
                        'Contraseña incorrecta'
                });
            }

            // ✅ LOGIN NORMAL

            res.json({

                id: user.id,

                rol: "usuario"
            });
        }
    );
});

// CREAR CONTRASEÑA
router.post('/crear-password', (req, res) => {

    const {

        id,
        password

    } = req.body;

    if (!password) {

        return res.json({

            mensaje:
                'Contraseña requerida'
        });
    }

    db.query(

        `

        UPDATE personas

        SET password = ?

        WHERE id = ?

        `,

        [password, id],

        (err) => {

            if (err) {

                return res.status(500).json({

                    mensaje:
                        'Error guardando contraseña'
                });
            }

            res.json({

                success: true
            });
        }
    );
});

module.exports = router;