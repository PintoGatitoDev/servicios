// Mostrar/ocultar opciones del menú según el rol del usuario
function actualizarMenu() {
    const rol = localStorage.getItem('rol');
    const authItems = document.querySelectorAll('#menu li[class^="auth-"]');
    authItems.forEach(item => {
      if (item.classList.contains('auth-all') || (rol && item.classList.contains('auth-' + rol))) {
        item.style.display = 'inline-block';
      } else {
        item.style.display = 'none';
      }
    });
  }
  
  // Llamar a la función para actualizar el menú al cargar la página
  actualizarMenu();
  
  // Manejar el cierre de sesión
  const cerrarSesionBtn = document.getElementById('cerrarSesionBtn');
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      alert('Sesión cerrada');
      actualizarMenu(); // Actualizar el menú después de cerrar sesión
    });
  }