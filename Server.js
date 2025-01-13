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
    constructor(id, nombre, edad, grado, correo, telefono, direccion) {
        this.id = id;
        this.nombre = nombre;
        this.edad = edad;
        this.grado = grado;
        this.correo = correo;
        this.telefono = telefono;
        this.direccion = direccion;
    }
}

class Profesor {
    constructor(id, nombre, edad, especialidad, correo, telefono, direccion) {
        this.id = id;
        this.nombre = nombre;
        this.edad = edad;
        this.especialidad = especialidad;
        this.correo = correo;
        this.telefono = telefono;
        this.direccion = direccion;
    }
}

class PersonalAdministrativo {
    constructor(id, nombre, edad, cargo, correo, telefono, direccion) {
        this.id = id;
        this.nombre = nombre;
        this.edad = edad;
        this.cargo = cargo;
        this.correo = correo;
        this.telefono = telefono;
        this.direccion = direccion;
    }
}

// Cargar archivos al servidor
const estudiantes = leerDatosDesdeArchivo('estudiantes.json');
const profesores = leerDatosDesdeArchivo('profesores.json');
const personalAdministrativo = leerDatosDesdeArchivo('personalAdministrativo.json');

// --- Estudiantes ---

app.post('/registrarEstudiante', (req, res) => {
    const { nombre, edad, grado, correo, telefono, direccion } = req.body;
    const nuevoEstudiante = new Estudiante(uuidv4(), nombre, edad, grado, correo, telefono, direccion);
    estudiantes.push(nuevoEstudiante);
    guardarDatosEnArchivo(estudiantes, 'estudiantes.json');
    res.json({ message: 'Estudiante registrado exitosamente' });
});

app.get('/obtenerEstudiantes', (req, res) => {
    const estudiantes = leerDatosDesdeArchivo('estudiantes.json');
    res.json({ estudiantes });
});

app.get('/obtenerEstudiante/:id', (req, res) => {
    const id = req.params.id;
    const estudiante = estudiantes.find(estudiante => estudiante.id == id);
    if (!estudiante) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.json({ estudiante });
});

app.put('/actualizarEstudiante/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, edad, grado, correo, telefono, direccion } = req.body;
    const indiceEstudiante = estudiantes.findIndex(estudiante => estudiante.id === id);
    if (indiceEstudiante === -1) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    estudiantes[indiceEstudiante] = { id, nombre, edad, grado, correo, telefono, direccion };
    guardarDatosEnArchivo(estudiantes, 'estudiantes.json');
    res.json({ message: 'Estudiante actualizado exitosamente' });
});

app.delete('/eliminarEstudiante/:id', (req, res) => {
    const id = req.params.id;
    const indiceEstudiante = estudiantes.findIndex(estudiante => estudiante.id === id);
    if (indiceEstudiante === -1) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    estudiantes.splice(indiceEstudiante, 1);
    guardarDatosEnArchivo(estudiantes, 'estudiantes.json');
    res.json({ message: 'Estudiante eliminado exitosamente' });
});

// --- Profesores ---

app.post('/registrarProfesor', (req, res) => {
    const { nombre, edad, especialidad, correo, telefono, direccion } = req.body;
    const nuevoProfesor = new Profesor(uuidv4(), nombre, edad, especialidad, correo, telefono, direccion);
    profesores.push(nuevoProfesor);
    guardarDatosEnArchivo(profesores, 'profesores.json');
    res.json({ message: 'Profesor registrado exitosamente' });
});

app.get('/obtenerProfesores', (req, res) => {
    const profesores = leerDatosDesdeArchivo('profesores.json');
    res.json({ profesores });
});

app.get('/obtenerProfesor/:id', (req, res) => {
    const id = req.params.id;
    const profesor = profesores.find(profesor => profesor.id == id);
    if (!profesor) {
        return res.status(404).json({ error: 'Profesor no encontrado' });
    }
    res.json({ profesor });
});

app.put('/actualizarProfesor/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, edad, especialidad, correo, telefono, direccion } = req.body;
    const indiceProfesor = profesores.findIndex(profesor => profesor.id === id);
    if (indiceProfesor === -1) {
        return res.status(404).json({ error: 'Profesor no encontrado' });
    }
    profesores[indiceProfesor] = { id, nombre, edad, especialidad, correo, telefono, direccion };
    guardarDatosEnArchivo(profesores, 'profesores.json');
    res.json({ message: 'Profesor actualizado exitosamente' });
});

app.delete('/eliminarProfesor/:id', (req, res) => {
    const id = req.params.id;
    const indiceProfesor = profesores.findIndex(profesor => profesor.id === id);
    if (indiceProfesor === -1) {
        return res.status(404).json({ error: 'Profesor no encontrado' });
    }
    profesores.splice(indiceProfesor, 1);
    guardarDatosEnArchivo(profesores, 'profesores.json');
    res.json({ message: 'Profesor eliminado exitosamente' });
});

// --- Personal Administrativo ---

app.post('/registrarPersonalAdministrativo', (req, res) => {
    const { nombre, edad, cargo, correo, telefono, direccion } = req.body;
    const nuevoPersonal = new PersonalAdministrativo(uuidv4(), nombre, edad, cargo, correo, telefono, direccion);
    personalAdministrativo.push(nuevoPersonal);
    guardarDatosEnArchivo(personalAdministrativo, 'personalAdministrativo.json');
    res.json({ message: 'Personal administrativo registrado exitosamente' });
});

app.get('/obtenerPersonalAdministrativo', (req, res) => {
    const personal = leerDatosDesdeArchivo('personalAdministrativo.json');
    res.json({ personal }); 
});

app.get('/obtenerPersonalAdministrativo/:id', (req, res) => {
    const id = req.params.id;
    const personal = personalAdministrativo.find(personal => personal.id == id);
    if (!personal) {
        return res.status(404).json({ error: 'Personal administrativo no encontrado' });
    }
    res.json({ personal });
});

app.put('/actualizarPersonalAdministrativo/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, edad, cargo, correo, telefono, direccion } = req.body;
    const indicePersonal = personalAdministrativo.findIndex(personal => personal.id === id);
    if (indicePersonal === -1) {
        return res.status(404).json({ error: 'Personal administrativo no encontrado' });
    }
    personalAdministrativo[indicePersonal] = { id, nombre, edad, cargo, correo, telefono, direccion };
    guardarDatosEnArchivo(personalAdministrativo, 'personalAdministrativo.json');
    res.json({ message: 'Personal administrativo actualizado exitosamente' });
});

app.delete('/eliminarPersonalAdministrativo/:id', (req, res) => {
    const id = req.params.id;
    const indicePersonal = personalAdministrativo.findIndex(personal => personal.id === id);
    if (indicePersonal === -1) {
        return res.status(404).json({ error: 'Personal administrativo no encontrado' });
    }
    personalAdministrativo.splice(indicePersonal, 1);
    guardarDatosEnArchivo(personalAdministrativo, 'personalAdministrativo.json');
    res.json({ message: 'Personal administrativo eliminado exitosamente' });
});

// --- Funciones auxiliares ---

// Guardar datos en archivo JSON
function guardarDatosEnArchivo(datos, nombreArchivo) {
    const jsonData = JSON.stringify(datos, null, 2);
    fs.writeFileSync(nombreArchivo, jsonData);
}

// Función para leer datos desde un archivo JSON (corregida)
function leerDatosDesdeArchivo(nombreArchivo) {
    try {
        const data = fs.readFileSync(nombreArchivo, 'utf8');
        return JSON.parse(data);
    } catch (err) {
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