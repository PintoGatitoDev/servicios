// Función para obtener la lista de estudiantes del servidor
async function obtenerEstudiantes() {
    try {
      const response = await fetch('http://localhost:3000/obtenerEstudiantes');
      const data = await response.json();
      const listaEstudiantes = document.getElementById('listaEstudiantes');
      listaEstudiantes.innerHTML = '';
      data.estudiantes.forEach(estudiante => {
        const row = listaEstudiantes.insertRow();
        row.insertCell().textContent = estudiante.id;
        row.insertCell().textContent = estudiante.nombre;
        row.insertCell().textContent = estudiante.edad;
        row.insertCell().textContent = estudiante.grado;
  
        // Celda para las acciones (editar y eliminar)
        const actionsCell = row.insertCell();
        const actionButtons = document.createElement('div');
        actionButtons.classList.add('action-buttons');
  
        // Botón para editar
        const editarBtn = document.createElement('button');
        editarBtn.textContent = 'Editar';
        editarBtn.addEventListener('click', () => {
          // Redirigir a la página de editar estudiante con el ID del estudiante
          window.location.href = `editarEstudiante.html?id=${estudiante.id}`;
        });
        actionButtons.appendChild(editarBtn);
  
        // Botón para eliminar
        const eliminarBtn = document.createElement('button');
        eliminarBtn.textContent = 'Eliminar';
        eliminarBtn.addEventListener('click', async () => {
          if (confirm(`¿Estás seguro de que quieres eliminar a ${estudiante.nombre}?`)) {
            try {
              const response = await fetch(`http://localhost:3000/eliminarEstudiante/${estudiante.id}`, { method: 'DELETE' });
              const data = await response.json();
              if (response.ok) {
                alert(data.message);
                obtenerEstudiantes();
              } else {
                alert(`Error: ${data.error}`);
              }
            } catch (error) {
              alert('Error al eliminar el estudiante.');
              console.error(error);
            }
          }
        });
        actionButtons.appendChild(eliminarBtn);
  
        actionsCell.appendChild(actionButtons);
      });
    } catch (error) {
      console.error('Error al obtener la lista de estudiantes:', error);
    }
  }
obtenerEstudiantes();