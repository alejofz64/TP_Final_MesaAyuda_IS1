document.getElementById('registroForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terminos = document.getElementById('terminos').checked;
    
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.innerHTML = '';
    
    // Validaciones del frontend
    if (password !== confirmPassword) {
        mensajeDiv.innerHTML = '<div class="error">Las passwords no coinciden</div>';
        return;
    }
    
    if (password.length < 6) {
        mensajeDiv.innerHTML = '<div class="error">La password debe tener al menos 6 caracteres</div>';
        return;
    }
    
    if (!terminos) {
        mensajeDiv.innerHTML = '<div class="error">Debe aceptar los términos y condiciones</div>';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:8080/api/registrarCliente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contacto: email,
                password: password,
                nombre: nombre,
                terminos: terminos
            })
        });
        
        const result = await response.json();
        
        if (result.response === 'OK') {
            mensajeDiv.innerHTML = '<div class="success">Registro exitoso.</div>';
            
            // Redirigir después de 2 segundos
            // setTimeout(() => {
            //     window.location.href = 'loginClient.html';
            // }, 2000);
            
        } else {
            mensajeDiv.innerHTML = `<div class="error">${result.message}</div>`;
        }
    } catch (error) {
        console.error('Error:', error);
        mensajeDiv.innerHTML = '<div class="error">Error de conexión con el servidor</div>';
    }
});