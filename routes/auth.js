const express = require('express');
const router = express.Router();
const db = require('../db');

const ADMIN_CORREO = "admin@gymassistant.com";

router.post('/login', (req, res) => {
    const { correo } = req.body;

    if (!correo) {
        return res.status(400).json({ mensaje: 'Correo requerido' });
    }

    // 🔴 CASO ADMIN (ACCESO AL PANEL)
    if (correo === ADMIN_CORREO) {
        return res.json({
            id: 0,
            rol: "admin"
        });
    }

    // 🔵 CASO USUARIOS NORMALES
    db.query('SELECT * FROM personas WHERE correo = ?', [correo], (err, result) => {

        if (err) {
            return res.status(500).json({ mensaje: 'Error servidor' });
        }

        if (result.length === 0) {
            return res.json({ mensaje: 'Usuario no encontrado' });
        }

        const user = result[0];

        res.json({
            id: user.id,
            rol: "usuario"
        });
    });
});

module.exports = router;