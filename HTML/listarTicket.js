/*---
Función para procesar los parámetros recibidos en el URL (mantenida por compatibilidad)
*/
function getQueryParams(qs) { //toma el texto de la URL y cambia los + por espacios
    qs = qs.split('+').join(' '); // """"""

    var params = {}, //Crea un objeto vacío para guardar parámetros y una 'fórmula mágica' para buscar ?clave=valor&clave2=valor2
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) { //Mientras encuentre clave=valor en la URL, los guarda en el objeto
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
}

console.log("Comienza listarTicket.js - Versión Mejorada");

// Intentar obtener datos del localStorage primero, si no de la URL
const clienteID = localStorage.getItem('clienteID') || getQueryParams(document.location.search).id;
const clienteEmail = localStorage.getItem('clienteEmail') || getQueryParams(document.location.search).contacto;
const clienteNombre = localStorage.getItem('clienteNombre') || getQueryParams(document.location.search).nombre;
const ultimoIngreso = localStorage.getItem('ultimoIngreso') || getQueryParams(document.location.search).fecha_ultimo_ingreso;

console.log("Datos usuario - ID:" + clienteID + " Email:" + clienteEmail + " Nombre:" + clienteNombre);

// Verificar si hay sesión activa
if (!clienteID) {
    alert('No hay sesión activa. Redirigiendo al login...');
    window.location.href = 'loginClient.html';
}

// Mostrar información del usuario en la nueva interfaz
document.getElementById('userContacto').textContent = clienteEmail || '-'; //Pone el email del usuario en la pantalla, si no tiene email muestra '-'
document.getElementById('userID').textContent = clienteID || '-';
document.getElementById('userNombre').textContent = clienteNombre || '-';
document.getElementById('userUltimoIngreso').textContent = ultimoIngreso || '-';

const RESTAPI = {
    listarTicket: "http://localhost:8080/api/listarTicket",
};

/*---
Cargar tickets del usuario
*/
async function loadTickets() { //Le dice al servidor: 'Dame todos los tickets de este usuario
    try {
        const ticket = {
            "ID": clienteID,
        };
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ticket),
        };

        console.log("Solicitando tickets para ID:", clienteID);
        
        const response = await fetch(RESTAPI.listarTicket, options);
        const result = await response.json();

        console.log("Respuesta del servidor:", result);

        if (result.response === 'OK' && result.data && result.data.length > 0) {
            displayTickets(result.data);
        } else {
            document.getElementById('noTicketsMessage').style.display = 'block';
            document.getElementById('ticketsTable').style.display = 'none';
        }
    } catch (error) {
        console.error('Error cargando tickets:', error);
        document.getElementById('noTicketsMessage').style.display = 'block';
        document.getElementById('ticketsTable').style.display = 'none';
    }
}

/*---
Función para mostrar los tickets en la tabla
*/
function displayTickets(tickets) {
    const tbody = document.getElementById('ticketsBody');
    tbody.innerHTML = '';

    if (!tickets || tickets.length === 0) {
        document.getElementById('noTicketsMessage').style.display = 'block';
        document.getElementById('ticketsTable').style.display = 'none';
        return;
    }

    document.getElementById('noTicketsMessage').style.display = 'none';
    document.getElementById('ticketsTable').style.display = 'table';

    tickets.forEach(ticket => { //Para cada ticket, decide qué color mostrar según su estado
        const row = document.createElement('tr');
        
        // Determinar estado y clase CSS
        let estadoTexto = 'Abierto';
        let estadoClase = 'status-abierto';
        
        if (ticket.estado_solucion === 2) {
            estadoTexto = 'En Proceso';
            estadoClase = 'status-en-proceso';
        } else if (ticket.estado_solucion === 3) {
            estadoTexto = 'Cerrado';
            estadoClase = 'status-cerrado';
        }

        row.innerHTML = `
            <td>${ticket.id || '-'}</td>
            <td>${ticket.descripcion || ticket.solucion || 'Sin descripción'}</td>
            <td><span class="ticket-status ${estadoClase}">${estadoTexto}</span></td>
            <td>${ticket.fecha_apertura || '-'}</td>
            <td>${ticket.ultimo_contacto || '-'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/*---
Función para cerrar sesión
*/
function logout() {  //Borra todos los datos del usuario y lo manda al login
    localStorage.removeItem('clienteID');
    localStorage.removeItem('clienteNombre');
    localStorage.removeItem('clienteEmail');
    localStorage.removeItem('ultimoIngreso');
    window.location.href = 'loginClient.html';
}

/*---
Cargar tickets cuando la página se abre, cuando la página termine de cargar, busca los tickets automáticamente
*/
document.addEventListener('DOMContentLoaded', function() {
    loadTickets();
});
