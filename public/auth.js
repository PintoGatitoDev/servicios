// Mostrar/ocultar opciones del menú según el rol del usuario
function actualizarMenu() {
    const token = obtenerToken(); // Obtener el token de la cookie
    const rol = localStorage.getItem('rol');
    const authItems = document.querySelectorAll('#menu li[class^="auth-"]');
    
    authItems.forEach(item => {
      if (item.classList.contains('auth-none') && !token) { 
        // Mostrar solo si no hay token y tiene la clase 'auth-none'
        item.style.display = 'inline-block';
      } else if (token && rol && item.classList.contains('auth-' + rol)) { 
        // Mostrar si hay token, rol y la clase coincide con el rol
        item.style.display = 'inline-block';
      } else if(item.classList.contains('auth-close') && token){
        item.style.display = 'inline-block';
      } else {
        item.style.display = 'none';
      }
    });
  }
  // Almacena el token en una cookie HttpOnly 
  function guardarToken(token) {
    document.cookie = `token=${token}; SameSite=None; secure`; 
  }
  // Obtiene el token de la cookie
  function obtenerToken() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith('token=')) {
        return cookie.substring('token='.length, cookie.length);
      }
    }
    return null;
  }
  // Llamar a la función para actualizar el menú al cargar la página
  actualizarMenu();
  // Manejar el cierre de sesión
  const cerrarSesionBtn = document.getElementById('cerrarSesionBtn');
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', () => {
      // Eliminar la cookie
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure'; 
      localStorage.removeItem('rol');
      alert('Sesión cerrada');
      window.location.href = '/index.html';
    });
  }
  // Función para iniciar sesión (llamada desde iniciarSesion.html)
  function iniciarSesion(usuario, contrasena) {
    fetch('/iniciarSesion', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreUsuario: usuario, contrasena })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || 'Error al iniciar sesión');
        });
      }
      return response.json();
    })
    .then(data => {
      try {
        // Intenta analizar la respuesta como JSON
        console.log("Respuesta del servidor:", data); // Agregar esta línea
        const jsonData = JSON.parse(data); 
        // Accede a las propiedades del JSON
        const token = jsonData.token; 
        const rol = jsonData.rol;
        guardarToken(token); 
        localStorage.setItem('rol', rol); 
        window.location.href = '/estudiantes.html';
      } catch (error) {
        console.error("Error al analizar la respuesta JSON:", error);
        alert("Error al iniciar sesión. Por favor, inténtalo de nuevo.");
      }
    })
    .catch(error => {
      alert(error.message);
    });
  }