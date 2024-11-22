const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController'); // Importar controlador de usuario

const checkAuth =require('../middlewares/check-auth');


// Endpoint para crear un nuevo usuario con imagen de perfil
router.post('/crear',  usuarioController.crearUsuario);

// Ruta para iniciar sesión
router.post('/login', usuarioController.loginUsuario);

// Obtener artista especifico sin restricciones
router.get('/artista/:id', usuarioController.obtenerArtistaPorId);

// Obtener usuario especifico
router.get('/:id', checkAuth, usuarioController.obtenerUsuarioPorId);

// Obtener todos los usuarios con opción de filtrar por rol
router.get('/', usuarioController.obtenerUsuarios);

// Actualizar datos generales del usuario
router.put('/datos/:id', checkAuth, usuarioController.actualizarDatos);

// Ruta para actualizar contraseña
router.put('/contrasena/:id', checkAuth, usuarioController.actualizarContraseña);

// Ruta para actualizar imagen de perfil
router.put('/imagen/:id', checkAuth, usuarioController.actualizarImagen);
// Ruta para eliminar imagen de perfil
router.delete('/imagen/:id', checkAuth, usuarioController.eliminarImagen);

// Ruta para actualizar el estado activo a false propietario y administrador
router.put('/activo/desactivar/:id', checkAuth,  usuarioController.actualizarActivoF);

// Ruta para actualizar el estado activo a true(solo administradores)
router.put('/activo/activar/:id', checkAuth,  usuarioController.actualizarActivoT);






module.exports = router;
