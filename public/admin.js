// 🔹 REGISTRAR PERSONA
document.getElementById("formPersona").addEventListener("submit", async (e) => {
    e.preventDefault();
    const tipoPersona = document.getElementById("tipo_persona").value;

    const data = {
        nombre_completo: document.getElementById("nombre").value,
        numero_documento: document.getElementById("documento").value,
        tipo_documento: document.getElementById("tipo_doc").value,
        tipo_persona: tipoPersona
    };

    if (tipoPersona === "profesor") {
        data.tipo_profesor = document.getElementById("tipo_profesor").value;
        data.horas_semana = parseInt(document.getElementById("horas_semana").value) || 0;
    }

    const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const result = await res.json();
    alert("✅ " + result.mensaje);

    document.getElementById("formPersona").reset();
});


// 🔹 LISTAR USUARIOS
async function cargarUsuarios() {

    const res = await fetch("/api/personas");
    const data = await res.json();

    const contenedor = document.getElementById("listaUsuarios");
    contenedor.innerHTML = "";

    data.forEach(u => {
        contenedor.innerHTML += `
                <div style="margin-top:10px; padding:10px; background:#2c2c2c; border-radius:8px;">
        <strong>${u.nombre_completo}</strong><br>
        Documento: ${u.numero_documento}<br>
        Tipo: ${u.tipo_persona}
    </div>
            `;
    });
}


// 🔹 BUSCAR USUARIO PARA MEMBRESÍA
async function buscarUsuario() {
    const doc = document.getElementById("buscar_doc").value;

    if (!doc) {
        mostrarToast(result.mensaje);
        return;
    }

    const res = await fetch(`/api/personas/${doc}`);
    const data = await res.json();

    if (!data || !data.id) {
        mostrarToast(result.mensaje);;
        return;
    }

    document.getElementById("persona_id").value = data.id;
    document.getElementById("nombre_usuario").innerText = data.nombre_completo;
}


// 🔹 GUARDAR MEMBRESÍA
async function guardarMembresia() {

    const data = {
        persona_id: document.getElementById("persona_id").value,
        tipo: document.getElementById("tipo_membresia").value,
        fecha_inicio: document.getElementById("fecha_inicio").value,
        dias: document.getElementById("dias").value
    };

    const res = await fetch("/api/membresias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.mensaje);
}


// 🔹 CONSULTAR USUARIO
async function consultarUsuario() {
    const doc = document.getElementById("doc_consulta").value;

    if (!doc) return mostrarToast("Ingresa documento");

    const res = await fetch(`/api/membresias/consulta/${doc}`);
    const data = await res.json();

    const contenedor = document.getElementById("resultadoConsulta");
    contenedor.innerHTML = "";

    if (!data.length) {
        contenedor.innerHTML = `<p class="empty">No se encontró información</p>`;
        return;
    }

    data.forEach(d => {

        let estadoClase = "estado-warning";

        if (d.estado === "Activa") estadoClase = "estado-activa";
        if (d.estado === "Inactiva") estadoClase = "estado-inactiva";

        contenedor.innerHTML += `
    <div class="card-estado">
        <p><strong>${d.nombre_completo}</strong></p>
        <p>Documento: ${d.numero_documento}</p>
        <p>Tipo: ${d.tipo_persona}</p>

        <span class="badge ${estadoClase}">
            ${d.estado}
        </span>
    </div>
    `;
    });
}

//Dashboard
async function cargarDashboard() {
    const res = await fetch("/api/personas");
    const usuarios = await res.json();

    document.getElementById("totalUsuarios").innerText = usuarios.length;

    const res2 = await fetch("/api/membresias");
    const membresias = await res2.json();

    const hoy = new Date();

    const activas = membresias.filter(m => {
        return new Date(m.fecha_inicio) <= hoy && new Date(m.fecha_fin) >= hoy;
    });

    document.getElementById("membresiasActivas").innerText = activas.length;
}

//Toast
function mostrarToast(msg) {
    const toast = document.getElementById("toast");

    toast.innerText = msg;
    toast.style.display = "block";

    setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}

//Filtrar Usuarios
let usuariosGlobal = [];

async function cargarUsuarios() {
    const res = await fetch("/api/personas");
    const data = await res.json();

    const contenedor = document.getElementById("listaUsuarios");
    contenedor.innerHTML = "";

    data.forEach(u => {
        contenedor.innerHTML += `
        <div class="usuario-card">
            <p><strong>${u.nombre_completo}</strong></p>
            <p>${u.numero_documento} - ${u.tipo_persona}</p>

            <button onclick="eliminarUsuario(${u.id}, '${u.nombre_completo}', '${u.numero_documento}')">
                Eliminar
            </button>
        </div>
        `;
    });
}

function renderUsuarios(lista) {
    const contenedor = document.getElementById("listaUsuarios");
    contenedor.innerHTML = "";

    lista.forEach(u => {
        contenedor.innerHTML += `
        <div class="usuario-card">
            <strong>${u.nombre_completo}</strong><br>
            ${u.numero_documento} - ${u.tipo_persona}   
            <button class="boton-eliminar" 
            onclick="eliminarUsuario(${u.id}, '${u.nombre_completo}', '${u.numero_documento}')">
                Eliminar
            </button>
        </div>
        `;
    });
}

function filtrarUsuarios() {
    const texto = document.getElementById("buscador").value.toLowerCase();

    const filtrados = usuariosGlobal.filter(u =>
        u.nombre_completo.toLowerCase().includes(texto) ||
        u.numero_documento.includes(texto)
    );

    renderUsuarios(filtrados);
}

//modo
function toggleModo() {
    document.body.classList.toggle("light");
}

// ELIMINAR USUARIO
async function eliminarUsuario(id, nombre, documento) {

    const confirmar = confirm(`¿Eliminar a ${nombre}?\nDocumento: ${documento}`);

    if (!confirmar) return;

    const res = await fetch(`/api/personas/${id}`, {
        method: "DELETE"
    });

    const data = await res.json();

    mostrarToast(data.mensaje);

    cargarUsuarios();
}

// REGISTRAR INGRESO
async function registrarIngreso() {
    const doc = document.getElementById("doc_ingreso").value;

    if (!doc) return mostrarToast("Ingresa documento");

    try {
        const res = await fetch(`/api/membresias/ingreso/${doc}`, {
            method: "POST"
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje);

        mostrarToast(data.mensaje);

    } catch (error) {
        mostrarToast(error.message);
    }
}
//descontar dias
function toggleDias() {
    const tipo = document.getElementById("tipo_membresia").value;
    document.getElementById("dias").style.display =
        tipo === "chequera" ? "block" : "none";
}

function toggleMenu() {
    document.querySelector(".sidebar").classList.toggle("active");
}

//Mostrar secciones
function mostrar(seccion, btn) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(seccion).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 🔥 CERRAR MENÚ AUTOMÁTICO
    document.querySelector('.sidebar').classList.remove('active');

    if (seccion === "dashboard") {
        cargarDashboard();
    }
}

//Subir comprobante
async function subirComprobante() {
    const fileInput = document.getElementById("file");
    const membresiaId = document.getElementById("persona_id").value;

    if (!fileInput.files.length) return mostrarToast("Selecciona archivo");

    const formData = new FormData();
    formData.append("comprobante", fileInput.files[0]);

    try {
        const res = await fetch(`/api/membresias/comprobante/${membresiaId}`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje);

        mostrarToast("Comprobante subido");

    } catch (error) {
        mostrarToast(error.message);
    }
}

//profesor
function mostrarCamposProfesor() {
    const tipo = document.getElementById("tipo_persona").value;
    const div = document.getElementById("camposProfesor");

    div.style.display = tipo === "profesor" ? "block" : "none";
}
