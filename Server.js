const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const soap = require('soap');
const cors = require('cors');
const fs = require('fs');
const app = express();
const xml = require('fs').readFileSync('requirements.wsdl', 'utf8');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const port = 3000;


const IP = 'localhost';

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.json());
app.use(cors());

/* Módulo de Gestión Académica */

// Registro y gestión de estudiantes, profesores y personal administrativo.
class Estudiante {
    constructor(id,nombre, edad, grado) {
        this.id = id;
        this.nombre = nombre;
        this.edad = edad;
        this.grado = grado;
    }
}

class Profesor {
    constructor(nombre, asignatura) {
        this.nombre = nombre;
        this.asignatura = asignatura;
    }
}

class PersonalAdministrativo {
    constructor(nombre, cargo) {
        this.nombre = nombre;
        this.cargo = cargo;
    }
}

// Cargar estudiantes desde el archivo al iniciar el servidor
const estudiantes = leerDatosDesdeArchivo('estudiantes.json'); 
const profesores = [];
const personalAdministrativo = [];

app.post('/registrarEstudiante', (req, res) => {
    const { nombre, edad, grado } = req.body;
    const nuevoEstudiante = new Estudiante(uuidv4(), nombre, edad, grado); // Asignar un ID único
    estudiantes.push(nuevoEstudiante);

    // Guardar la lista actualizada de estudiantes en el archivo
    guardarDatosEnArchivo(estudiantes, 'estudiantes.json'); 

    res.json({ message: 'Estudiante registrado exitosamente' });
});

app.post('/registrarProfesor', (req, res) => {
    const { nombre, asignatura } = req.body;
    const nuevoProfesor = new Profesor(nombre, asignatura);
    profesores.push(nuevoProfesor);
    res.json({ message: 'Profesor registrado exitosamente' });
});

app.post('/registrarPersonalAdministrativo', (req, res) => {
    const { nombre, cargo } = req.body;
    const nuevoPersonal = new PersonalAdministrativo(nombre, cargo);
    personalAdministrativo.push(nuevoPersonal);
    res.json({ message: 'Personal administrativo registrado exitosamente' });
});

// Creación y administración de planes de estudio, asignaturas y horarios.
class PlanEstudio {
    constructor(nombre, asignaturas) {
        this.nombre = nombre;
        this.asignaturas = asignaturas;
    }
}

// obtener estudiantes
app.get('/obtenerEstudiantes', (req, res) => {
    // Leer estudiantes desde el archivo
    const estudiantes = leerDatosDesdeArchivo('estudiantes.json');
    res.json({ estudiantes }); 
});

app.get('/obtenerEstudiante/:id', (req, res) => {
    const id = req.params.id; // No necesitas parseInt()
  
    // Buscar el estudiante en el array
    const estudiante = estudiantes.find(estudiante => estudiante.id == id); 
  
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
  
    res.json({ estudiante });
  });

  app.put('/actualizarEstudiante/:id', (req, res) => {
    const id = req.params.id; // Obtener el ID del estudiante de la URL
    const { nombre, edad, grado } = req.body; // Obtener los datos actualizados del cuerpo de la solicitud
  
    // Buscar el índice del estudiante en el array
    const indiceEstudiante = estudiantes.findIndex(estudiante => estudiante.id === id); 
  
    if (indiceEstudiante === -1) {
      return res.status(404).json({ error: 'Estudiante no encontrado' }); // Devolver un error 404 si no se encuentra el estudiante
    }
  
    // Actualizar los datos del estudiante
    estudiantes[indiceEstudiante] = { id, nombre, edad, grado }; // Actualizar el estudiante en el array
  
    // Guardar la lista actualizada de estudiantes en el archivo
    guardarDatosEnArchivo(estudiantes, 'estudiantes.json'); // Llamar a la función para guardar los datos en el archivo
  
    res.json({ message: 'Estudiante actualizado exitosamente' }); // Enviar una respuesta al cliente
  });
  app.delete('/eliminarEstudiante/:id', (req, res) => {
    const id = req.params.id; // Obtener el ID del estudiante de la URL
  
    // Buscar el índice del estudiante en el array
    const indiceEstudiante = estudiantes.findIndex(estudiante => estudiante.id === id);
  
    if (indiceEstudiante === -1) {
      return res.status(404).json({ error: 'Estudiante no encontrado' }); // Devolver un error 404 si no se encuentra el estudiante
    }
  
    // Eliminar el estudiante del array
    estudiantes.splice(indiceEstudiante, 1); 
  
    // Guardar la lista actualizada de estudiantes en el archivo
    guardarDatosEnArchivo(estudiantes, 'estudiantes.json');
  
    res.json({ message: 'Estudiante eliminado exitosamente' }); // Enviar una respuesta al cliente
  });

class Asignatura {
    constructor(nombre, profesor) {
        this.nombre = nombre;
        this.profesor = profesor;
    }
}

class Horario {
    constructor(grado, asignatura, horario) {
        this.grado = grado;
        this.asignatura = asignatura;
        this.horario = horario;
    }
}

const planesEstudio = [];
const asignaturas = [];
const horarios = [];

app.post('/crearPlanEstudio', (req, res) => {
    const { nombre, asignaturas } = req.body;
    const nuevoPlan = new PlanEstudio(nombre, asignaturas);
    planesEstudio.push(nuevoPlan);
    res.json({ message: 'Plan de estudio creado exitosamente' });
});

app.post('/crearAsignatura', (req, res) => {
    const { nombre, profesor } = req.body;
    const nuevaAsignatura = new Asignatura(nombre, profesor);
    asignaturas.push(nuevaAsignatura);
    res.json({ message: 'Asignatura creada exitosamente' });
});

app.post('/crearHorario', (req, res) => {
    const { grado, asignatura, horario } = req.body;
    const nuevoHorario = new Horario(grado, asignatura, horario);
    horarios.push(nuevoHorario);
    res.json({ message: 'Horario creado exitosamente' });
});

// Gestión de calificaciones y generación de reportes académicos.
class Calificacion {
    constructor(estudiante, asignatura, calificacion) {
        this.estudiante = estudiante;
        this.asignatura = asignatura;
        this.calificacion = calificacion;
    }
}

const calificaciones = [];

app.post('/registrarCalificacion', (req, res) => {
    const { estudiante, asignatura, calificacion } = req.body;
    const nuevaCalificacion = new Calificacion(estudiante, asignatura, calificacion);
    calificaciones.push(nuevaCalificacion);
    res.json({ message: 'Calificación registrada exitosamente' });
});

app.get('/reporteAcademico/:estudiante', (req, res) => {
    const estudiante = req.params.estudiante;
    const reporte = calificaciones.filter(calificacion => calificacion.estudiante === estudiante);
    res.json({ reporte });
});

// Seguimiento del progreso académico de los estudiantes.
app.get('/progresoEstudiante/:estudiante', (req, res) => {
    const estudiante = req.params.estudiante;
    const progreso = calificaciones.filter(calificacion => calificacion.estudiante === estudiante);
    res.json({ progreso });
});

// Guardar datos en archivo JSON
function guardarDatosEnArchivo(datos, nombreArchivo) {
    const jsonData = JSON.stringify(datos, null, 2); // Formato legible con 2 espacios de indentación
    fs.writeFileSync(nombreArchivo, jsonData);
}

// Guardar datos en archivo JSON
function guardarDatosEnArchivo(datos, nombreArchivo) {
    const jsonData = JSON.stringify(datos, null, 2); 
    fs.writeFileSync(nombreArchivo, jsonData);
}

// Función para leer datos desde un archivo JSON
function leerDatosDesdeArchivo(nombreArchivo) {
    try {
        const data = fs.readFileSync(nombreArchivo, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // Si el archivo no existe o hay un error de lectura, devuelve un arreglo vacío
        return []; 
    }
}


/* Servicio SOAP */
const service = {
    SumService: {
        SumServicePort: {
            addNumbers: (args) => {
                const num1 = parseFloat(args.number1);
                const num2 = parseFloat(args.number2);
                return { result: num1 + num2 };
            },
        },
    },
};


const server = http.createServer(app);
soap.listen(server, '/wsdl', service, xml);


server.listen(port, () => {
    console.log(`Servidor REST corriendo en http://${IP}:${port}`);
    console.log(`Servicio SOAP corriendo en http://${IP}:${port}/wsdl?wsdl`);
});
