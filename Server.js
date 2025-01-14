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

// --- Clases ---

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

class PlanEstudio {
    constructor(id, nombre, descripcion, grupos) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.grupos = grupos || [];
    }
}

class Asignatura {
    constructor(id, nombre, descripcion) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
    }
}

class Grupo {
    constructor(id, asignatura, profesor, horario) {
        this.id = id;
        this.asignatura = asignatura;
        this.profesor = profesor;
        this.horario = horario || [];
    }
}

// --- Cargar datos desde archivos ---

const estudiantes = leerDatosDesdeArchivo('estudiantes.json');
const profesores = leerDatosDesdeArchivo('profesores.json');
const personalAdministrativo = leerDatosDesdeArchivo('personalAdministrativo.json');
const planesEstudio = leerDatosDesdeArchivo('planesEstudio.json');
const asignaturas = leerDatosDesdeArchivo('asignaturas.json');

// --- Rutas ---

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

// --- Planes de Estudio ---

app.post('/crearPlanEstudio', (req, res) => {
    const { nombre, descripcion } = req.body;
    const nuevoPlan = new PlanEstudio(uuidv4(), nombre, descripcion);
    planesEstudio.push(nuevoPlan);
    guardarDatosEnArchivo(planesEstudio, 'planesEstudio.json');
    res.json({ message: 'Plan de estudio creado exitosamente', id: nuevoPlan.id });
});

app.get('/obtenerPlanesEstudio', (req, res) => {
    const planes = leerDatosDesdeArchivo('planesEstudio.json');
    res.json({ planes });
});

app.get('/obtenerPlanEstudio/:id', (req, res) => {
    const id = req.params.id;
    const plan = planesEstudio.find(plan => plan.id == id);
    if (!plan) {
        return res.status(404).json({ error: 'Plan de estudio no encontrado' });
    }
    res.json({ plan });
});

app.put('/actualizarPlanEstudio/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, descripcion } = req.body;
    const indicePlan = planesEstudio.findIndex(plan => plan.id === id);
    if (indicePlan === -1) {
        return res.status(404).json({ error: 'Plan de estudio no encontrado' });
    }
    planesEstudio[indicePlan] = { id, nombre, descripcion };
    guardarDatosEnArchivo(planesEstudio, 'planesEstudio.json');
    res.json({ message: 'Plan de estudio actualizado exitosamente' });
});

app.delete('/eliminarPlanEstudio/:id', (req, res) => {
    const id = req.params.id;
    const indicePlan = planesEstudio.findIndex(plan => plan.id === id);
    if (indicePlan === -1) {
        return res.status(404).json({ error: 'Plan de estudio no encontrado' });
    }
    planesEstudio.splice(indicePlan, 1);
    guardarDatosEnArchivo(planesEstudio, 'planesEstudio.json');
    res.json({ message: 'Plan de estudio eliminado exitosamente' });
});

// --- Asignaturas ---

// Obtener todas las asignaturas
app.get('/obtenerAsignaturas', (req, res) => {
    const asignaturas = leerDatosDesdeArchivo('asignaturas.json');
    res.json({ asignaturas });
});

// Crear una nueva asignatura
app.post('/crearAsignatura', (req, res) => {
    const { nombre, descripcion } = req.body;
    const nuevaAsignatura = new Asignatura(uuidv4(), nombre, descripcion);
    asignaturas.push(nuevaAsignatura);
    guardarDatosEnArchivo(asignaturas, 'asignaturas.json');
    res.json({ message: 'Asignatura creada exitosamente', id: nuevaAsignatura.id });
});

// Obtener una asignatura por su ID
app.get('/obtenerAsignatura/:id', (req, res) => {
    const id = req.params.id;
    const asignatura = asignaturas.find(asignatura => asignatura.id === id);
    if (!asignatura) {
        return res.status(404).json({ error: 'Asignatura no encontrada' });
    }
    res.json({ asignatura });
});

// Actualizar una asignatura
app.put('/actualizarAsignatura/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, descripcion } = req.body;
    const indiceAsignatura = asignaturas.findIndex(asignatura => asignatura.id === id);
    if (indiceAsignatura === -1) {
        return res.status(404).json({ error: 'Asignatura no encontrada' });
    }
    asignaturas[indiceAsignatura] = { id, nombre, descripcion };
    guardarDatosEnArchivo(asignaturas, 'asignaturas.json');
    res.json({ message: 'Asignatura actualizada exitosamente' });
});

// Eliminar una asignatura
app.delete('/eliminarAsignatura/:id', (req, res) => {
    const id = req.params.id;
    const indiceAsignatura = asignaturas.findIndex(asignatura => asignatura.id === id);
    if (indiceAsignatura === -1) {
        return res.status(404).json({ error: 'Asignatura no encontrada' });
    }
    asignaturas.splice(indiceAsignatura, 1);
    guardarDatosEnArchivo(asignaturas, 'asignaturas.json');
    res.json({ message: 'Asignatura eliminada exitosamente' });
});

// --- Grupos ---

// Crear un nuevo grupo dentro de un plan de estudio
app.post('/crearGrupo/:planId', (req, res) => {
    const planId = req.params.planId;
    const { asignatura, profesor, horario } = req.body;

    const plan = planesEstudio.find(plan => plan.id === planId);
    if (!plan) {
        return res.status(404).json({ error: 'Plan de estudio no encontrado' });
    }

    const nuevoGrupo = new Grupo(uuidv4(), asignatura, profesor, horario);
    plan.grupos.push(nuevoGrupo);
    guardarDatosEnArchivo(planesEstudio, 'planesEstudio.json');

    res.json({ message: 'Grupo creado exitosamente', id: nuevoGrupo.id });
});

// Obtener todos los grupos de un plan de estudio
app.get('/obtenerGrupos/:planId', (req, res) => {
    const planId = req.params.planId;
    const plan = planesEstudio.find(plan => plan.id === planId);
    if (!plan) {
        return res.status(404).json({ error: 'Plan de estudio no encontrado' });
    }
    res.json({ grupos: plan.grupos });
});

// Obtener un grupo por su ID
app.get('/obtenerGrupo/:id', (req, res) => {
    const id = req.params.id;
    let grupoEncontrado = null;

    for (const plan of planesEstudio) {
        const grupo = plan.grupos.find(g => g.id === id);
        if (grupo) {
            grupoEncontrado = grupo;
            break;
        }
    }

    if (!grupoEncontrado) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    res.json({ grupo: grupoEncontrado });
});

// Actualizar un grupo
app.put('/actualizarGrupo/:id', (req, res) => {
    const id = req.params.id;
    const { asignatura, profesor, horario } = req.body;

    let grupoEncontrado = null;

    for (const plan of planesEstudio) {
        const indiceGrupo = plan.grupos.findIndex(g => g.id === id);
        if (indiceGrupo !== -1) {
            plan.grupos[indiceGrupo] = { id, asignatura, profesor, horario };
            grupoEncontrado = plan.grupos[indiceGrupo];
            break;
        }
    }

    if (!grupoEncontrado) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    guardarDatosEnArchivo(planesEstudio, 'planesEstudio.json');
    res.json({ message: 'Grupo actualizado exitosamente'});
});

// Eliminar un grupo
app.delete('/eliminarGrupo/:id', (req, res) => {
const id = req.params.id;

let grupoEliminado = false;

for (const plan of planesEstudio) {
    const indiceGrupo = plan.grupos.findIndex(g => g.id === id);
    if (indiceGrupo !== -1) {
        plan.grupos.splice(indiceGrupo, 1);
        grupoEliminado = true;
        break;
    }
}

if (!grupoEliminado) {
    return res.status(404).json({ error: 'Grupo no encontrado' });
}

guardarDatosEnArchivo(planesEstudio, 'planesEstudio.json');
res.json({ message: 'Grupo eliminado exitosamente' });

});

// --- Funciones auxiliares ---

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