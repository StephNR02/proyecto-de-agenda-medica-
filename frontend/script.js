// SIMULACIÓN DE DATOS 
let citasData = [
    { id: 1, paciente: "LARISSA VIEIRA", fecha: "2025-11-23", hora_inicio: "10:00", hora_fin: "10:30", observaciones: "Láser AOI", estado: "confirmada" },
    { id: 2, paciente: "GLORIA FLORES", fecha: "2025-11-23", hora_inicio: "11:00", hora_fin: "11:30", observaciones: "Retoque 006", estado: "pendiente" },
    { id: 3, paciente: "HÉCTOR GARCÍA", fecha: "2025-11-23", hora_inicio: "12:00", hora_fin: "12:45", observaciones: "Consulta", estado: "completada" },
    { id: 4, paciente: "MARÍA PÉREZ", fecha: "2025-11-24", hora_inicio: "09:30", hora_fin: "10:00", observaciones: "Revisión", estado: "cancelada" },
    // Citas de ejemplo para la vista de SEMANA y MES
    { id: 5, paciente: "ANTONIO SILVA", fecha: "2025-11-27", hora_inicio: "14:00", hora_fin: "14:30", observaciones: "Limpieza", estado: "pendiente" },
    { id: 6, paciente: "JUANA LÓPEZ", fecha: "2025-12-10", hora_inicio: "09:00", hora_fin: "09:30", observaciones: "Cirugía Menor", estado: "confirmada" },
];

const contenedorCitas = document.getElementById('citas-container');
const modal = document.getElementById('modal');
const formulario = document.getElementById('formulario-cita');
const cerrarModalBtn = document.querySelector('.cerrar-modal');
const fechaSelector = document.getElementById('fecha-selector');
const btnHoy = document.getElementById('btn-hoy');
const btnNuevaCita = document.getElementById('btn-nueva-cita');
const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

// NUEVOS ELEMENTOS Y VARIABLES DE ESTADO PARA LAS VISTAS
const botonesVista = document.querySelectorAll('.btn-vista');
const calendarioDiaContainer = document.getElementById('calendario-dia-container');
const multiDayContainer = document.getElementById('multi-day-container');
let currentView = 'day'; // Estado actual: 'day', 'week', 'month'

// Rellenar fecha-selector con la fecha actual por defecto (2025-11-23 en la simulación)
const hoy = new Date();
const anio = hoy.getFullYear();
const mes = String(hoy.getMonth() + 1).padStart(2, '0');
const dia = String(hoy.getDate()).padStart(2, '0');
const fechaHoy = `${anio}-${mes}-${dia}`;
fechaSelector.value = fechaHoy;


// --- FUNCIONES DE LÓGICA DE FECHAS ---

// Convierte 'YYYY-MM-DD' a objeto Date (Maneja el offset de zona horaria)
function parseDate(dateString) {
    const parts = dateString.split('-');
    // Usamos UTC para prevenir problemas de zona horaria y mantener el día correcto
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])); 
}

// Formatea objeto Date a 'YYYY-MM-DD'
function formatDate(dateObj) {
    const anio = dateObj.getUTCFullYear();
    const mes = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

// Devuelve el rango de fechas para la semana (Lunes a Domingo)
function getWeekDateRange(dateString) {
    const today = parseDate(dateString);
    // getUTCDay() da 0 para Domingo, 1 para Lunes. Queremos que Lunes sea el inicio.
    // dayOfWeek = 0 (Lunes) a 6 (Domingo)
    const dayOfWeek = (today.getUTCDay() === 0) ? 6 : today.getUTCDay() - 1; 
    
    // Calcula el inicio de la semana (Lunes)
    const startOfWeek = new Date(today);
    startOfWeek.setUTCDate(today.getUTCDate() - dayOfWeek);

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setUTCDate(startOfWeek.getUTCDate() + i);
        dates.push(formatDate(d));
    }
    return dates;
}

// Devuelve el rango de fechas para el mes
function getMonthDateRange(dateString) {
    const today = parseDate(dateString);
    const anio = today.getUTCFullYear();
    const mes = today.getUTCMonth(); 
    
    const startOfMonth = new Date(Date.UTC(anio, mes, 1));
    const endOfMonth = new Date(Date.UTC(anio, mes + 1, 0)); 

    const dates = [];
    let current = startOfMonth;
    while (current <= endOfMonth) {
        dates.push(formatDate(current));
        // Avanza al siguiente día de forma segura
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
}

// Lógica de posición vertical (se mantiene para la vista de día)
function calcularPosicionYAltura(inicio, fin) {
    const alturaBloqueMinuto = 1; 
    const minutosInicioAgenda = 9 * 60; 
    
    const totalMinutosInicio = (parseInt(inicio.split(':')[0]) * 60) + parseInt(inicio.split(':')[1]);
    const totalMinutosFin = (parseInt(fin.split(':')[0]) * 60) + parseInt(fin.split(':')[1]);
    
    const top = (totalMinutosInicio - minutosInicioAgenda) * alturaBloqueMinuto;
    const height = (totalMinutosFin - totalMinutosInicio) * alturaBloqueMinuto;
    
    return { 
        top: top + 'px', 
        height: height + 'px' 
    };
}

function incrementarHora(hora, minutos) {
    const [h, m] = hora.split(':').map(Number);
    const totalMinutos = (h * 60) + m + minutos;
    const nuevaH = Math.floor(totalMinutos / 60);
    const nuevaM = totalMinutos % 60;
    return `${String(nuevaH).padStart(2, '0')}:${String(nuevaM).padStart(2, '0')}`;
}

// --- FUNCIONES DE RENDERIZADO POR VISTA ---

// 1. Renderiza la vista de DÍA (Grilla de Citas)
function renderizarVistaDia(fecha) {
    calendarioDiaContainer.style.display = 'grid'; 
    multiDayContainer.style.display = 'none';

    contenedorCitas.innerHTML = ''; 
    const horaInicioAgenda = 9; 
    const horaFinAgenda = 15;
    const intervaloMinutos = 30; 

    // Generar bloques de fondo
    for (let h = horaInicioAgenda; h < horaFinAgenda; h++) {
        for (let m = 0; m < 60; m += intervaloMinutos) {
            const horaActual = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const bloqueFondo = document.createElement('div');
            bloqueFondo.classList.add('horario-fondo-bloque');
            bloqueFondo.setAttribute('data-hora', horaActual);
            bloqueFondo.addEventListener('click', (e) => {
                abrirModal({ id: null, paciente: '', fecha: fechaSelector.value, hora_inicio: horaActual, hora_fin: incrementarHora(horaActual, 30), observaciones: '', estado: 'pendiente' });
            });
            contenedorCitas.appendChild(bloqueFondo);
        }
    }
    
    // Renderizar citas superpuestas
    const citasDelDia = citasData.filter(cita => cita.fecha === fecha);

    citasDelDia.forEach(cita => {
        const { top, height } = calcularPosicionYAltura(cita.hora_inicio, cita.hora_fin);

        const citaElemento = document.createElement('div');
        citaElemento.classList.add('cita', `estado-${cita.estado}`);
        citaElemento.style.top = top;
        citaElemento.style.height = height;
        citaElemento.setAttribute('data-id', cita.id);

        citaElemento.innerHTML = `
            <div class="cita-header">
                <strong>${cita.hora_inicio} - ${cita.hora_fin}</strong>
                <div class="cita-acciones">
                    <button class="btn-completar" title="Marcar como Completada"><i class="fas fa-check-circle"></i></button>
                    <button class="btn-cancelar" title="Cancelar Cita"><i class="fas fa-times-circle"></i></button>
                </div>
            </div>
            <span>${cita.paciente}</span>
            <small>${cita.observaciones}</small>
        `;
        
        citaElemento.addEventListener('click', (e) => {
            if (!e.target.closest('.cita-acciones')) { 
                abrirModal(cita);
            }
        });

        citaElemento.querySelector('.btn-completar').addEventListener('click', (e) => {
            e.stopPropagation();
            actualizarEstadoCita(cita.id, 'completada', fecha);
        });
        citaElemento.querySelector('.btn-cancelar').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`¿Estás seguro de que quieres cancelar la cita de ${cita.paciente}?`)) {
                actualizarEstadoCita(cita.id, 'cancelada', fecha);
            }
        });

        contenedorCitas.appendChild(citaElemento);
    });
}

// 2. Renderiza la vista de SEMANA/MES (Lista Agrupada)
function renderizarVistaMultiDia(dates) {
    calendarioDiaContainer.style.display = 'none';
    multiDayContainer.style.display = 'block';

    multiDayContainer.innerHTML = `<h2>Citas Agendadas (${currentView.toUpperCase()})</h2>`;

    // Obtener todas las citas que caen en el rango de fechas
    const citasEnRango = citasData
        .filter(cita => dates.includes(cita.fecha))
        .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio));

    if (citasEnRango.length === 0) {
        multiDayContainer.innerHTML += '<p style="padding-left: 20px; color: #555;">No hay citas agendadas en este periodo.</p>';
        return;
    }
    
    // Agrupar citas por fecha
    const citasAgrupadas = citasEnRango.reduce((acc, cita) => {
        const date = cita.fecha;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(cita);
        return acc;
    }, {});

    for (const [dateString, citas] of Object.entries(citasAgrupadas)) {
        // Formatear el encabezado del día
        const diaSemana = parseDate(dateString).toLocaleDateString('es-ES', { weekday: 'long' });
        const fechaFormateada = parseDate(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        
        multiDayContainer.innerHTML += `
            <h3>${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${fechaFormateada}</h3>
        `;

        citas.forEach(cita => {
            const item = document.createElement('div');
            item.classList.add('cita-list-item', `estado-${cita.estado}`);
            item.innerHTML = `
                <div>
                    <strong>${cita.hora_inicio} - ${cita.hora_fin}</strong>
                    <span style="font-weight: 500;"> | ${cita.paciente}</span>
                    <small style="color: #6c757d;"> (${cita.observaciones})</small>
                </div>
                <button class="btn-editar-lista" data-id="${cita.id}" title="Editar Cita"><i class="fas fa-edit"></i></button>
            `;
            
            // Adjuntar el evento de editar
            item.querySelector('.btn-editar-lista').addEventListener('click', (e) => {
                e.stopPropagation(); 
                const citaId = parseInt(e.target.closest('.btn-editar-lista').getAttribute('data-id'));
                const citaAEditar = citasData.find(c => c.id === citaId);
                if (citaAEditar) abrirModal(citaAEditar);
            });

            multiDayContainer.appendChild(item);
        });
    }
}

// 3. Función de renderizado principal que maneja la vista
function renderizarCitasPrincipal(fecha) {
    if (currentView === 'day') {
        renderizarVistaDia(fecha);
    } else if (currentView === 'week') {
        const dates = getWeekDateRange(fecha);
        renderizarVistaMultiDia(dates);
    } else if (currentView === 'month') {
        const dates = getMonthDateRange(fecha);
        renderizarVistaMultiDia(dates);
    }
    // Asegurar que el selector de fecha muestre la fecha principal de la vista
    fechaSelector.value = fecha;
}

// --- LÓGICA DE BOTONES DE VISTA ---

botonesVista.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. Actualizar el estado de la vista
        currentView = btn.getAttribute('data-vista');

        // 2. Actualizar las clases CSS de los botones
        botonesVista.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 3. Renderizar la vista actual
        renderizarCitasPrincipal(fechaSelector.value);
    });
});


// --- EVENTOS DE FECHA Y BARRA SUPERIOR ---

// Iniciar con la vista de día actual
renderizarCitasPrincipal(fechaSelector.value); 

// Evento para cambiar la fecha
fechaSelector.addEventListener('change', (e) => {
    renderizarCitasPrincipal(e.target.value);
});

// Botón "Hoy"
btnHoy.addEventListener('click', () => {
    fechaSelector.value = fechaHoy;
    renderizarCitasPrincipal(fechaSelector.value);
});

// Botón "Nueva Cita"
btnNuevaCita.addEventListener('click', () => {
    abrirModal({
        id: null,
        paciente: '',
        fecha: fechaSelector.value,
        hora_inicio: '10:00',
        hora_fin: '10:30',
        observaciones: '',
        estado: 'pendiente'
    });
});

// Botón "Salir" (Cerrar Sesión)
btnCerrarSesion.addEventListener('click', () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        window.location.href = 'login.html'; 
    }
});


// --- LÓGICA DEL MODAL ---

function abrirModal(cita) {
    document.getElementById('cita_id').value = cita.id || '';
    document.getElementById('paciente').value = cita.paciente || '';
    document.getElementById('fecha').value = cita.fecha || fechaSelector.value;
    document.getElementById('hora_inicio').value = cita.hora_inicio || '10:00';
    document.getElementById('hora_fin').value = cita.hora_fin || '10:30';
    document.getElementById('observaciones').value = cita.observaciones || '';
    document.getElementById('estado').value = cita.estado || 'pendiente';
    
    modal.style.display = 'flex';
}

cerrarModalBtn.onclick = () => {
    modal.style.display = 'none';
    formulario.reset();
};

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
        formulario.reset();
    }
};

// Actualizar estado cita necesita re-renderizar la vista actual
function actualizarEstadoCita(idCita, nuevoEstado, fechaActual) {
    const index = citasData.findIndex(c => c.id === idCita);
    if (index > -1) {
        citasData[index].estado = nuevoEstado;
        alert(`Cita #${idCita} marcada como ${nuevoEstado.toUpperCase()} (SIMULADO)`);
        renderizarCitasPrincipal(fechaActual);
    }
}

// Manejo del formulario
formulario.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {
        // Aseguramos que el id es único para citas nuevas
        id: document.getElementById('cita_id').value ? parseInt(document.getElementById('cita_id').value) : Date.now(),
        paciente: document.getElementById('paciente').value,
        fecha: document.getElementById('fecha').value,
        hora_inicio: document.getElementById('hora_inicio').value,
        hora_fin: document.getElementById('hora_fin').value,
        observaciones: document.getElementById('observaciones').value,
        estado: document.getElementById('estado').value,
    };
    
    if (data.hora_inicio >= data.hora_fin) {
        alert("❌ Error de Validación: La Hora de Fin debe ser posterior a la Hora de Inicio.");
        return; 
    }

    // SIMULACIÓN DE GUARDADO
    if (document.getElementById('cita_id').value) {
        const index = citasData.findIndex(c => c.id === data.id);
        if (index > -1) {
            citasData[index] = data;
        }
        alert("✅ Cita modificada (SIMULADO)");
    } else {
        citasData.push(data);
        alert("✅ Cita reservada (SIMULADO)");
    }
    
    modal.style.display = 'none';
    formulario.reset();
    // Renderiza la vista actual después de guardar, usando la fecha de la cita
    renderizarCitasPrincipal(data.fecha); 
});