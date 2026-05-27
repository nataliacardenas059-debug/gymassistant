let usuariosGlobal = [];

/* =========================
   MODULOS
========================= */

function mostrarModulo(id) {

    document.querySelectorAll(".modulo").forEach(modulo => {
        modulo.classList.remove("activo");
    });

    document.getElementById(id).classList.add("activo");

    document.querySelectorAll(".menu-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    event.target.classList.add("active");
}

/* =========================
   CARGAR USUARIOS
========================= */

async function cargarUsuarios() {

    try {

        const res = await fetch("/api/personas");
        const data = await res.json();

        usuariosGlobal = data;

        renderUsuarios(data);

    } catch (error) {

        console.error(error);
    }
}

/* =========================
   RENDER TABLA
========================= */

function renderUsuarios(lista) {

    const tabla = document.getElementById("tablaUsuarios");

    tabla.innerHTML = "";

    lista.forEach(u => {

        tabla.innerHTML += `
        
        <tr>

            <td>${u.nombre_completo}</td>

            <td>${u.numero_documento}</td>

            <td>${u.tipo_persona}</td>

            <td>${u.correo || "Sin correo"}</td>

            <td>${u.estado}</td>

            <td>

                <button onclick="editarUsuario(${u.id})">
                    Editar
                </button>

                <button 
                    class="btn-danger"
                    onclick="eliminarUsuario(${u.id})"
                >
                    Eliminar
                </button>

            </td>

        </tr>
        `;
    });
}

/* =========================
   FILTRAR
========================= */

function filtrarUsuarios() {

    const texto = document
        .getElementById("buscadorUsuarios")
        .value
        .toLowerCase();

    const filtrados = usuariosGlobal.filter(u => {

        return (
            u.nombre_completo.toLowerCase().includes(texto) ||
            u.numero_documento.includes(texto)
        );
    });

    renderUsuarios(filtrados);
}

/* =========================
   ELIMINAR
========================= */

async function eliminarUsuario(id) {

    const confirmar = confirm("¿Eliminar usuario del sistema?");

    if (!confirmar) return;

    try {

        const res = await fetch(`/api/personas/${id}`, {
            method: "DELETE"
        });

        const data = await res.json();

        alert(data.mensaje);

        cargarUsuarios();

    } catch (error) {

        console.error(error);
    }
}

/* =========================
   EDITAR
========================= */

let editandoId = null;

function abrirModalUsuario() {

    document
        .getElementById("modalUsuario")
        .classList.add("active");

    limpiarFormulario();

    cambiarCamposPersona();
}

function cerrarModalUsuario() {

    document
        .getElementById("modalUsuario")
        .classList.remove("active");
}

function cambiarCamposPersona() {

    const tipo = document.getElementById("tipoPersona").value;

    const divProfesor = document.getElementById("camposProfesor");

    if (tipo === "profesor") {

        divProfesor.style.display = "grid";

    } else {

        divProfesor.style.display = "none";
    }
}

function limpiarFormulario() {

    editandoId = null;

    document.getElementById("tituloModal").textContent =
        "Nuevo Usuario";

    document.getElementById("nombreCompleto").value = "";

    document.getElementById("numeroDocumento").value = "";

    document.getElementById("tipoDocumento").value = "CC";

    document.getElementById("tipoPersona").value = "estudiante";

    document.getElementById("tipoProfesor").value = "vinculado";

    document.getElementById("horasSemana").value = 0;
}

async function guardarUsuario() {

    try {

        const body = {

            nombre_completo:
                document.getElementById("nombreCompleto").value,

            numero_documento:
                document.getElementById("numeroDocumento").value,

            tipo_documento:
                document.getElementById("tipoDocumento").value,

            tipo_persona:
                document.getElementById("tipoPersona").value,

            tipo_profesor:
                document.getElementById("tipoProfesor").value,

            horas_semana:
                document.getElementById("horasSemana").value
        };

        let url = "/api/personas";
        let method = "POST";

        if (editandoId) {

            url = `/api/personas/${editandoId}`;

            method = "PUT";
        }

        const res = await fetch(url, {

            method,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(body)
        });

        const data = await res.json();

        alert(data.mensaje);

        cerrarModalUsuario();

        cargarUsuarios();

    } catch (error) {

        console.error(error);
    }
}

/* =========================
   CREAR MEMBRESIA
========================= */

async function crearMembresia() {
    try {

        const documento =
            document.getElementById("docMembresia").value;

        const personaRes =
            await fetch(`/api/personas/${documento}`);

        const persona = await personaRes.json();

        if (!persona) {

            return alert("Usuario no encontrado");
        }

        const formData = new FormData();

        formData.append("persona_id", persona.id);

        formData.append(
            "tipo",
            document.getElementById("tipoMembresia").value
        );

        formData.append(
            "fecha_inicio",
            document.getElementById("fechaInicio").value
        );

        formData.append(
            "dias",
            document.getElementById("diasChequera").value
        );

        const archivo =
            document.getElementById("comprobanteArchivo")
                .files[0];

        if (archivo) {

            formData.append("comprobante", archivo);
        }

        const res = await fetch("/api/membresias", {

            method: "POST",

            body: formData
        });

        const data = await res.json();

        alert(data.mensaje);

    } catch (error) {

        console.error(error);
    }
}
/* =========================
   CONSULTAR ACCESO
========================= */

async function consultarAcceso() {

    try {

        const documento = document.getElementById("docAcceso").value;

        const res = await fetch(`/api/acceso/consulta/${documento}`);

        const data = await res.json();

        const div = document.getElementById("resultadoAcceso");

        div.innerHTML = `
        
        <div class="resultado-card">

            <h2>${data.nombre || "Usuario"}</h2>

            <p>
                Documento:
                ${data.documento || ""}
            </p>

            <p>
                Tipo:
                ${data.tipo_persona || ""}
            </p>

            <p class="${data.permitido ? 'estado-ok' : 'estado-error'}">
                ${data.mensaje}
            </p>

            <button onclick="registrarIngreso('${documento}')">
                Registrar ingreso
            </button>

            <button 
                class="btn-danger"
                onclick="registrarSalida('${documento}')"
            >
                Registrar salida
            </button>

        </div>
        `;

    } catch (error) {

        console.error(error);
    }
}

/* =========================
   REGISTRAR INGRESO
========================= */

async function registrarIngreso(documento) {

    try {

        const res = await fetch(`/api/acceso/ingresar/${documento}`, {

            method: "POST"
        });

        const data = await res.json();

        alert(data.mensaje);

        consultarAcceso();

        cargarAforo();

    } catch (error) {

        console.error(error);
    }
}

/* =========================
   REGISTRAR SALIDA
========================= */

async function registrarSalida(documento) {

    try {

        const res = await fetch(`/api/acceso/salida/${documento}`, {

            method: "POST"
        });

        const data = await res.json();

        alert(data.mensaje);

        consultarAcceso();

        cargarAforo();

    } catch (error) {

        console.error(error);
    }
}

/* =========================
   AFORO
========================= */

async function cargarAforo() {

    try {

        const res = await fetch("/api/acceso/aforo");

        const data = await res.json();

        document.getElementById("aforoActual").textContent =
            data.dentro;

        document.getElementById("espaciosDisponibles").textContent =
            30 - data.dentro;

    } catch (error) {

        console.error(error);
    }
}

/* =========================
   SUBMODULOS MEMBRESIAS
========================= */

function mostrarSubModuloMembresia(tipo) {

    document
        .getElementById("subRegistrarMembresia")
        .classList.remove("activo-sub");

    document
        .getElementById("subConsultarMembresia")
        .classList.remove("activo-sub");

    if (tipo === "registrar") {

        document
            .getElementById("subRegistrarMembresia")
            .classList.add("activo-sub");

    } else {

        document
            .getElementById("subConsultarMembresia")
            .classList.add("activo-sub");

        cargarMembresias();
    }
}

/* =========================
   CARGAR MEMBRESIAS
========================= */

async function cargarMembresias() {

    try {

        const res = await fetch("/api/membresias");

        const data = await res.json();

        renderMembresias(data);

    } catch (error) {

        console.error(error);
    }
}

/* =========================
   RENDER MEMBRESIAS
========================= */

function renderMembresias(lista) {

    const tabla = document.getElementById("tablaMembresias");

    tabla.innerHTML = "";

    lista.forEach(m => {

        let estadoClase = "estado-vencida";

        if (
            m.estado === "activa" ||
            m.estado === "Beneficio activo"
        ) {

            estadoClase = "estado-activa";
        }

        tabla.innerHTML += `
        
        <tr>

            <td>${m.nombre_completo || "Sin usuario"}</td>

            <td>${m.tipo}</td>

            <td class="${estadoClase}">
                ${m.estado}
            </td>

            <td>
                ${formatearFecha(m.fecha_inicio)}
            </td>

            <td>
                ${formatearFecha(m.fecha_fin)}
            </td>

            <td>
                ${m.dias_restantes || 0}
            </td>

            <td>

                ${m.comprobante
                ?
                `
                    <a
                        href="/uploads/${m.comprobante}"
                        target="_blank"
                        class="comprobante-btn"
                    >
                        Ver archivo
                    </a>
                    `
                :
                "Sin archivo"
            }

            </td>

        </tr>
        `;
    });
}

/* =========================
   FORMATEAR FECHA
========================= */

function formatearFecha(fecha) {

    if (!fecha) return "N/A";

    return new Date(fecha)
        .toLocaleDateString("es-CO");
}

/* =========================
   INIT
========================= */

cargarUsuarios();

cargarAforo();