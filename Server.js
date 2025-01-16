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
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { error } = require('console');

const port = 3000;
const IP = 'localhost';
const JWT_SECRET = 'Servicios'; // Reemplaza con una clave secreta segura

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(cors());

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
        this.calificaciones = []; 
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
    constructor(id, nombre, descripcion, asignaturas = []) { // Agregar asignaturas al constructor
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.asignaturas = asignaturas; // Inicializar la propiedad asignaturas
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
    constructor(id, asignatura, profesor, horario, planEstudio) {
      this.id = id;
      this.asignatura = asignatura;
      this.profesor = profesor;
      this.horario = horario || [];
      this.planEstudio = planEstudio;
    }
  }

// --- Cargar datos desde archivos ---

const estudiantes = leerDatosDesdeArchivo('estudiantes.json');
const profesores = leerDatosDesdeArchivo('profesores.json');
const personalAdministrativo = leerDatosDesdeArchivo('personalAdministrativo.json');
const planesEstudio = leerDatosDesdeArchivo('planesEstudio.json');
const asignaturas = leerDatosDesdeArchivo('asignaturas.json');
const grupos = leerDatosDesdeArchivo('grupos.json');
const usuarios = leerDatosDesdeArchivo('usuarios.json');
const inscripciones = leerDatosDesdeArchivo('inscripciones.json'); // Cargar las inscripciones

// --- Autenticación ---

// Registro de usuario
app.post('/registrar', async (req, res) => {
    const { nombreUsuario, contrasena, rol } = req.body;

    // Verificar si el usuario ya existe
    if (usuarios.find(u => u.nombreUsuario === nombreUsuario)) {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    try {
        // Cifrar la contraseña
        const salt = await bcrypt.genSalt();
        const hashedContrasena = await bcrypt.hash(contrasena, salt);

        // Crear un nuevo usuario
        const nuevoUsuario = {
            id: uuidv4(),
            nombreUsuario,
            contrasena: hashedContrasena,
            rol
        };

        usuarios.push(nuevoUsuario);
        guardarDatosEnArchivo(usuarios, 'usuarios.json');
        res.json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});

// Inicio de sesión de usuario
app.post('/iniciarSesion', async (req, res) => {
    console.log(req.body); // Verificar que se reciben los datos del formulario
    const { nombreUsuario, contrasena } = req.body;

    const usuario = usuarios.find(u => u.nombreUsuario === nombreUsuario);
    if (!usuario) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    try {
        // Comparar la contraseña con la contraseña cifrada
        const match = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!match) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar un token de acceso
        const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET);

        // Crear el objeto de respuesta
        const respuesta = { token: token, rol: usuario.rol };

        // Convertir la respuesta a una cadena JSON
        const jsonRespuesta = JSON.stringify(respuesta);

        // Enviar la respuesta como JSON
        res.json(jsonRespuesta); 

        console.log(jsonRespuesta); // Verificar la respuesta JSON

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// Middleware para verificar el token de acceso
function autenticar(req, res, next) {
    const token = req.header('Authorization');
    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado' });
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
  
      // Buscar el usuario en la base de datos (ejemplo)
      const usuario = usuarios.find(u => u.id === decoded.id); 
      if (!usuario) {
        return res.status(401).json({ error: 'Token inválido o usuario no encontrado' });
      }
  
      // Verificar si el token ha expirado (opcional)
      // const expiracion = decoded.exp; // Obtener la fecha de expiración del token
      // if (expiracion * 1000 < Date.now()) { 
      //   return res.status(401).json({ error: 'Token expirado' });
      // }
  
      req.usuario = decoded; // Asignar el usuario decodificado al request
      next(); // Continuar con la siguiente función
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  }

// --- Rutas ---

// --- Estudiantes ---

app.post('/registrarEstudiante', async (req, res) => {
    const { nombre, edad, correo, telefono, direccion, calificaciones, planEstudio, contrasena } = req.body;

    // Verificar si el usuario ya existe
    if (usuarios.find(u => u.nombreUsuario === nombre)) {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    try {
        // Cifrar la contraseña
        const salt = await bcrypt.genSalt();
        const hashedContrasena = await bcrypt.hash(contrasena, salt);

        // Crear un nuevo usuario
        const nuevoUsuario = {
            id: uuidv4(),
            nombreUsuario: nombre,
            contrasena: hashedContrasena,
            rol: 'estudiante'
        };

        usuarios.push(nuevoUsuario);
        guardarDatosEnArchivo(usuarios, 'usuarios.json');

        // Crear el estudiante con el mismo ID que el usuario y el grado 1
        const nuevoEstudiante = new Estudiante(nuevoUsuario.id, nombre, edad, 1, correo, telefono, direccion);
        if (calificaciones && Array.isArray(calificaciones)) {
            nuevoEstudiante.calificaciones = calificaciones;
        }

        nuevoEstudiante.planEstudio = planEstudio;

        estudiantes.push(nuevoEstudiante);
        guardarDatosEnArchivo(estudiantes, 'estudiantes.json');

        // Generar un token de acceso
        const token = jwt.sign({ id: nuevoUsuario.id, rol: nuevoUsuario.rol }, JWT_SECRET);

        res.json({ message: 'Estudiante registrado exitosamente', token });
    } catch (error) {
        console.error('Error al registrar el estudiante:', error);
        res.status(500).json({ error: 'Error al registrar el estudiante' });
    }
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
    const { nombre, edad, grado, correo, telefono, direccion, calificaciones } = req.body;
    const indiceEstudiante = estudiantes.findIndex(estudiante => estudiante.id === id);
    if (indiceEstudiante === -1) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    estudiantes[indiceEstudiante] = { id, nombre, edad, grado, correo, telefono, direccion, calificaciones, calificaciones };
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

app.post('/inscribirEstudiante', autenticar, (req, res) => {
    // Verificar que el usuario que realiza la petición sea personal administrativo
    if (req.usuario.rol !== 'personalAdministrativo') {
      return res.status(403).json({ error: 'No tienes permiso para acceder a esta ruta' });
    }
  
    const { idEstudiante, idGrupo } = req.body;
  
    // Verificar si el estudiante y el grupo existen
    const estudiante = estudiantes.find(e => e.id === idEstudiante);
    const grupo = planesEstudio.flatMap(plan => plan.grupos).find(g => g.id === idGrupo);
  
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
  
    // Verificar si el estudiante ya está inscrito en el grupo
    const inscripcionExistente = inscripciones.find(inscripcion => inscripcion.idEstudiante === idEstudiante && inscripcion.idGrupo === idGrupo);
    if (inscripcionExistente) {
      return res.status(400).json({ error: 'El estudiante ya está inscrito en el grupo' });
    }
  
    // Crear la inscripción
    const nuevaInscripcion = {
      idEstudiante: idEstudiante,
      idGrupo: idGrupo,
      calificacion: null // o 0, según cómo quieras inicializar la calificación
    };
    inscripciones.push(nuevaInscripcion);
  
    guardarDatosEnArchivo(inscripciones, 'inscripciones.json');
    res.json({ message: 'Estudiante inscrito en el grupo exitosamente' });
  });
  
  // --- Obtener grupos del estudiante ---

  app.get('/estudiantes/grupos', autenticar, (req, res) => {
    if (req.usuario.rol !== 'estudiante') {
      return res.status(403).json({ error: 'No tienes permiso para acceder a esta ruta' });
    }
  
    const idEstudiante = req.usuario.id;
    const estudiante = estudiantes.find(e => e.id === idEstudiante);
  
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
  
    // Obtener los IDs de los grupos a los que está inscrito el estudiante
    const idsGruposEstudiante = inscripciones
      .filter(inscripcion => inscripcion.idEstudiante === idEstudiante)
      .map(inscripcion => inscripcion.idGrupo);
  
    // Obtener los grupos completos a partir de los IDs
    const gruposEstudiante = grupos // Buscar los grupos en el array grupos
      .filter(grupo => idsGruposEstudiante.includes(grupo.id));
  
    // Obtener la información completa de las asignaturas y los profesores de los grupos
    const gruposConInformacion = gruposEstudiante.map(grupo => {
      const asignatura = asignaturas.find(a => a.id === grupo.asignatura);
      const profesor = profesores.find(p => p.id === grupo.profesor);
      const inscripcion = inscripciones.find(inscripcion => inscripcion.idEstudiante === idEstudiante && inscripcion.idGrupo === grupo.id);
      return {
        id: grupo.id,
        asignatura: asignatura,
        profesor: profesor,
        calificacion: inscripcion ? inscripcion.calificacion : null
      };
    });
  
    res.json({ grupos: gruposConInformacion });
  });

// --- Profesores ---

app.post('/registrarProfesor', async (req, res) => {
    const { nombre, edad, especialidad, correo, telefono, direccion, contrasena } = req.body;

    // Verificar si el usuario ya existe
    if (usuarios.find(u => u.nombreUsuario === nombre)) {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    try {
        // Cifrar la contraseña
        const salt = await bcrypt.genSalt();
        const hashedContrasena = await bcrypt.hash(contrasena, salt);

        // Crear un nuevo usuario
        const nuevoUsuario = {
            id: uuidv4(),
            nombreUsuario: nombre,
            contrasena: hashedContrasena,
            rol: 'profesor'
        };

        usuarios.push(nuevoUsuario);
        guardarDatosEnArchivo(usuarios, 'usuarios.json');

        // Crear el profesor con el mismo ID que el usuario
        const nuevoProfesor = new Profesor(nuevoUsuario.id, nombre, edad, especialidad, correo, telefono, direccion);

        profesores.push(nuevoProfesor);
        guardarDatosEnArchivo(profesores, 'profesores.json');

        // Generar un token de acceso
        const token = jwt.sign({ id: nuevoUsuario.id, rol: nuevoUsuario.rol }, JWT_SECRET);

        res.json({ message: 'Profesor registrado exitosamente', token });
    } catch (error) {
        console.error('Error al registrar el profesor:', error);
        res.status(500).json({ error: 'Error al registrar el profesor' });
    }
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

app.post('/registrarPersonalAdministrativo', async (req, res) => {
    const { nombre, edad, cargo, correo, telefono, direccion, contrasena } = req.body;

    // Verificar si el usuario ya existe
    if (usuarios.find(u => u.nombreUsuario === nombre)) {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    try {
        // Cifrar la contraseña
        const salt = await bcrypt.genSalt();
        const hashedContrasena = await bcrypt.hash(contrasena, salt);

        // Crear un nuevo usuario
        const nuevoUsuario = {
            id: uuidv4(),
            nombreUsuario: nombre,
            contrasena: hashedContrasena,
            rol: 'personalAdministrativo'
        };

        usuarios.push(nuevoUsuario);
        guardarDatosEnArchivo(usuarios, 'usuarios.json');

        // Crear el personal administrativo con el mismo ID que el usuario
        const nuevoPersonal = new PersonalAdministrativo(nuevoUsuario.id, nombre, edad, cargo, correo, telefono, direccion);

        personalAdministrativo.push(nuevoPersonal);
        guardarDatosEnArchivo(personalAdministrativo, 'personalAdministrativo.json');

        // Generar un token de acceso
        const token = jwt.sign({ id: nuevoUsuario.id, rol: nuevoUsuario.rol }, JWT_SECRET);

        res.json({ message: 'Personal administrativo registrado exitosamente', token });
    } catch (error) {
        console.error('Error al registrar el personal administrativo:', error);
        res.status(500).json({ error: 'Error al registrar el personal administrativo' });
    }
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
    const nuevoPlan = new PlanEstudio(uuidv4(), nombre, descripcion,);
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
    const { nombre, descripcion, grupos } = req.body;
    const indicePlan = planesEstudio.findIndex(plan => plan.id === id);
    if (indicePlan === -1) {
        return res.status(404).json({ error: 'Plan de estudio no encontrado' });
    }
    planesEstudio[indicePlan] = { id, nombre, descripcion, grupos };
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

// --- Asignaturas Plan ---

app.post('/agregarAsignaturaPlan', (req, res) => {
    const { idPlan, idAsignatura } = req.body;
    const plan = planesEstudio.find(plan => plan.id === idPlan);
    const asignatura = asignaturas.find(asignatura => asignatura.id === idAsignatura);

    if (!plan) {
        return res.status(404).json({ error: 'Plan de estudio no encontrado' });
    }
    if (!asignatura) {
        return res.status(404).json({ error: 'Asignatura no encontrada' });
    }

    // Verificar si la asignatura ya existe en el plan
    if (plan.asignaturas.some(a => a.id === idAsignatura)) {
        return res.status(400).json({ error: 'La asignatura ya está agregada al plan de estudio' });
    }

    plan.asignaturas.push(asignatura);
    guardarDatosEnArchivo(planesEstudio, 'planesEstudio.json');
    res.json({ message: 'Asignatura agregada al plan de estudio exitosamente' });
});



// --- Asignaturas ---

app.post('/crearAsignatura', (req, res) => {
    const { nombre, descripcion } = req.body;
    const nuevaAsignatura = new Asignatura(uuidv4(), nombre, descripcion);
    asignaturas.push(nuevaAsignatura);
    guardarDatosEnArchivo(asignaturas, 'asignaturas.json');
    res.json({ message: 'Asignatura creada exitosamente', id: nuevaAsignatura.id });
});

app.get('/obtenerAsignaturas', (req, res) => {
    const asignaturas = leerDatosDesdeArchivo('asignaturas.json');
    res.json({ asignaturas });
});

app.get('/obtenerAsignatura/:id', (req, res) => {
    const id = req.params.id;
    const asignatura = asignaturas.find(asignatura => asignatura.id == id);
    if (!asignatura) {
        return res.status(404).json({ error: 'Asignatura no encontrada' });
    }
    res.json({ asignatura });
});

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

app.post('/crearGrupo', (req, res) => {
    const { asignatura, profesor, planEstudio } = req.body;
    const nuevoGrupo = new Grupo(uuidv4(), asignatura, profesor, [], planEstudio);
    planesEstudio.forEach(plan => {
      if (plan.id === planEstudio) { // Agregar el grupo solo al plan de estudio correspondiente
        plan.grupos.push(nuevoGrupo);
      }
    });
    guardarDatosEnArchivo(planesEstudio, 'planesEstudio.json');
    res.json({ message: 'Grupo creado exitosamente', id: nuevoGrupo.id });
  });

app.get('/obtenerGrupos', (req, res) => {
    const grupos = planesEstudio.flatMap(plan => plan.grupos);
    res.json({ grupos });
});

app.get('/obtenerGrupo/:id', (req, res) => {
    const id = req.params.id;
    const grupo = planesEstudio.flatMap(plan => plan.grupos).find(grupo => grupo.id == id);
    if (!grupo) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    res.json({ grupo });
});

app.put('/actualizarGrupo/:id', (req, res) => {
    const id = req.params.id;
    const { asignatura, profesor, horario } = req.body;
    let grupoActualizado = false;

    planesEstudio.forEach(plan => {
        const indiceGrupo = plan.grupos.findIndex(grupo => grupo.id === id);
        if (indiceGrupo !== -1) {
            plan.grupos[indiceGrupo] = { id, asignatura, profesor, horario };
            grupoActualizado = true;
        }
    });

    if (grupoActualizado) {
        guardarDatosEnArchivo(planesEstudio, 'planesEstudio.json');
        res.json({ message: 'Grupo actualizado exitosamente' });
    } else {
        return res.status(404).json({ error: 'Grupo no encontrado' });
    }
});

app.delete('/eliminarGrupo/:id', (req, res) => {
    let grupoEliminado = false;

    planesEstudio.forEach(plan => {
        const indiceGrupo = plan.grupos.findIndex(grupo => grupo.id === req.params.id);
        if (indiceGrupo !== -1) {
            plan.grupos.splice(indiceGrupo, 1);
            grupoEliminado = true;
        }
    });

    if (grupoEliminado) {
        guardarDatosEnArchivo(planesEstudio, 'planesEstudio.json');
        res.json({ message: 'Grupo eliminado exitosamente' });
    } else {
        return res.status(404).json({ error: 'Grupo no encontrado' });
    }
});

// --- Rutas protegidas ---

// Ejemplo de ruta protegida para estudiantes
app.get('/estudiantes/perfil', autenticar, (req, res) => {
    if (req.usuario.rol !== 'estudiante') {
        return res.status(403).json({ error: 'No tienes permiso para acceder a esta ruta' });
    }

    // Obtener el perfil del estudiante
    const estudiante = estudiantes.find(e => e.id === req.usuario.id);
    res.json({ estudiante });
});

// ... (Otras rutas protegidas)

// --- Funciones auxiliares ---

function guardarDatosEnArchivo(datos, nombreArchivo) {
    // Corregir la ruta del archivo
    const rutaArchivo = path.join(__dirname,  nombreArchivo); 
    const datosJSON = JSON.stringify(datos, null, 2);
    fs.writeFileSync(rutaArchivo, datosJSON);
}


function leerDatosDesdeArchivo(nombreArchivo) {
    // Corregir la ruta del archivo
    const rutaArchivo = path.join(__dirname, nombreArchivo);
    try {
        const datosJSON = fs.readFileSync(rutaArchivo, 'utf8');
        return JSON.parse(datosJSON);
    } catch (error) {
        // Si el archivo no existe, retornar un array vacío
        return [];
    }
}

// --- Servicio SOAP ---

const service = {
    Servicio: {
        getEstudiantes: (args, callback) => {
            callback({ estudiantes: JSON.stringify(estudiantes) });
        },
        getProfesores: (args, callback) => {
            callback({ profesores: JSON.stringify(profesores) });
        },
        getPersonalAdministrativo: (args, callback) => {
            callback({ personalAdministrativo: JSON.stringify(personalAdministrativo) });
        },
        getPlanesEstudio: (args, callback) => {
            callback({ planesEstudio: JSON.stringify(planesEstudio) });
        },
        getAsignaturas: (args, callback) => {
            callback({ asignaturas: JSON.stringify(asignaturas) });
        }
    }
};

const server = http.createServer(app);
soap.listen(server, '/wsdl', service, xml);

server.listen(port, () => {
    console.log(`Servidor REST corriendo en http://${IP}:${port}`);
    console.log(`Servicio SOAP corriendo en http://${IP}:${port}/wsdl?wsdl`);
});