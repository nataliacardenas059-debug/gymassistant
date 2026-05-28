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
function editarUsuario(id) {

    const usuario =
        usuariosGlobal.find(u => u.id === id);

    if (!usuario) return;

    editandoId = id;

    abrirModalUsuario("editar");

    document.getElementById("tituloModal").textContent =
        "Editar Usuario";

    document.getElementById("nombreCompleto").value =
        usuario.nombre_completo;

    document.getElementById("numeroDocumento").value =
        usuario.numero_documento;

    document.getElementById("tipoDocumento").value =
        usuario.tipo_documento;

    document.getElementById("tipoPersona").value =
        usuario.tipo_persona;

    cambiarCamposPersona();
}

let editandoId = null;

function abrirModalUsuario(modo = "crear") {

    document
        .getElementById("modalUsuario")
        .classList.add("active");

    if (modo === "crear") {

        limpiarFormulario();
        cambiarCamposPersona();
    }
}

function cerrarModalUsuario() {
    editandoId = null;
    document
        .getElementById("modalUsuario")
        .classList.remove("active");

}

function cambiarCamposPersona() {

    const tipo =
        document.getElementById("tipoPersona").value;

    const grupoProfesor =
        document.getElementById("grupoProfesor");

    if (tipo === "profesor") {

        grupoProfesor.style.display = "block";

    } else {

        grupoProfesor.style.display = "none";
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
                document.getElementById("tipoProfesor").value
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

        // TOTAL PERSONAS DENTRO
        document.getElementById("aforoActual").textContent =
            data.total;

        // ESPACIOS DISPONIBLES
        document.getElementById("espaciosDisponibles").textContent =
            30 - data.total;

        // ACTUALIZAR TAMBIEN EL MODULO DE ACCESO
        const aforoAcceso =
            document.getElementById("aforoAcceso");

        if (aforoAcceso) {

            aforoAcceso.innerText =
                `${data.total} / 30`;
        }

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

    const tabla =
        document.getElementById(
            "bodyMembresias"
        );

    tabla.innerHTML = "";

    lista.forEach(m => {

        let estadoTexto = m.estado;

        let estadoClase = "estado-vencida";

        // BENEFICIO
        if (m.tipo === "beneficio") {

            estadoTexto =
                "Beneficio activo";

            estadoClase =
                "estado-activa";
        }

        // ACTIVA NORMAL
        else if (m.estado === "activa") {

            estadoClase =
                "estado-activa";
        }

        tabla.innerHTML += `
        
        <tr>

            <td>
                ${m.nombre_completo || "Sin usuario"}
            </td>

            <td>
                ${m.tipo}
            </td>

            <td class="${estadoClase}">
                ${estadoTexto}
            </td>

            <td>
                ${formatearFecha(m.fecha_inicio)}
            </td>

            <td>
                ${m.tipo === "chequera" ? "Sin vencimiento" :
                formatearFecha(m.fecha_fin)
            }
            </td>

            <td>
              ${m.tipo === "mensual"
                ?
                calcularDiasRestantes(
                    m.fecha_fin
                ) + " días restantes"
                : m.tipo === "chequera"
                    ?
                    `${m.dias_restantes || 0} accesos disponibles`
                    :
                    "Ilimitado"
            }
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

function calcularDiasRestantes(fechaFin) {

    if (!fechaFin) return 0;

    const hoy = new Date();

    const fin = new Date(fechaFin);

    const diferencia =
        fin - hoy;

    const dias =
        Math.ceil(
            diferencia / (1000 * 60 * 60 * 24)
        );

    return dias > 0 ? dias : 0;
}

/* =========================
   CAMPOS MEMBRESIA
========================= */

function cambiarCamposMembresia() {

    const tipo =
        document.getElementById("tipoMembresia").value;

    const grupo =
        document.getElementById("grupoDiasChequera");

    if (tipo === "chequera") {

        grupo.style.display = "block";

    } else {

        grupo.style.display = "none";
    }
}
/* =========================
   MODULO ACCESO
========================= */

// REGISTRAR INGRESO
async function registrarIngreso() {

    const documento =
        document.getElementById("documentoAcceso").value;

    if (!documento) {

        alert("Ingrese documento");

        return;
    }

    try {

        const response = await fetch(

            `/api/acceso/ingresar/${documento}`,

            {
                method: "POST"
            }
        );

        const data = await response.json();

        mostrarResultado(data);

        actualizarAforo();

    } catch (error) {

        console.error(error);

        alert("Error servidor");
    }
}


// REGISTRAR SALIDA
async function registrarSalida() {

    const documento =
        document.getElementById("documentoAcceso").value;

    if (!documento) {

        alert("Ingrese documento");

        return;
    }

    try {

        const response = await fetch(

            `/api/acceso/salida/${documento}`,

            {
                method: "POST"
            }
        );

        const data = await response.json();

        mostrarResultado(data);

        actualizarAforo();

    } catch (error) {

        console.error(error);

        alert("Error servidor");
    }
}


// MOSTRAR RESULTADO
function mostrarResultado(data) {

    const box =
        document.getElementById("resultadoAcceso");

    box.classList.remove(
        "resultado-ok",
        "resultado-error"
    );

    // COLORES
    if (data.permitido) {

        box.classList.add("resultado-ok");

    } else {

        box.classList.add("resultado-error");
    }

    // HTML
    box.innerHTML = `

        <div class="resultado-info">

            <h2>
                ${data.mensaje}
            </h2>

            ${data.user
            ? `

                    <p>
                        <strong>Nombre:</strong>
                        ${data.user.nombre}
                    </p>

                    <p>
                        <strong>Documento:</strong>
                        ${data.user.documento}
                    </p>

                    <p>
                        <strong>Tipo:</strong>
                        ${data.user.tipo}
                    </p>

                `
            : ''
        }

            ${data.acceso
            ? `

                    <hr>

                    <p>
                        <strong>Acceso:</strong>
                        ${data.acceso.tipo}
                    </p>

                    <p>
                        <strong>Membresía:</strong>
                        ${data.acceso.membresia}
                    </p>

                    ${data.acceso.dias_restantes !== null
                ? `
                            <p>
                                <strong>Días restantes:</strong>
                                ${data.acceso.dias_restantes}
                            </p>
                        `
                : ''
            }

                    ${data.acceso.minutos_usados !== null
                ? `
                            <p>
                                <strong>Minutos usados:</strong>
                                ${data.acceso.minutos_usados}
                            </p>

                            <p>
                                <strong>Minutos disponibles:</strong>
                                ${data.acceso.minutos_disponibles}
                            </p>
                        `
                : ''
            }

                `
            : ''
        }

        </div>
    `;
}

document.getElementById(
    "documentoAcceso"
).value = "";

/* =========================================
   ACTUALIZAR AFORO
========================================= */

async function actualizarAforo() {

    try {

        const response =
            await fetch('/api/acceso/aforo');

        const data =
            await response.json();

        document.getElementById(
            "aforoAcceso"
        ).innerText = `${data.total} / 30`;

    } catch (error) {

        console.error(
            "Error actualizando aforo:",
            error
        );
    }
}

function filtrarMembresias() {

    const filtro =

        document.getElementById(
            "buscarMembresia"
        ).value.toLowerCase();

    const filas =

        document.querySelectorAll(
            "#tablaMembresias tbody tr"
        );

    filas.forEach(fila => {

        const texto =
            fila.innerText.toLowerCase();

        fila.style.display =

            texto.includes(filtro)

                ? ""

                : "none";
    });
}

function cerrarSesion() {

    localStorage.removeItem("token");

    window.location.href = "index.html";
}


/* =========================================
   CARGAR AFORO INICIAL
========================================= */

actualizarAforo();
setInterval(() => {

    cargarAforo();

}, 3000);

/* =========================
   INIT
========================= */

cargarUsuarios();

cargarAforo();

cambiarCamposMembresia();

cambiarCamposPersona();

// CARGAR AFORO AL ENTRAR
actualizarAforo();