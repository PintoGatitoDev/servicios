// Función para obtener la lista de estudiantes del servidor
async function obtenerEstudiantes() {
  try {
    const response = await fetch('http://localhost:3000/obtenerEstudiantes') // Reemplaza con la URL de tu servidor
    .then(response => {
      if (!response.ok) {
        throw new Error('Error al obtener la lista de estudiantes');
      }
      return response.json();
    })
    .then(data => {
      const listaEstudiantes = document.getElementById('listaEstudiantes');
      listaEstudiantes.innerHTML = ''; // Limpiar la tabla antes de agregar datos

      data.estudiantes.forEach(estudiante => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${estudiante.id}</td>
          <td>${estudiante.nombre}</td>
          <td>${estudiante.edad}</td>
          <td>${estudiante.grado}</td>
          <td>${estudiante.correo}</td> 
          <td>${estudiante.telefono}</td> 
          <td>${estudiante.direccion}</td> 
          <td>
            <a href="editarEstudiante.html?id=${estudiante.id}"><button>Editar</button></a>
            <button onclick="eliminarEstudiante('${estudiante.id}')">Eliminar</button>
          </td>
        `;
        listaEstudiantes.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Error al obtener la lista de estudiantes:', error);
      alert('Error al obtener la lista de estudiantes');
    });
} catch (error) {
  console.error('Error al obtener la lista de estudiantes:', error);
  alert('Error al obtener la lista de estudiantes');
}
}

// Función para eliminar un estudiante
async function eliminarEstudiante(id) {
if (confirm('¿Estás seguro de que quieres eliminar este estudiante?')) {
  try {
    const response = await fetch(`http://localhost:3000/eliminarEstudiante/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      alert('Estudiante eliminado exitosamente');
      obtenerEstudiantes(); // Actualizar la lista de estudiantes después de eliminar
    } else {
      alert('Error al eliminar el estudiante');
    }
  } catch (error) {
    console.error('Error al eliminar el estudiante:', error);
    alert('Error al eliminar el estudiante');
  }
}
}