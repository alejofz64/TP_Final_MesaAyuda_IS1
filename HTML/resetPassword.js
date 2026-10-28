document.getElementById('resetForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    const mensajeDiv = document.getElementById('mensaje');
    const submitBtn = document.getElementById('submitBtn');
    
    mensajeDiv.innerHTML = '';
    
    // Validaciones
    if (newPassword !== confirmPassword) {
        mensajeDiv.innerHTML = '<div class="error">Las contraseñas no coinciden</div>';
        return;
    }
    
    if (newPassword.length < 6) {
        mensajeDiv.innerHTML = '<div class="error">La contraseña debe tener al menos 6 caracteres</div>';
        return;
    }
    
    // Deshabilitar botón mientras se procesa
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';
    
    try {
        const response = await fetch('http://localhost:8080/api/resetPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contacto: email,
                newPassword: newPassword
            })
        });
        
        const result = await response.json();
        
        if (result.response === 'OK') {
            mensajeDiv.innerHTML = '<div class="success">✅ ' + result.message + '. Redirigiendo al login...</div>';
            
            // Redirigir después de 2 segundos
            setTimeout(() => {
                window.location.href = 'loginClient.html';
            }, 2000);
            
        } else {
            mensajeDiv.innerHTML = '<div class="error">❌ ' + result.message + '</div>';
        }
    } catch (error) {
        console.error('Error:', error);
        mensajeDiv.innerHTML = '<div class="error">❌ Error de conexión con el servidor</div>';
    } finally {
        // Rehabilitar botón
        submitBtn.disabled = false;
        submitBtn.textContent = 'Actualizar Contraseña';
    }
});

// Validación en tiempo real de coincidencia de passwords
document.getElementById('confirmPassword').addEventListener('input', function() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = this.value;
    const matchDiv = document.getElementById('passwordMatch');
    
    if (confirmPassword === '') {
        matchDiv.textContent = '';
        matchDiv.className = 'password-match';
    } else if (newPassword === confirmPassword) {
        matchDiv.textContent = '✓ Las contraseñas coinciden';
        matchDiv.className = 'password-match match';
    } else {
        matchDiv.textContent = '✗ Las contraseñas no coinciden';
        matchDiv.className = 'password-match no-match';
    }
});

// Validar longitud de password en tiempo real
document.getElementById('newPassword').addEventListener('input', function() {
    const password = this.value;
    const matchDiv = document.getElementById('passwordMatch');
    
    if (password.length > 0 && password.length < 6) {
        matchDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
        matchDiv.className = 'password-match no-match';
    } else if (password.length >= 6) {
        matchDiv.textContent = '✓ Longitud adecuada';
        matchDiv.className = 'password-match match';
    }
});