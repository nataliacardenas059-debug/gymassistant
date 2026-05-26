const express = require('express');
const app = express();
const path = require('path');

const personasRoutes = require('./routes/personas');
const membresiasRoutes = require('./routes/membresias');
const authRoutes = require('./routes/auth');
const accesoRoutes = require('./routes/acceso');


app.use(express.json());

// rutas API
app.use('/api/personas', personasRoutes);
app.use('/api/membresias', membresiasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/acceso', accesoRoutes);
console.log("Acceso cargado");

// archivos estáticos (tu frontend)
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log("Servidor corriendo en puerto", PORT);
});
