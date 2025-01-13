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
    constructor(id, nombre, edad, grado) {
        this.id = id;
        this.nombre = nombre;
        this.edad = edad;
        this.grado = grado;
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
